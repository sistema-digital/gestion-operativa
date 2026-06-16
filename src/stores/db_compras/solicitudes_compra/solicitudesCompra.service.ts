import { supabaseCompras } from '@/lib/supabase';
import type {
  SolicitudCompraListRpcParams,
  SolicitudCompraListRpcRow,
} from './solicitudesCompra.types';

const RPC_NAME = 'rpc_obtener_solicitudes_lista_usuario';
const DEFAULT_PAGE_SIZE = 25;
const SEARCH_LIMIT = 500;

const ejecutarListadoRpc = async (
  params: SolicitudCompraListRpcParams
): Promise<SolicitudCompraListRpcRow[]> => {
  const { data, error } = await supabaseCompras.rpc(RPC_NAME, params);

  if (error) {
    throw new Error(error.message || 'No se pudieron obtener las solicitudes');
  }

  return (data ?? []) as SolicitudCompraListRpcRow[];
};

export const solicitudesCompraService = {
  async obtenerSolicitudesListaPagina(
    params: SolicitudCompraListRpcParams
  ): Promise<SolicitudCompraListRpcRow[]> {
    const normalizedBusqueda = params.p_busqueda?.trim() || null;
    const pageSize = typeof params.p_limit === 'number' && params.p_limit > 0
      ? params.p_limit
      : DEFAULT_PAGE_SIZE;

    return ejecutarListadoRpc({
      ...params,
      p_busqueda: normalizedBusqueda && normalizedBusqueda.length > 0 ? normalizedBusqueda : null,
      p_limit: pageSize,
      p_offset: params.p_offset ?? 0,
    });
  },

  async buscarSolicitudesLista(
    params: SolicitudCompraListRpcParams
  ): Promise<SolicitudCompraListRpcRow[]> {
    const normalizedBusqueda = params.p_busqueda?.trim() || null;

    return ejecutarListadoRpc({
      ...params,
      p_busqueda: normalizedBusqueda,
      p_limit: SEARCH_LIMIT,
      p_offset: 0,
    });
  },
};
