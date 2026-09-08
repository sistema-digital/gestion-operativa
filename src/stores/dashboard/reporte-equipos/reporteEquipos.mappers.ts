import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentOperators,
  EngineUsage,
  OperatorDetail,
  EquipmentSummary,
  EquipmentStops,
} from "./reporteEquipos.types";
import type { z } from "zod";
import {
  contextSchema,
  equipmentListSchema,
  masterSchema,
  summarySchema,
  stopsSchema,
  equipmentOperatorsSchema,
  operatorDetailSchema,
} from "./reporteEquipos.schemas";

export const mapEquipmentList = (
  dto: z.infer<typeof equipmentListSchema>,
): EquipmentListItem[] =>
  dto.data.map((item) => ({
    code: item.cod_equipo,
    type: item.tipo,
    journeys: item.jornadas,
    totalTime: item.tiempo_total,
    totalSeconds: item.tiempo_total_segundos,
  }));
export const mapContext = (
  dto: z.infer<typeof contextSchema>,
): EquipmentContext => {
  const receivedEngine = dto.motor.map((row): EngineUsage => ({
    engineOn: row.motor_encendido,
    state: row.estado,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje,
    periods: row.periodos,
  }));
  const states: EngineUsage["state"][] = [
    "encendido",
    "apagado",
    "sin_definir",
  ];
  const engine = states.map(
    (state): EngineUsage =>
      receivedEngine.find((row) => row.state === state) ?? {
        engineOn:
          state === "encendido" ? true : state === "apagado" ? false : null,
        state,
        seconds: 0,
        time: "00:00",
        percentage: 0,
        periods: 0,
      },
  );

  return {
    code: dto.equipo_numero,
    journeys: dto.jornadas,
    firstActivity: dto.primera_actividad,
    lastActivity: dto.ultima_actividad,
    totalSeconds: dto.tiempo_total_segundos,
    totalTime: dto.tiempo_total,
    engine,
  };
};
export const mapSummary = (
  dto: z.infer<typeof summarySchema>,
): EquipmentSummary => ({
  code: dto.equipo_numero,
  recentLocation: dto.equipo.ubicacion_mas_reciente
    ? {
        latitude: dto.equipo.ubicacion_mas_reciente.latitud,
        longitude: dto.equipo.ubicacion_mas_reciente.longitud,
        occurredAt: dto.equipo.ubicacion_mas_reciente.ocurrio_en,
        occurredAtLocal: dto.equipo.ubicacion_mas_reciente.ocurrio_en_local,
        registeredAt: dto.equipo.ubicacion_mas_reciente.registrado_en,
        eventType: dto.equipo.ubicacion_mas_reciente.tipo_evento,
        farmName: null,
      }
    : null,
  totalSeconds: dto.metricas.tiempo_total_segundos,
  totalTime: dto.metricas.tiempo_total,
  engineOnSeconds: dto.metricas.tiempo_motor_encendido_segundos,
  engineOnTime: dto.metricas.tiempo_motor_encendido,
  engineOnPercentage: dto.metricas.porcentaje_motor_encendido,
  engineOffSeconds: dto.metricas.tiempo_motor_apagado_segundos,
  engineOffTime: dto.metricas.tiempo_motor_apagado,
  engineOffPercentage: dto.metricas.porcentaje_motor_apagado,
  engineUndefinedSeconds: dto.metricas.tiempo_motor_sin_definir_segundos,
  engineUndefinedTime: dto.metricas.tiempo_motor_sin_definir,
  engineUndefinedPercentage: dto.metricas.porcentaje_motor_sin_definir,
  classifications: dto.clasificaciones.map((row) => ({
    classification: row.clasificacion,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje,
  })),
  mainStops: dto.principales_paradas.map((row) => ({
    reason: row.motivo,
    occurrences: row.ocurrencias,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje_paradas,
  })),
  operators: dto.operadores.map((row) => ({
    operatorId: row.operador_id,
    operator: row.operador,
    journeys: row.jornadas,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje,
  })),
  implements: dto.implementos.map((row) => ({
    implementId: String(row.implemento_id),
    number: String(row.numero),
    description: row.descripcion,
    journeys: row.jornadas,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje_uso,
  })),
  history: dto.historial.map((row) => ({
    startAt: row.inicio,
    endAt: row.fin,
    startLocal: row.inicio_local,
    endLocal: row.fin_local,
    kind: row.tipo,
    detail: row.detalle,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
  })),
});
export const mapStops = (dto: z.infer<typeof stopsSchema>): EquipmentStops => ({
  code: dto.equipo_numero,
  metrics: {
    stoppedSeconds: dto.metricas.tiempo_parado_segundos,
    stoppedTime: dto.metricas.tiempo_parado,
    stoppedPercentage: dto.metricas.porcentaje_parado,
    stopCount: dto.metricas.cantidad_paradas,
    averageDurationSeconds: dto.metricas.duracion_promedio_segundos,
    averageDuration: dto.metricas.duracion_promedio,
  },
  classifications: dto.por_clasificacion.map((row) => ({
    classification: row.clasificacion,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    count: row.ocurrencias,
    percentage: row.porcentaje_paradas,
  })),
  origins: dto.por_origen.map((row) => ({
    origin: row.origen,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    count: row.ocurrencias,
    percentage: row.porcentaje_paradas,
  })),
  mainReasons: dto.principales_motivos.map((row) => ({
    reason: row.motivo,
    occurrences: row.ocurrencias,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje_paradas,
  })),
  details: dto.detalle.map((row) => ({
    startAt: row.inicio,
    endAt: row.fin,
    startLocal: row.inicio_local,
    endLocal: row.fin_local,
    duration: row.duracion,
    reason: row.motivo,
    origin: row.origen,
    classification: row.clasificacion,
    engineOn: row.motor_encendido,
    engine: row.motor,
    implement: row.implemento
      ? {
          id: String(row.implemento.id),
          number: String(row.implemento.numero),
          name: row.implemento.nombre,
        }
      : null,
  })),
});
export const mapMaster = (
  dto: z.infer<typeof masterSchema>,
): EquipmentMasterDetail | null =>
  dto.equipo
    ? {
        code: dto.equipo.cod_equipo,
        type: dto.equipo.tipo,
        model: dto.equipo.modelo,
        brand: dto.equipo.marca,
        active: dto.equipo.activo,
        imagePath: dto.equipo.imagen.tiene_imagen
          ? dto.equipo.imagen.storage_path
          : null,
        imageUrl: null,
      }
    : null;
