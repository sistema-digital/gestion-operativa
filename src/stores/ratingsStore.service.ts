import { supabase, supabaseRatings } from '@/lib/supabase';
import type {
  RatingsFetchScope,
  PuntuacionSupervisoresOtResponse,
  RatingsDetalle,
  RatingsEmpleado,
  RatingsInspeccion,
} from './ratingsStore.types';

const SUPABASE_BATCH_SIZE = 1000;
const DETAIL_ID_CHUNK_SIZE = 200;

type PagedQueryResponse<T> = Promise<{
  data: T[] | null;
  error: { message?: string } | null;
}>;

const fetchTableData = async <T>(
  tableName: string,
  select = '*'
): Promise<T[]> => {
  const { data, error } = await supabaseRatings.from(tableName).select(select);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as T[];
};

const buildInspeccionesScopeQuery = (
  tableName: string,
  scope: RatingsFetchScope,
  from: number
) => {
  let query = supabaseRatings
    .from(tableName)
    .select('*')
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .range(from, from + SUPABASE_BATCH_SIZE - 1);

  if (scope.mode === 'single-date') {
    query = query.eq('fecha', scope.date);
  } else if (scope.mode === 'date-range') {
    query = query.gte('fecha', scope.from).lte('fecha', scope.to);
  }

  return query;
};

const buildDetallesPageQuery = (
  tableName: string,
  from: number,
  inspectionIds?: number[]
) => {
  let query = supabaseRatings
    .from(tableName)
    .select('*')
    .order('id_inspeccion', { ascending: false })
    .order('id_criterio', { ascending: true })
    .range(from, from + SUPABASE_BATCH_SIZE - 1);

  if (inspectionIds && inspectionIds.length > 0) {
    query = query.in('id_inspeccion', inspectionIds);
  }

  return query;
};

const fetchPagedData = async <T>(
  tableName: string,
  queryFactory: (tableName: string, from: number) => PagedQueryResponse<T>
): Promise<T[]> => {
  const { data: initialData, error: initialError } = await queryFactory(tableName, 0);

  if (initialError) {
    throw new Error(initialError.message);
  }

  const records = [...((initialData || []) as T[])];

  if (records.length < SUPABASE_BATCH_SIZE) {
    return records;
  }

  let from = SUPABASE_BATCH_SIZE;

  while (true) {
    const { data, error } = await queryFactory(tableName, from);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data || []) as T[];

    records.push(...batch);

    if (batch.length < SUPABASE_BATCH_SIZE) {
      break;
    }

    from += SUPABASE_BATCH_SIZE;
  }

  return records;
};

export const ratingsService = {
  async fetchEmpleados(): Promise<RatingsEmpleado[]> {
    return fetchTableData<RatingsEmpleado>('empleados');
  },

  async fetchInspecciones(scope: RatingsFetchScope = { mode: 'all' }): Promise<RatingsInspeccion[]> {
    return fetchPagedData<RatingsInspeccion>(
      'inspecciones',
      (tableName, from) => buildInspeccionesScopeQuery(tableName, scope, from) as unknown as PagedQueryResponse<RatingsInspeccion>
    );
  },

  async fetchDetalles(
    scope: RatingsFetchScope = { mode: 'all' },
    inspectionIds: number[] = []
  ): Promise<RatingsDetalle[]> {
    if (scope.mode !== 'all') {
      if (inspectionIds.length === 0) {
        return [];
      }

      const uniqueInspectionIds = [...new Set(inspectionIds)];
      const detailRecords: RatingsDetalle[] = [];

      for (let index = 0; index < uniqueInspectionIds.length; index += DETAIL_ID_CHUNK_SIZE) {
        const idChunk = uniqueInspectionIds.slice(index, index + DETAIL_ID_CHUNK_SIZE);
        const chunkRecords = await fetchPagedData<RatingsDetalle>(
          'inspecciones_detalle',
          (tableName, from) => buildDetallesPageQuery(tableName, from, idChunk) as unknown as PagedQueryResponse<RatingsDetalle>
        );

        detailRecords.push(...chunkRecords);
      }

      return detailRecords;
    }

    return fetchPagedData<RatingsDetalle>(
      'inspecciones_detalle',
      (tableName, from) => buildDetallesPageQuery(tableName, from) as unknown as PagedQueryResponse<RatingsDetalle>
    );
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

  async deleteInspeccion(inspectionId: number): Promise<void> {
    const { error: detailsError } = await supabaseRatings
      .from('inspecciones_detalle')
      .delete()
      .eq('id_inspeccion', inspectionId);

    if (detailsError) {
      throw new Error(detailsError.message || 'No se pudieron eliminar los detalles de la inspeccion');
    }

    const { error: inspectionError } = await supabaseRatings
      .from('inspecciones')
      .delete()
      .eq('id_inspeccion', inspectionId);

    if (inspectionError) {
      throw new Error(inspectionError.message || 'No se pudo eliminar la inspeccion');
    }
  },
};
