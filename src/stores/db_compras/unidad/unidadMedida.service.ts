import { supabaseCompras } from '@/lib/supabase';

import type {
  UnidadMedidaOption,
  UnidadMedidaRow,
} from './unidadMedida.types';

const normalizeDescripcionKey = (value: string): string => value
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase();

const normalizeDescripcionVisible = (value: string): string => value
  .trim()
  .replace(/\s+/g, ' ');

export const unidadMedidaService = {
  async obtenerOpcionesActivas(): Promise<UnidadMedidaOption[]> {
    const { data, error } = await supabaseCompras
      .from('unidad_medida')
      .select('id, codigo, abreviatura, descripcion, activo, created_at')
      .eq('activo', true)
      .not('descripcion', 'is', null)
      .not('codigo', 'like', '\\_%')
      .neq('codigo', 'ft')
      .order('descripcion', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener las unidades de medida');
    }

    const uniqueByDescripcion = new Map<string, UnidadMedidaOption>();

    ((data ?? []) as UnidadMedidaRow[]).forEach((row) => {
      const descripcionOriginal = row.descripcion ?? '';
      const descripcion = normalizeDescripcionVisible(descripcionOriginal);

      if (!descripcion) {
        return;
      }

      const uniqueKey = normalizeDescripcionKey(descripcion);

      if (uniqueByDescripcion.has(uniqueKey)) {
        return;
      }

      uniqueByDescripcion.set(uniqueKey, {
        id: row.id,
        codigo: row.codigo,
        abreviatura: row.abreviatura,
        descripcion,
      });
    });

    return [...uniqueByDescripcion.values()];
  },
};