export const mapEquipmentOperators = (
  dto: z.infer<typeof equipmentOperatorsSchema>,
): EquipmentOperators => ({
  code: dto.equipo_numero,
  metrics: {
    uniqueOperators: dto.metricas.operadores_unicos,
    totalSeconds: dto.metricas.tiempo_total_segundos,
    totalTime: dto.metricas.tiempo_total,
    journeys: dto.metricas.jornadas,
    topParticipation: dto.metricas.mayor_participacion
      ? {
          operatorId: dto.metricas.mayor_participacion.operador_id,
          operator: dto.metricas.mayor_participacion.operador,
          percentage: dto.metricas.mayor_participacion.porcentaje,
        }
      : null,
  },
  operators: dto.operadores.map((row) => ({
    operatorId: row.operador_id,
    operator: row.operador,
    journeys: row.jornadas,
    totalSeconds: row.tiempo_total_segundos,
    totalTime: row.tiempo_total,
    engineOnSeconds: row.tiempo_motor_encendido_segundos,
    engineOnTime: row.tiempo_motor_encendido,
    engineOnPercentage: row.porcentaje_motor_encendido,
    engineOffSeconds: row.tiempo_motor_apagado_segundos,
    engineOffTime: row.tiempo_motor_apagado,
    engineOffPercentage: row.porcentaje_motor_apagado,
    engineUndefinedSeconds: row.tiempo_motor_sin_definir_segundos,
    engineUndefinedTime: row.tiempo_motor_sin_definir,
    engineUndefinedPercentage: row.porcentaje_motor_sin_definir,
    percentage: row.porcentaje_uso,
    firstActivity: row.primera_actividad,
    lastActivity: row.ultima_actividad,
  })),
});
export const mapOperatorDetail = (
  dto: z.infer<typeof operatorDetailSchema>,
): OperatorDetail => ({
  code: dto.equipo_numero,
  operatorId: dto.operador.id,
  operatorLabel: dto.operador.label,
  journeys: dto.metricas.jornadas,
  totalSeconds: dto.metricas.tiempo_total_segundos,
  totalTime: dto.metricas.tiempo_total,
  engineOnSeconds: dto.metricas.tiempo_motor_encendido_segundos,
  engineOnTime: dto.metricas.tiempo_motor_encendido,
  engineOnPercentage: dto.metricas.porcentaje_motor_encendido,
  engineOffSeconds: dto.metricas.tiempo_motor_apagado_segundos,
  engineOffTime: dto.metricas.tiempo_motor_apagado,
  engineOffPercentage: dto.metricas.porcentaje_motor_apagado,
  engineUndefinedSeconds: dto.metricas.tiempo_motor_sin_definir_segundos,
  engineUndefinedTime: dto.metricas.tiempo_motor_sin_definir,
  engineUndefinedPercentage: dto.metricas.porcentaje_motor_sin_definir,
  classificationDistribution: dto.distribucion_clasificacion.map((row) => ({
    classification: row.clasificacion,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje,
  })),
  mainStops: dto.principales_paradas.map((row) => ({
    reason: row.motivo,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje_paradas,
  })),
  history: dto.historial.map((row) => ({
    startAt: row.inicio,
    endAt: row.fin,
    startLocal: row.inicio_local,
    endLocal: row.fin_local,
    kind: row.tipo,
    detail: row.detalle,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
  })),
});
