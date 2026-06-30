import { supabaseCompras } from '@/lib/supabase';

import type {
  SolicitudCompraBorradorCreatePayload,
  SolicitudCompraBorradorRow,
  SolicitudCompraBorradorUpdatePayload,
} from './solicitudesCompraBorradores.types';

const BORRADORES_TABLE = 'solicitud_compra_borrador';
const BORRADOR_SELECT = `
  id,
  creado_por_user_id,
  creado_por_email,
  creado_por_nombre,
  creado_por_area,
  activo,
  schema_version,
  current_step,
  tipo_solicitud,
  fecha_entrega,
  observacion,
  solicitar_urgente,
  motivo_urgencia,
  equipos,
  productos,
  servicios,
  enviado_at,
  created_at,
  updated_at
`;

export const solicitudesCompraBorradoresService = {
  async crearBorrador(
    payload: SolicitudCompraBorradorCreatePayload
  ): Promise<SolicitudCompraBorradorRow> {
    const { data, error } = await supabaseCompras
      .from(BORRADORES_TABLE)
      .insert(payload)
      .select(BORRADOR_SELECT)
      .single();

    if (error) {
      throw new Error(error.message || 'No se pudo guardar el borrador');
    }

    return data as SolicitudCompraBorradorRow;
  },

  async actualizarBorrador(
    draftId: string,
    payload: SolicitudCompraBorradorUpdatePayload
  ): Promise<SolicitudCompraBorradorRow> {
    const { data, error } = await supabaseCompras
      .from(BORRADORES_TABLE)
      .update(payload)
      .eq('id', draftId)
      .select(BORRADOR_SELECT)
      .single();

    if (error) {
      throw new Error(error.message || 'No se pudo actualizar el borrador');
    }

    return data as SolicitudCompraBorradorRow;
  },
};
