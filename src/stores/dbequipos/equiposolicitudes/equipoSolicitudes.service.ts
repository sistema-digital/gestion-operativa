import { supabaseEquipos } from '@/lib/supabase';
import type {
  EquipoSolicitud,
  EquipoSolicitudRow,
  ObtenerEquiposSolicitudResponse
} from './equipoSolicitudes.types';

export const equipoSolicitudesService = {
  async obtenerEquiposSolicitud(solicitudId: string): Promise<ObtenerEquiposSolicitudResponse> {
    const { data, error } = await supabaseEquipos
      .from('equipo_solicitudes')
      .select('cod_equipo')
      .eq('solicitud_id', solicitudId)
      .returns<Pick<EquipoSolicitudRow, 'cod_equipo'>[]>();

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los equipos de la solicitud');
    }

    return (data || []).map<EquipoSolicitud>((item) => ({
      cod_equipo: item.cod_equipo
    }));
  }
};
