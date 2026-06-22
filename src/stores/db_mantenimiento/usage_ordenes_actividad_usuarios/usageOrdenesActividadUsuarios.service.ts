import { supabase } from '@/lib/supabase';
import type {
  ObtenerUsageOrdenesActividadUsuariosResponse,
  UsageOrdenesActividadUsuarioRow,
} from './usageOrdenesActividadUsuarios.types';

const VIEW_NAME = 'vw_usage_ordenes_actividad_usuarios';

const normalizarRegistro = (row: unknown): UsageOrdenesActividadUsuarioRow | null => {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return null;
  }

  const source = row as Record<string, unknown>;

  return {
    area: typeof source.area === 'string' ? source.area : null,
    ultima_entrada_ordenes_at: typeof source.ultima_entrada_ordenes_at === 'string'
      ? source.ultima_entrada_ordenes_at
      : null,
    ultima_actualizacion_om_at: typeof source.ultima_actualizacion_om_at === 'string'
      ? source.ultima_actualizacion_om_at
      : null,
    id_orden_actualizada: typeof source.id_orden_actualizada === 'string'
      ? source.id_orden_actualizada
      : null,
    equipo_actualizado: typeof source.equipo_actualizado === 'string'
      ? source.equipo_actualizado
      : null,
    descripcion_actualizada: typeof source.descripcion_actualizada === 'string'
      ? source.descripcion_actualizada
      : null,
    estado_anterior: typeof source.estado_anterior === 'string'
      ? source.estado_anterior
      : null,
    estado_nuevo: typeof source.estado_nuevo === 'string'
      ? source.estado_nuevo
      : null,
  };
};

const normalizarRespuesta = (data: unknown): ObtenerUsageOrdenesActividadUsuariosResponse => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizarRegistro)
    .filter((row): row is UsageOrdenesActividadUsuarioRow => row !== null);
};

export const usageOrdenesActividadUsuariosService = {
  async obtenerActividad(): Promise<ObtenerUsageOrdenesActividadUsuariosResponse> {
    const { data, error } = await supabase
      .from(VIEW_NAME)
      .select(`
        area,
        ultima_entrada_ordenes_at,
        ultima_actualizacion_om_at,
        id_orden_actualizada,
        equipo_actualizado,
        descripcion_actualizada,
        estado_anterior,
        estado_nuevo
      `);

    if (error) {
      throw new Error(error.message || 'No se pudo obtener la actividad de ordenes por usuario');
    }

    return normalizarRespuesta(data);
  },
};
