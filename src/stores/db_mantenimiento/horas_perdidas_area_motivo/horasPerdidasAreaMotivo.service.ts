import { supabase } from '@/lib/supabase';
import type {
  ObtenerHorasPerdidasPersonalResumenParams,
  ObtenerHorasPerdidasPersonalResumenResponse,
} from './horasPerdidasAreaMotivo.types';

const normalizarHorasPerdidasPersonalResumen = (
  data: unknown
): ObtenerHorasPerdidasPersonalResumenResponse => {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('La respuesta del RPC get_horas_perdidas_personal_resumen no es valida');
  }

  return data as ObtenerHorasPerdidasPersonalResumenResponse;
};

export const horasPerdidasAreaMotivoService = {
  async obtenerResumen(
    params: ObtenerHorasPerdidasPersonalResumenParams
  ): Promise<ObtenerHorasPerdidasPersonalResumenResponse> {
    const { data, error } = await supabase.rpc(
      'get_horas_perdidas_personal_resumen',
      params
    );

    if (error) {
      throw new Error(error.message || 'No se pudo obtener el resumen de horas perdidas por area y motivo');
    }

    return normalizarHorasPerdidasPersonalResumen(data);
  }
};
