import { supabase, supabaseRatings } from "@/lib/supabase";
import { z } from "zod";
import type {
  DeleteMeetingRatingPayload,
  RatingsAccessScope,
  RatingsFetchScope,
  PuntuacionSupervisoresOtResponse,
  RatingsSnapshot,
  UpsertMeetingRatingPayload,
  UpsertMeetingRatingResult,
} from "./ratingsStore.types";
import { removeMeetingObservationBlock } from "@/utils/meetingRatings";

const meetingInspectionSchema = z.object({
  id_inspeccion: z.number(),
  fecha: z.string(),
  hora: z.string(),
  foto_url: z.string().nullable(),
  observacion: z.string().nullable(),
  id_supervisor: z.number(),
  id_inspector: z.number(),
});

const meetingDetailSchema = z.object({
  id_inspeccion: z.number(),
  id_criterio: z.number(),
  puntuacion: z.number(),
});

const ratingsSnapshotSchema = z.object({
  empleados: z.array(
    z.object({
      id_empleado: z.number(),
      nombre_completo: z.string(),
      email: z.string(),
      rol: z.string(),
      activo: z.boolean(),
    }),
  ),
  criterios: z.array(
    z.object({
      id_criterio: z.number(),
      descripcion_tarea: z.string(),
    }),
  ),
  niveles: z.array(
    z.object({
      puntuacion: z.number(),
      etiqueta: z.string(),
    }),
  ),
  inspecciones: z.array(meetingInspectionSchema),
  detalles: z.array(
    z.object({
      id_inspeccion: z.number(),
      id_criterio: z.number(),
      puntuacion: z.number(),
      created_at: z.string().nullable(),
    }),
  ),
});

const buildSnapshotPayload = (
  scope: RatingsFetchScope,
  access: RatingsAccessScope,
) => {
  const dateRange =
    scope.mode === "date-range"
      ? { from: scope.from, to: scope.to }
      : scope.mode === "single-date"
        ? { from: scope.date, to: scope.date }
        : { from: null, to: null };

  return {
    p_fecha_desde: dateRange.from,
    p_fecha_hasta: dateRange.to,
    p_id_supervisor: null,
    p_email_empleado: access.mode === "current-employee" ? access.email : null,
  };
};

export const ratingsService = {
  async fetchSnapshot(
    scope: RatingsFetchScope,
    access: RatingsAccessScope,
  ): Promise<RatingsSnapshot> {
    const { data, error } = await supabaseRatings.rpc(
      "rpc_calificaciones_snapshot",
      buildSnapshotPayload(scope, access),
    );

    if (error) {
      throw new Error(error.message);
    }

    return ratingsSnapshotSchema.parse(data);
  },

  async fetchPuntuacionSupervisoresOt(
    fecha: string,
  ): Promise<PuntuacionSupervisoresOtResponse> {
    const { data, error } = await supabase.rpc(
      "rpc_puntuacion_supervisores_ot",
      {
        p_fecha: fecha,
      },
    );

    if (error) {
      throw new Error(
        error.message || "No se pudo cargar la puntuación de supervisores OT",
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error(
        "La RPC de puntuación de supervisores OT no devolvió una respuesta válida",
      );
    }

    return data as PuntuacionSupervisoresOtResponse;
  },

  async deleteInspeccion(inspectionId: number): Promise<void> {
    const { error: detailsError } = await supabaseRatings
      .from("inspecciones_detalle")
      .delete()
      .eq("id_inspeccion", inspectionId);

    if (detailsError) {
      throw new Error(
        detailsError.message ||
          "No se pudieron eliminar los detalles de la inspeccion",
      );
    }

    const { error: inspectionError } = await supabaseRatings
      .from("inspecciones")
      .delete()
      .eq("id_inspeccion", inspectionId);

    if (inspectionError) {
      throw new Error(
        inspectionError.message || "No se pudo eliminar la inspeccion",
      );
    }
  },

  async upsertMeetingRating(
    payload: UpsertMeetingRatingPayload,
  ): Promise<UpsertMeetingRatingResult> {
    const observation = payload.observacion.trim() || null;
    const inspectionId = payload.inspectionId || Date.now();
    const inspectionQuery = payload.inspectionId
      ? supabaseRatings
          .from("inspecciones")
          .update({ observacion: observation })
          .eq("id_inspeccion", inspectionId)
      : supabaseRatings.from("inspecciones").insert({
          id_inspeccion: inspectionId,
          fecha: payload.fecha,
          hora: payload.hora,
          foto_url: null,
          observacion: observation,
          id_supervisor: payload.id_supervisor,
          id_inspector: payload.id_inspector,
        });
    const { data: inspectionData, error: inspectionError } =
      await inspectionQuery
        .select(
          "id_inspeccion, fecha, hora, foto_url, observacion, id_supervisor, id_inspector",
        )
        .single();

    if (inspectionError) {
      throw new Error(
        inspectionError.message || "No se pudo actualizar la reunion",
      );
    }

    const { data: detailData, error: detailError } = await supabaseRatings
      .from("inspecciones_detalle")
      .upsert(
        {
          id_inspeccion: inspectionId,
          id_criterio: payload.meetingCriterionId,
          puntuacion: payload.puntuacion,
        },
        { onConflict: "id_inspeccion,id_criterio" },
      )
      .select("id_inspeccion, id_criterio, puntuacion")
      .single();

    if (detailError) {
      if (!payload.inspectionId) {
        await supabaseRatings
          .from("inspecciones")
          .delete()
          .eq("id_inspeccion", inspectionId);
      }

      throw new Error(
        detailError.message || "No se pudo guardar la puntuacion de reunion",
      );
    }

    return {
      inspection: meetingInspectionSchema.parse(inspectionData),
      detail: meetingDetailSchema.parse(detailData),
    };
  },

  async deleteMeetingRating(
    payload: DeleteMeetingRatingPayload,
  ): Promise<void> {
    const { data: inspectionRecord, error: inspectionFetchError } =
      await supabaseRatings
        .from("inspecciones")
        .select("observacion")
        .eq("id_inspeccion", payload.inspectionId)
        .maybeSingle();

    if (inspectionFetchError) {
      throw new Error(
        inspectionFetchError.message ||
          "No se pudo cargar la reunion a eliminar",
      );
    }

    const nextObservation = removeMeetingObservationBlock(
      inspectionRecord?.observacion || "",
    );

    const { error: detailDeleteError } = await supabaseRatings
      .from("inspecciones_detalle")
      .delete()
      .eq("id_inspeccion", payload.inspectionId)
      .eq("id_criterio", payload.meetingCriterionId);

    if (detailDeleteError) {
      throw new Error(
        detailDeleteError.message ||
          "No se pudo eliminar la puntuacion de reunion",
      );
    }

    const { error: inspectionUpdateError } = await supabaseRatings
      .from("inspecciones")
      .update({
        observacion: nextObservation || null,
      })
      .eq("id_inspeccion", payload.inspectionId);

    if (inspectionUpdateError) {
      throw new Error(
        inspectionUpdateError.message ||
          "No se pudo limpiar la observacion de reunion",
      );
    }
  },
};
