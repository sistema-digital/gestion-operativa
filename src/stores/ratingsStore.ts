import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ratingsService } from "./ratingsStore.service";
import type {
  DeleteMeetingRatingPayload,
  RatingsAccessScope,
  RatingsCriterio,
  RatingsDateRange,
  RatingsFetchScope,
  RatingsNivel,
  PuntuacionSupervisoresOtResponse,
  RatingsDetalle,
  RatingsEmpleado,
  RatingsInspeccion,
  RatingsInspeccionNormalizada,
  UpsertMeetingRatingPayload,
} from "./ratingsStore.types";

const addDaysToDateString = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

const mergeDateRanges = (ranges: RatingsDateRange[]): RatingsDateRange[] => {
  const sortedRanges = [...ranges].sort((left, right) =>
    left.from.localeCompare(right.from),
  );
  const mergedRanges: RatingsDateRange[] = [];

  sortedRanges.forEach((range) => {
    const previousRange = mergedRanges.at(-1);

    if (
      !previousRange ||
      range.from > addDaysToDateString(previousRange.to, 1)
    ) {
      mergedRanges.push({ ...range });
      return;
    }

    if (range.to > previousRange.to) {
      previousRange.to = range.to;
    }
  });

  return mergedRanges;
};

const getMissingDateRanges = (
  targetRange: RatingsDateRange,
  coveredRanges: RatingsDateRange[],
): RatingsDateRange[] => {
  const missingRanges: RatingsDateRange[] = [];
  let nextDate = targetRange.from;

  mergeDateRanges(coveredRanges).forEach((coveredRange) => {
    if (coveredRange.to < nextDate || coveredRange.from > targetRange.to) {
      return;
    }

    if (coveredRange.from > nextDate) {
      missingRanges.push({
        from: nextDate,
        to: addDaysToDateString(coveredRange.from, -1),
      });
    }

    if (coveredRange.to >= nextDate) {
      nextDate = addDaysToDateString(coveredRange.to, 1);
    }
  });

  if (nextDate <= targetRange.to) {
    missingRanges.push({ from: nextDate, to: targetRange.to });
  }

  return missingRanges;
};

const getScopeDateRange = (
  scope: RatingsFetchScope,
): RatingsDateRange | null => {
  if (scope.mode === "single-date") {
    return { from: scope.date, to: scope.date };
  }

  if (scope.mode === "date-range") {
    return { from: scope.from, to: scope.to };
  }

  return null;
};

