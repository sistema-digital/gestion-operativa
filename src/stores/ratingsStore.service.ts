import { supabase, supabaseRatings } from '@/lib/supabase';
import type {
  PuntuacionSupervisoresOtResponse,
  RatingsDetalle,
  RatingsEmpleado,
  RatingsInspeccion,
} from './ratingsStore.types';

const fetchFromFirstAvailableTable = async <T>(
  tableNames: [string, string],
  select = '*'
): Promise<T[]> => {
  const [{ data: lowerData, error: lowerError }, { data: exactData, error: exactError }] =
    await Promise.all([
      supabaseRatings.from(tableNames[0]).select(select),
      supabaseRatings.from(tableNames[1]).select(select),
    ]);

  if (lowerError && exactError) {
    throw new Error(lowerError.message || exactError.message);
  }

  if (lowerData && lowerData.length > 0) {
    return lowerData as T[];
  }

  return (exactData || []) as T[];
};

export const ratingsService = {
  async fetchEmpleados(): Promise<RatingsEmpleado[]> {
    return fetchFromFirstAvailableTable<RatingsEmpleado>(['empleados', 'Empleados']);
  },

  async fetchInspecciones(): Promise<RatingsInspeccion[]> {
    const [{ data: lowerData, error: lowerError }, { data: exactData, error: exactError }] =
      await Promise.all([
        supabaseRatings
          .from('inspecciones')
          .select('*')
          .order('fecha', { ascending: false })
          .order('hora', { ascending: false }),
        supabaseRatings
          .from('Inspecciones')
          .select('*')
          .order('fecha', { ascending: false })
          .order('hora', { ascending: false }),
      ]);

    if (lowerError && exactError) {
      throw new Error(lowerError.message || exactError.message);
    }

    if (lowerData && lowerData.length > 0) {
      return lowerData as RatingsInspeccion[];
    }

    return (exactData || []) as RatingsInspeccion[];
  },

  async fetchDetalles(): Promise<RatingsDetalle[]> {
    return fetchFromFirstAvailableTable<RatingsDetalle>([
      'inspecciones_detalle',
      'Inspecciones_Detalle',
    ]);
  },

  async fetchPuntuacionSupervisoresOt(
    fecha: string
  ): Promise<PuntuacionSupervisoresOtResponse> {
    const { data, error } = await supabase.rpc('rpc_puntuacion_supervisores_ot', {
      p_fecha: fecha,
    });

    if (error) {
      throw new Error(error.message || 'No se pudo cargar la puntuación de supervisores OT');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('La RPC de puntuación de supervisores OT no devolvió una respuesta válida');
    }

    return data as PuntuacionSupervisoresOtResponse;
  },
};
