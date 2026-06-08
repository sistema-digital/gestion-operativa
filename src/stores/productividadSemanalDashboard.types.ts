import type { MaintenanceAreaTotalsMap, OrdenMantenimiento } from './maintenanceStore';
import type {
  HoraTrabajoData,
  HorasPerdidasPersonalRow,
  PersonalDisponibilidadSemanalRow,
} from './horasTrabajo.types';

export type ProductividadDashboardTabla =
  | 'avance_ideal_vs_real'
  | 'avance_concluido_semanal'
  | 'avance_equivalente'
  | 'avance_real_vs_avance_aproximado_sin_retrasos'
  | 'avance_perdido_por_falta_de_personal';

export type ProductividadDashboardScope =
  | 'general'
  | 'semana_actual'
  | 'semana_referencia';

export interface ProductividadDashboardInput {
  orders: OrdenMantenimiento[];
  horasTrabajo: HoraTrabajoData[];
  horasPerdidasPersonal: HorasPerdidasPersonalRow[];
  personalDisponibilidadSemanal: PersonalDisponibilidadSemanalRow[];
  zafraOrderTotalsByArea: MaintenanceAreaTotalsMap;
  zafraOrderTotalsGeneral: number;
  currentDate: Date;
  etapa: string;
}

export interface ProductividadDashboardColumn {
  key: string;
  label: string;
}

export interface AvanceIdealVsRealRow {
  area: string;
  area_corta: string;
  avance_ideal: number;
  avance_real: number;
  diferencia: number;
  ordenes_ideales: number;
  ordenes_reales: number;
  ordenes_totales: number;
}

export interface AvanceConcluidoSemanalRow {
  area: string;
  area_corta: string;
  avance_semana_anterior: number;
  avance_semana_actual: number;
  avance_acumulado: number;
  concluidas_semana_anterior: number;
  concluidas_semana_actual: number;
  concluidas_acumuladas: number;
}

export interface AvanceEquivalenteRow {
  area: string;
  area_corta: string;
  avance_2026: number;
  avance_2025: number;
  diferencia: number;
  concluidas: number;
  ordenes_totales: number;
}

export interface AvanceRealVsAproximadoRow {
  area: string;
  area_corta: string;
  denominador: number;
  concluidas: number;
  personal_activo: number;
  personal_faltante: number;
  avance_real: number;
  avance_perdido: number;
  avance_perdido_operativo: number;
  avance_perdido_personal: number;
  avance_sin_retrasos: number;
  horas_perdidas_totales: number;
  horas_perdidas_operativas: number;
  horas_perdidas_personal: number;
}

export interface AvancePerdidoPersonalRow {
  area: string;
  area_corta: string;
  denominador: number;
  personal_activo: number;
  personal_faltante: number;
  avance_perdido_personal: number;
  horas_perdidas_personal: number;
  horas_vacaciones: number;
  horas_incapacidad: number;
  horas_inactivo: number;
  horas_plaza_no_cubierta: number;
}

export interface ProductividadDashboardMeta {
  etapa: string;
  semanaActual: string;
  semanaReferencia: string;
}

export interface ProductividadDashboardTable<Row, TotalRow = Row> {
  tabla: ProductividadDashboardTabla;
  scope: ProductividadDashboardScope;
  columnas: ProductividadDashboardColumn[];
  filas: Row[];
  total: TotalRow | null;
  meta: ProductividadDashboardMeta;
}

export type ProductividadDashboardTableItem =
  | ProductividadDashboardTable<AvanceIdealVsRealRow>
  | ProductividadDashboardTable<AvanceConcluidoSemanalRow>
  | ProductividadDashboardTable<AvanceEquivalenteRow>
  | ProductividadDashboardTable<AvanceRealVsAproximadoRow>
  | ProductividadDashboardTable<AvancePerdidoPersonalRow>;
