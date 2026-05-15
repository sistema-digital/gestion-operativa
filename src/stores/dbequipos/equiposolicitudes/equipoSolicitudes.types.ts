export interface EquipoSolicitudRow {
  id: string;
  solicitud_id: string;
  cod_equipo: string;
}

export interface EquipoSolicitud {
  cod_equipo: string;
}

export interface EquipoSolicitudesState {
  equiposPorSolicitud: Record<string, EquipoSolicitud[]>;
  isLoading: boolean;
  error: string | null;
}

export type ObtenerEquiposSolicitudResponse = EquipoSolicitud[];
