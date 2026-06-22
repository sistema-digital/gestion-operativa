export interface UsageOrdenesActividadUsuarioRow {
  area: string | null;
  ultima_entrada_ordenes_at: string | null;
  ultima_actualizacion_om_at: string | null;
  id_orden_actualizada: string | null;
  equipo_actualizado: string | null;
  descripcion_actualizada: string | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
}

export type ObtenerUsageOrdenesActividadUsuariosResponse =
  UsageOrdenesActividadUsuarioRow[];

export interface UsageOrdenesActividadUsuariosState {
  registros: UsageOrdenesActividadUsuarioRow[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}
