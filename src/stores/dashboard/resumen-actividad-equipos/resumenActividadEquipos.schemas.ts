import { z } from "zod";

const optionalTextSchema = z.string().nullable();

const activityDaySchema = z.object({
  fecha: z.string(),
  dia_semana: z.string(),
  equipos: z.number(),
  jornadas: z.number(),
  tiempo_total: z.string(),
  tiempo_motor_encendido: z.string(),
  porcentaje_motor_encendido: z.number(),
  tiempo_motor_apagado: z.string(),
  porcentaje_motor_apagado: z.number(),
  tiempo_motor_sin_definir: z.string().default("00:00"),
  porcentaje_motor_sin_definir: z.number().default(0),
});

const highlightedDaySchema = z.object({
  fecha: z.string(),
  dia_semana: z.string(),
  equipos: z.number(),
  jornadas: z.number(),
  tiempo_motor_encendido: z.string(),
  porcentaje_motor_encendido: z.number(),
  tiempo_motor_apagado: z.string(),
  porcentaje_motor_apagado: z.number(),
  tiempo_motor_sin_definir: z.string().default("00:00"),
  porcentaje_motor_sin_definir: z.number().default(0),
});

const performanceSchema = z.object({
  equipo_numero: z.string(),
  tiempo_motor_encendido_segundos: z.number(),
  tiempo_motor_apagado_segundos: z.number(),
  tiempo_motor_sin_definir_segundos: z.number().default(0),
  tiempo_total_segundos: z.number(),
});

const jobSchema = z.object({
  labor: z.string(),
  tiempo: z.string(),
  porcentaje_tiempo_motor_encendido: z.number(),
  jornadas: z.number(),
});

const stopReasonSchema = z.object({
  motivo: z.string(),
  tiempo: z.string(),
  porcentaje_paradas: z.number(),
  ocurrencias: z.number(),
});

const equipmentRankingSchema = z.object({
  equipo_numero: z.string(),
  porcentaje_motor_encendido: z.number(),
  porcentaje_motor_apagado: z.number(),
  porcentaje_motor_sin_definir: z.number().default(0),
  tiempo_motor_encendido_segundos: z.number(),
  tiempo_motor_encendido: z.string(),
  tiempo_motor_apagado_segundos: z.number(),
  tiempo_motor_apagado: z.string(),
  tiempo_motor_sin_definir_segundos: z.number().default(0),
  tiempo_motor_sin_definir: z.string().default("00:00"),
  tiempo_total_segundos: z.number(),
  tiempo_total: z.string(),
  jornadas: z.number().optional(),
  tiempo_motor_productivo_segundos: z.number().nonnegative(),
  tiempo_motor_productivo: z.string(),
  indice_uso_motor_productivo: z.number().min(0).max(100),
  dias_activos: z.number().int().nonnegative(),
  cumple_minimo_horas: z.boolean(),
  cumple_minimo_dias: z.boolean(),
  datos_suficientes: z.boolean(),
  indice_ranking: z.number().optional(),
});

const operatorSchema = z.object({
  operador: z.string(),
  porcentaje_motor_encendido: z.number(),
  porcentaje_motor_apagado: z.number(),
  porcentaje_motor_sin_definir: z.number().default(0),
  tiempo_motor_encendido: z.string(),
  tiempo_motor_apagado: z.string(),
  tiempo_motor_sin_definir: z.string().default("00:00"),
  tiempo_total: z.string(),
});

export const activityTeamsReportSchema = z.object({
  rango: z.object({
    desde: z.string(),
    hasta: z.string(),
    zona_horaria: z.string(),
  }),
  diapositiva_1: z.object({
    resumen: z.object({
      equipos: z.number(),
      jornadas: z.number(),
      tiempo_total_segundos: z.number(),
      tiempo_total: z.string(),
      tiempo_motor_encendido_segundos: z.number(),
      tiempo_motor_encendido: z.string(),
      porcentaje_motor_encendido: z.number(),
      tiempo_motor_apagado_segundos: z.number(),
      tiempo_motor_apagado: z.string(),
      porcentaje_motor_apagado: z.number(),
      tiempo_motor_sin_definir_segundos: z.number(),
      tiempo_motor_sin_definir: z.string(),
      porcentaje_motor_sin_definir: z.number(),
    }),
    mejor_dia: highlightedDaySchema.nullable(),
    peor_dia: highlightedDaySchema.nullable(),
    top_labores: z.array(jobSchema),
    top_causas_parada: z.array(stopReasonSchema),
    rendimiento_equipos: z.array(performanceSchema),
  }),
  diapositiva_2: z.object({
    actividad_diaria: z.array(activityDaySchema),
    mejores_equipos: z.array(equipmentRankingSchema),
    peores_equipos: z.array(equipmentRankingSchema),
    top_operadores: z.array(operatorSchema),
  }),
});

export const activityTeamsEquipmentTypesSchema = z.object({
  data: z.array(
    z.object({
      equipo_numero: z.string(),
      tipo: optionalTextSchema,
    }),
  ),
});

export type ActivityTeamsReportResponse = z.infer<
  typeof activityTeamsReportSchema
>;
