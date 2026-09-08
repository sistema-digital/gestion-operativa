import { supabaseCapturaOperador, supabaseEquipos } from "@/lib/supabase";
import {
  activityTeamsEquipmentTypesSchema,
  activityTeamsReportSchema,
} from "./resumenActividadEquipos.schemas";
import type {
  ActivityTeamsEquipmentType,
  ActivityTeamsFilters,
  ActivityTeamsReport,
} from "./resumenActividadEquipos.types";

function throwRemoteError(
  message: string | undefined,
  fallback: string,
): never {
  throw new Error(message || fallback);
}

function dayFromResponse(day: {
  fecha: string;
  dia_semana: string;
  equipos: number;
  jornadas: number;
  tiempo_motor_encendido: string;
  porcentaje_motor_encendido: number;
  tiempo_motor_apagado: string;
  porcentaje_motor_apagado: number;
  tiempo_motor_sin_definir: string;
  porcentaje_motor_sin_definir: number;
}) {
  return {
    date: day.fecha,
    weekday: day.dia_semana,
    equipment: day.equipos,
    journeys: day.jornadas,
    engineOnTime: day.tiempo_motor_encendido,
    engineOnPercentage: day.porcentaje_motor_encendido,
    engineOffTime: day.tiempo_motor_apagado,
    engineOffPercentage: day.porcentaje_motor_apagado,
    engineUndefinedTime: day.tiempo_motor_sin_definir,
    engineUndefinedPercentage: day.porcentaje_motor_sin_definir,
  };
}

function rankingSecondary(item: {
  tiempo_motor_encendido: string;
  tiempo_motor_apagado: string;
}): string {
  return `${item.tiempo_motor_encendido} encendido · ${item.tiempo_motor_apagado} apagado`;
}

export const activityTeamsSummaryService = {
  async loadReport(
    filters: ActivityTeamsFilters,
  ): Promise<ActivityTeamsReport> {
    const { data, error } = await supabaseCapturaOperador.rpc(
      "rpc_reporte_actividad_equipos_general",
      { p_desde: filters.startDate, p_hasta: filters.endDate },
    );
    if (error) {
      return throwRemoteError(
        error.message,
        "No se pudo cargar el resumen de actividad.",
      );
    }

    const response = activityTeamsReportSchema.parse(data);
    const {
      resumen,
      mejor_dia,
      peor_dia,
      top_labores,
      top_causas_parada,
      rendimiento_equipos,
    } = response.diapositiva_1;
    const {
      actividad_diaria,
      mejores_equipos,
      peores_equipos,
      top_operadores,
    } = response.diapositiva_2;

    return {
      range: {
        startDate: response.rango.desde,
        endDate: response.rango.hasta,
        timezone: response.rango.zona_horaria,
      },
      totals: {
        equipment: resumen.equipos,
        journeys: resumen.jornadas,
        totalSeconds: resumen.tiempo_total_segundos,
        totalTime: resumen.tiempo_total,
        engineOnSeconds: resumen.tiempo_motor_encendido_segundos,
        engineOnTime: resumen.tiempo_motor_encendido,
        engineOnPercentage: resumen.porcentaje_motor_encendido,
        engineOffSeconds: resumen.tiempo_motor_apagado_segundos,
        engineOffTime: resumen.tiempo_motor_apagado,
        engineOffPercentage: resumen.porcentaje_motor_apagado,
        engineUndefinedSeconds: resumen.tiempo_motor_sin_definir_segundos,
        engineUndefinedTime: resumen.tiempo_motor_sin_definir,
        engineUndefinedPercentage: resumen.porcentaje_motor_sin_definir,
      },
      bestDay: mejor_dia ? dayFromResponse(mejor_dia) : null,
      worstDay: peor_dia ? dayFromResponse(peor_dia) : null,
      topJobs: top_labores.map((item) => ({
        label: item.labor,
        value: `${item.porcentaje_tiempo_motor_encendido.toFixed(1)}%`,
        percentage: item.porcentaje_tiempo_motor_encendido,
        secondary: `${item.tiempo} · ${item.jornadas} jornadas`,
        supportingMetric: null,
      })),
      topStopReasons: top_causas_parada.map((item) => ({
        label: item.motivo,
        value: `${item.porcentaje_paradas.toFixed(1)}%`,
        percentage: item.porcentaje_paradas,
        secondary: item.tiempo,
        supportingMetric: null,
      })),
      equipmentPerformance: rendimiento_equipos.map((item) => ({
        code: item.equipo_numero,
        type: null,
        engineOnSeconds: item.tiempo_motor_encendido_segundos,
        engineOffSeconds: item.tiempo_motor_apagado_segundos,
        engineUndefinedSeconds: item.tiempo_motor_sin_definir_segundos,
        totalSeconds: item.tiempo_total_segundos,
      })),
      dailyActivity: actividad_diaria.map(dayFromResponse),
      bestEquipment: mejores_equipos.map((item) => ({
        label: item.equipo_numero,
        value: `${item.porcentaje_motor_encendido.toFixed(1)}%`,
        percentage: item.porcentaje_motor_encendido,
        secondary: rankingSecondary(item),
        supportingMetric: null,
      })),
      worstEquipment: peores_equipos.map((item) => ({
        label: item.equipo_numero,
        value: `${item.porcentaje_motor_encendido.toFixed(1)}%`,
        percentage: item.porcentaje_motor_encendido,
        secondary: rankingSecondary(item),
        supportingMetric: `${item.porcentaje_motor_apagado.toFixed(1)}% motor apagado`,
      })),
      topOperators: top_operadores.map((item) => ({
        label: item.operador,
        value: item.tiempo_motor_encendido,
        percentage: item.porcentaje_motor_encendido,
        secondary: `${item.porcentaje_motor_encendido.toFixed(1)}% encendido · ${item.tiempo_motor_apagado} apagado`,
        supportingMetric: null,
      })),
    };
  },

  async loadEquipmentTypes(
    codes: string[],
  ): Promise<ActivityTeamsEquipmentType[]> {
    if (!codes.length) return [];
    const { data, error } = await supabaseEquipos.rpc(
      "rpc_equipos_tipos_por_codigos",
      { p_equipos: codes },
    );
    if (error) {
      return throwRemoteError(
        error.message,
        "No se pudieron cargar los tipos de equipo.",
      );
    }
    return activityTeamsEquipmentTypesSchema
      .parse(data)
      .data.map((item) => ({ code: item.equipo_numero, type: item.tipo }));
  },
};