export const useRatingsStore = defineStore("ratings", () => {
  const empleados = ref<RatingsEmpleado[]>([]);
  const criterios = ref<RatingsCriterio[]>([]);
  const niveles = ref<RatingsNivel[]>([]);
  const inspecciones = ref<RatingsInspeccion[]>([]);
  const detalles = ref<RatingsDetalle[]>([]);
  const puntuacionSupervisoresOt = ref<PuntuacionSupervisoresOtResponse | null>(
    null,
  );
  const fechaPuntuacionSupervisoresOt = ref<string | null>(null);

  const isLoaded = ref(false);
  const isLoading = ref(false);
  const isPuntuacionSupervisoresOtLoading = ref(false);
  const errorPuntuacionSupervisoresOt = ref<string | null>(null);
  const loadedInspectionRangesByAccess = ref<
    Record<string, RatingsDateRange[]>
  >({});
  const fullHistoryAccessKey = ref<string | null>(null);
  const activeAccessKey = ref<string | null>(null);

  const sortRatingsState = (): void => {
    criterios.value = [...criterios.value].sort(
      (left, right) => left.id_criterio - right.id_criterio,
    );
    niveles.value = [...niveles.value].sort(
      (left, right) => left.puntuacion - right.puntuacion,
    );
    inspecciones.value = [...inspecciones.value].sort((left, right) =>
      `${right.fecha}T${right.hora}`.localeCompare(
        `${left.fecha}T${left.hora}`,
      ),
    );
    detalles.value = [...detalles.value].sort(
      (left, right) =>
        right.id_inspeccion - left.id_inspeccion ||
        left.id_criterio - right.id_criterio,
    );
  };

  const mergeSnapshot = (
    snapshot: Awaited<ReturnType<typeof ratingsService.fetchSnapshot>>,
  ): void => {
    empleados.value = snapshot.empleados;
    criterios.value = snapshot.criterios;
    niveles.value = snapshot.niveles;

    const inspectionsById = new Map(
      inspecciones.value.map((inspection) => [
        inspection.id_inspeccion,
        inspection,
      ]),
    );
    snapshot.inspecciones.forEach((inspection) => {
      inspectionsById.set(inspection.id_inspeccion, inspection);
    });
    inspecciones.value = [...inspectionsById.values()];

    const detailsByKey = new Map(
      detalles.value.map((detail) => [
        `${detail.id_inspeccion}-${detail.id_criterio}`,
        detail,
      ]),
    );
    snapshot.detalles.forEach((detail) => {
      detailsByKey.set(`${detail.id_inspeccion}-${detail.id_criterio}`, detail);
    });
    detalles.value = [...detailsByKey.values()];

    sortRatingsState();
  };

  const replaceSnapshotRange = (range: RatingsDateRange): void => {
    const inspectionIdsToReplace = new Set(
      inspecciones.value
        .filter(
          (inspection) =>
            inspection.fecha >= range.from && inspection.fecha <= range.to,
        )
        .map((inspection) => inspection.id_inspeccion),
    );

    inspecciones.value = inspecciones.value.filter(
      (inspection) => !inspectionIdsToReplace.has(inspection.id_inspeccion),
    );
    detalles.value = detalles.value.filter(
      (detail) => !inspectionIdsToReplace.has(detail.id_inspeccion),
    );
  };

  const clearRatingsState = (): void => {
    empleados.value = [];
    criterios.value = [];
    niveles.value = [];
    inspecciones.value = [];
    detalles.value = [];
    loadedInspectionRangesByAccess.value = {};
    fullHistoryAccessKey.value = null;
    isLoaded.value = false;
  };

  const fetchAll = async (
    force = false,
    scope: RatingsFetchScope = { mode: "all" },
    access: RatingsAccessScope = { mode: "all" },
  ) => {
    const accessKey = JSON.stringify(access);
    const targetRange = getScopeDateRange(scope);

    if (activeAccessKey.value && activeAccessKey.value !== accessKey) {
      clearRatingsState();
    }
    activeAccessKey.value = accessKey;

    if (
      !force &&
      (scope.mode === "all"
        ? fullHistoryAccessKey.value === accessKey
        : fullHistoryAccessKey.value === accessKey ||
          (targetRange !== null &&
            getMissingDateRanges(
              targetRange,
              loadedInspectionRangesByAccess.value[accessKey] || [],
            ).length === 0))
    ) {
      return;
    }

    isLoading.value = true;
    try {
      if (scope.mode === "all") {
        const snapshot = await ratingsService.fetchSnapshot(scope, access);

        empleados.value = snapshot.empleados;
        criterios.value = snapshot.criterios;
        niveles.value = snapshot.niveles;
        inspecciones.value = snapshot.inspecciones;
        detalles.value = snapshot.detalles;
        sortRatingsState();
        fullHistoryAccessKey.value = accessKey;
      } else if (targetRange !== null) {
        const coveredRanges =
          loadedInspectionRangesByAccess.value[accessKey] || [];
        const rangesToFetch = force
          ? [targetRange]
          : getMissingDateRanges(targetRange, coveredRanges);
        let nextCoveredRanges = coveredRanges;

        for (const range of rangesToFetch) {
          const snapshot = await ratingsService.fetchSnapshot(
            { mode: "date-range", from: range.from, to: range.to },
            access,
          );

          if (force) {
            replaceSnapshotRange(range);
          }

          mergeSnapshot(snapshot);
          nextCoveredRanges = mergeDateRanges([...nextCoveredRanges, range]);
          loadedInspectionRangesByAccess.value = {
            ...loadedInspectionRangesByAccess.value,
            [accessKey]: nextCoveredRanges,
          };
        }
      }

      isLoaded.value = true;
    } catch (e) {
      console.error("Error fetching ratings state", e);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchPuntuacionSupervisoresOt = async (
    fecha: string,
    force = false,
  ): Promise<PuntuacionSupervisoresOtResponse> => {
    if (
      puntuacionSupervisoresOt.value &&
      fechaPuntuacionSupervisoresOt.value === fecha &&
      !force
    ) {
      return puntuacionSupervisoresOt.value;
    }

    isPuntuacionSupervisoresOtLoading.value = true;
    errorPuntuacionSupervisoresOt.value = null;

    try {
      const response =
        await ratingsService.fetchPuntuacionSupervisoresOt(fecha);
      puntuacionSupervisoresOt.value = response;
      fechaPuntuacionSupervisoresOt.value = fecha;

      if (!response.ok) {
        errorPuntuacionSupervisoresOt.value = response.error;
      }

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cargar la puntuación de supervisores OT";

      errorPuntuacionSupervisoresOt.value = message;
      throw error;
    } finally {
      isPuntuacionSupervisoresOtLoading.value = false;
    }
  };

  const normalizedInspections = computed<RatingsInspeccionNormalizada[]>(() => {
    return inspecciones.value.map((insp) => {
      const inspId = insp.id_inspeccion || insp.id;
      const misDetalles = detalles.value.filter(
        (d) => d.id_inspeccion === inspId,
      );

      let sum = 0;
      let count = 0;
      misDetalles.forEach((d) => {
        if (typeof d.puntuacion === "number") {
          sum += d.puntuacion;
          count++;
        }
      });
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

      return {
        ...insp,
        final_supervisor_id: insp.id_supervisor || insp.supervisor_id || 0,
        final_inspector_id: insp.id_inspector || insp.inspector_id || 0,
        puntuacion_promedio: avg,
        id_inspeccion: inspId || 0,
      };
    });
  });

  const validSupervisors = computed(() => {
    return empleados.value.filter(
      (e) => e.rol && e.rol.toLowerCase().trim() === "supervisor",
    );
  });

  const removeInspectionFromState = (inspectionId: number) => {
    inspecciones.value = inspecciones.value.filter((insp) => {
      const currentInspectionId = insp.id_inspeccion || insp.id || 0;
      return currentInspectionId !== inspectionId;
    });

    detalles.value = detalles.value.filter(
      (detalle) => detalle.id_inspeccion !== inspectionId,
    );
  };

  const deleteInspection = async (inspectionId: number) => {
    await ratingsService.deleteInspeccion(inspectionId);
    removeInspectionFromState(inspectionId);
  };

  const upsertMeetingRating = async (payload: UpsertMeetingRatingPayload) => {
    const result = await ratingsService.upsertMeetingRating(payload);
    const inspectionIndex = inspecciones.value.findIndex(
      (inspection) =>
        (inspection.id_inspeccion || inspection.id) ===
        result.inspection.id_inspeccion,
    );
    const detailIndex = detalles.value.findIndex(
      (detail) =>
        detail.id_inspeccion === result.detail.id_inspeccion &&
        detail.id_criterio === result.detail.id_criterio,
    );

    if (inspectionIndex === -1) {
      inspecciones.value = [result.inspection, ...inspecciones.value];
    } else {
      inspecciones.value = inspecciones.value.map((inspection, index) =>
        index === inspectionIndex ? result.inspection : inspection,
      );
    }

    if (detailIndex === -1) {
      detalles.value = [...detalles.value, result.detail];
    } else {
      detalles.value = detalles.value.map((detail, index) =>
        index === detailIndex ? result.detail : detail,
      );
    }

    return result;
  };

  const deleteMeetingRating = async (payload: DeleteMeetingRatingPayload) => {
    await ratingsService.deleteMeetingRating(payload);
  };

  return {
    empleados,
    criterios,
    niveles,
    inspecciones,
    detalles,
    puntuacionSupervisoresOt,
    fechaPuntuacionSupervisoresOt,
    isLoaded,
    isLoading,
    isPuntuacionSupervisoresOtLoading,
    errorPuntuacionSupervisoresOt,
    loadedInspectionRangesByAccess,
    fullHistoryAccessKey,
    activeAccessKey,
    fetchAll,
    fetchPuntuacionSupervisoresOt,
    deleteInspection,
    upsertMeetingRating,
    deleteMeetingRating,
    normalizedInspections,
    validSupervisors,
  };
});
