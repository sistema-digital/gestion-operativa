export interface HorasPerdidasResumenMetricas {
  dias_evaluados: number;
  horas_perdidas: number;
  personal_activo_actual: number;
  jornadas_mecanico_perdidas: number;
  promedio_mecanicos_necesarios: number;
  mecanicos_necesarios_redondeado: number;
}

export interface HorasPerdidasPorAreaItem extends HorasPerdidasResumenMetricas {
  area: string;
  porcentaje_total: number;
}

export interface HorasPerdidasPorMotivoItem extends HorasPerdidasResumenMetricas {
  motivo: string;
  porcentaje_total: number;
}

export interface HorasPerdidasMotivoPorAreaItem extends HorasPerdidasResumenMetricas {
  area: string;
  motivo: string;
  porcentaje_area: number;
}

export interface HorasPerdidasPersonalResumenItem {
  por_area: HorasPerdidasPorAreaItem[];
  por_motivo: HorasPerdidasPorMotivoItem[];
  fecha_desde: string;
  motivos_por_area: HorasPerdidasMotivoPorAreaItem[];
  horas_por_jornada: number;
  personal_activo_actual_total: number;
}

export type ObtenerHorasPerdidasPersonalResumenResponse =
  HorasPerdidasPersonalResumenItem;

export interface ObtenerHorasPerdidasPersonalResumenParams {
  p_fecha_desde: string;
}

export interface HorasPerdidasAreaMotivoState {
  resumen: ObtenerHorasPerdidasPersonalResumenResponse | null;
  fechaConsultada: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

export interface HorasPerdidasAreaMotivoTableRow {
  id: string;
  area: string;
  areaCorta: string;
  motivo: string;
  horasPerdidas: number;
  tiempoPerdido: string;
  cantidadPersonal: number;
  personalActivo: number;
  porcentajeArea: number;
  porcentajePerdidaAvance: number;
  motivoLabel: string;
  porcentajePerdidaAvanceLabel: string;
  personalFaltanteLabel: string;
  personalActivoLabel: string;
  rowspan: number;
  mostrarArea: boolean;
  esFilaTotal: boolean;
  sinDatos: boolean;
}

export interface HorasPerdidasAreaResumenTableRow {
  id: string;
  area: string;
  areaCorta: string;
  horasPerdidas: number;
  personalFaltante: number;
  personalActivo: number;
  porcentajePerdidaAvance: number;
  horasPerdidasLabel: string;
  porcentajePerdidaAvanceLabel: string;
  personalFaltanteLabel: string;
  personalActivoLabel: string;
  esFilaTotal: boolean;
  sinDatos: boolean;
}
