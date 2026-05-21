export interface HoraTrabajoData {
  id_registro: string;
  area: string;
  equipo: string;
  estatus: string;
  semana_inicio: string;
  horas_calculadas: number;
  is_retrasada: boolean;
  fecha_base?: string;
  descripcion_orden?: string;
  causa_retraso?: string;
}

export type WorkOrderPanelMode = 'view' | 'edit';

export interface WorkOrderTodayRow {
  idOt: string;
  idOm: string | null;
  idSg: string | null;
  fecha: string;
  mecanicoId: number;
  mecanicoNombre: string | null;
  area: string | null;
  equipoTrabajo: string | null;
  duracionHoras: number;
  estatus: string;
  retrasoHoras: number | null;
  causa: string | null;
  comentario: string | null;
  semana: string;
  observaciones: string | null;
  created: string | null;
}

export interface WorkOrderUpdatePayload {
  duracionHoras: number;
  estatus: string;
  retrasoHoras: number | null;
  causa: string | null;
  comentario: string | null;
  observaciones: string | null;
}

export interface WorkOrderUpdateDbPayload {
  'Duración (horas)': number;
  Estatus: string;
  'Retraso (horas)': number | null;
  Causa: string | null;
  Comentario: string | null;
  Observaciones: string | null;
}

export interface WorkOrderFormErrors {
  duracionHoras?: string;
  estatus?: string;
  retrasoHoras?: string;
  causa?: string;
}

export interface MecanicoTrabajoRow {
  id: number;
  NOMBRE: string | null;
  AREA: string | null;
  'EQUIPO DE TRABAJO': string | null;
}

export interface WorkOrderTodayDbRow {
  ID_OT: string;
  id_om: string | null;
  id_sg: string | null;
  Fecha: string | null;
  ID_Mecanico: number | null;
  'Duración (horas)': number | string | null;
  Estatus: string | null;
  'Retraso (horas)': number | string | null;
  Causa: string | null;
  Comentario: string | null;
  Semana: string | number | null;
  Observaciones: string | null;
  created: string | null;
  MECANICOS?: MecanicoTrabajoRow | MecanicoTrabajoRow[] | null;
}
