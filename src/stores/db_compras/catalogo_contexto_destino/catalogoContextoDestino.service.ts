import { supabaseCompras } from '@/lib/supabase';

import type {
  CatalogoContextoDestinoOption,
  CatalogoContextoDestinoRow,
} from './catalogoContextoDestino.types';

export const catalogoContextoDestinoService = {
  async obtenerOpciones(): Promise<CatalogoContextoDestinoOption[]> {
    const { data, error } = await supabaseCompras
      .from('catalogo_contexto_destino')
      .select('id, codigo, nombre, tipo_origen, restringido_a_servicios, activo')
      .order('nombre', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los destinos');
    }

    return ((data ?? []) as CatalogoContextoDestinoRow[]).map((row) => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre.trim(),
      tipoOrigen: row.tipo_origen,
      restringidoAServicios: row.restringido_a_servicios,
      activo: row.activo,
    }));
  },
};
