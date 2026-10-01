import { defineStore } from "pinia";
import { ref } from "vue";
import { horasPerdidasAreaMotivoService } from "./horasPerdidasAreaMotivo.service";
import type { ObtenerHorasPerdidasPersonalResumenResponse } from "./horasPerdidasAreaMotivo.types";

export const useHorasPerdidasAreaMotivoStore = defineStore(
  "horasPerdidasAreaMotivo",
  () => {
    const resumen = ref<ObtenerHorasPerdidasPersonalResumenResponse | null>(
      null,
    );
    const fechaConsultada = ref<string | null>(null);
    const isLoading = ref(false);
    const isLoaded = ref(false);
    const error = ref<string | null>(null);
    let resumenLoadPromise: Promise<ObtenerHorasPerdidasPersonalResumenResponse> | null =
      null;
    let loadingFecha: string | null = null;

    const cargarResumen = async (
      fechaDesde: string,
      force = false,
    ): Promise<ObtenerHorasPerdidasPersonalResumenResponse> => {
      if (resumenLoadPromise) {
        if (loadingFecha === fechaDesde && !force) {
          return resumenLoadPromise;
        }
        try {
          await resumenLoadPromise;
        } catch {
          // Una carga anterior fallida no impide consultar otra fecha.
        }
      }

      if (
        isLoaded.value &&
        resumen.value &&
        fechaConsultada.value === fechaDesde &&
        !force
      ) {
        return resumen.value;
      }

      loadingFecha = fechaDesde;
      const request = (async () => {
        isLoading.value = true;
        error.value = null;

        try {
          const response = await horasPerdidasAreaMotivoService.obtenerResumen({
            p_fecha_desde: fechaDesde,
          });
          resumen.value = response;
          fechaConsultada.value = fechaDesde;
          isLoaded.value = true;
          return response;
        } catch (err) {
          isLoaded.value = false;
          fechaConsultada.value = null;
          error.value =
            err instanceof Error
              ? err.message
              : "No se pudo cargar el resumen de horas perdidas por area y motivo";
          throw err;
        } finally {
          isLoading.value = false;
        }
      })();

      resumenLoadPromise = request;
      try {
        return await request;
      } finally {
        if (resumenLoadPromise === request) {
          resumenLoadPromise = null;
          loadingFecha = null;
        }
      }
    };

    const reset = () => {
      resumen.value = null;
      fechaConsultada.value = null;
      isLoading.value = false;
      isLoaded.value = false;
      error.value = null;
    };

    return {
      resumen,
      fechaConsultada,
      isLoading,
      isLoaded,
      error,
      cargarResumen,
      reset,
    };
  },
);
