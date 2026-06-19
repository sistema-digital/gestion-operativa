import { supabaseEquipos } from '@/lib/supabase';

import type {
  BuscarEquiposParams,
  EquipoRow,
} from './equipos.types';

const DEFAULT_LIMIT = 10;

export const equiposService = {
  async buscarEquipos(
    params: BuscarEquiposParams
  ): Promise<EquipoRow[]> {
    const normalizedQuery = params.query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const limit = typeof params.limit === 'number' && params.limit > 0
      ? params.limit
      : DEFAULT_LIMIT;

    const { data, error } = await supabaseEquipos
      .from('equipos')
      .select('cod_equipo, tipo')
      .eq('activo', true)
      .or([
        `cod_equipo.ilike.%${normalizedQuery}%`,
        `tipo.ilike.%${normalizedQuery}%`,
      ].join(','))
      .order('cod_equipo', { ascending: true })
      .limit(limit)
      .overrideTypes<EquipoRow[], { merge: false }>();

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los equipos');
    }

    return data ?? [];
  },
};
