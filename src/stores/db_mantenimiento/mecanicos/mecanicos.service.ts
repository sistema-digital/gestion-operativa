import { supabase } from '@/lib/supabase';
import type { MecanicoMantenimiento } from './mecanicos.types';

export const mecanicosService = {
  async obtenerMecanicosActivosPorArea(area: string): Promise<MecanicoMantenimiento[]> {
    const { data, error } = await supabase
      .from('MECANICOS')
      .select('id, NOMBRE, AREA, "EQUIPO DE TRABAJO", is_enabled')
      .eq('AREA', area)
      .eq('is_enabled', true)
      .order('NOMBRE', { ascending: true });

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los mecánicos activos');
    }

    return (data || []) as MecanicoMantenimiento[];
  },
};
