import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

// Tipo de los datos
export interface HoraTrabajoData {
  id_registro: string;
  area: string;
  equipo: string;
  estatus: string;
  semana_inicio: string;
  horas_calculadas: number;

  // Specific to retrasadas
  is_retrasada: boolean;
  fecha_base?: string;
  descripcion_orden?: string;
  causa_retraso?: string;
}

export const useHorasTrabajoStore = defineStore('horasTrabajo', () => {
  const data = ref<HoraTrabajoData[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const fetchAll = async (table: string) => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('semana', { ascending: true })
            .range(from, from + limit - 1);
            
          if (error) throw error;
          if (!data || data.length === 0) break;
          
          allData = [...allData, ...data];
          
          if (data.length < limit) break;
          
          from += limit;
        }
        return allData;
      };

      // Fetch both views from Supabase using pagination
      const [retrasadasData, otrosEstadosData] = await Promise.all([
        fetchAll('vw_ot_retrasadas_dashboard'),
        fetchAll('vw_ot_otros_estados_dashboard')
      ]);
      
      const unifiedData: HoraTrabajoData[] = [];
      let counter = 0;

      // Process Retrasadas
      if (retrasadasData) {
        retrasadasData.forEach((d: any) => {
          unifiedData.push({
            id_registro: `RET-${counter++}`,
            is_retrasada: true,
            area: d.area || 'Sin Área',
            equipo: d.equipo || 'Sin Equipo',
            estatus: 'Retrasada',
            semana_inicio: d.semana ? String(d.semana) : '0',
            horas_calculadas: d.horas_retraso || 0,
            fecha_base: d.fecha || undefined,
            descripcion_orden: d.descripcion_orden || undefined,
            causa_retraso: d.causa || undefined,
          });
        });
      }

      // Process Otros Estados
      if (otrosEstadosData) {
        otrosEstadosData.forEach((d: any) => {
          unifiedData.push({
            id_registro: `OTR-${counter++}`,
            is_retrasada: false,
            area: d.area || 'Sin Área',
            equipo: d.equipo || 'NO ASIGNADA',
            estatus: d.estado || 'Desconocido',
            semana_inicio: d.semana ? String(d.semana) : '0',
            horas_calculadas: d.horas_asignadas || 0,
          });
        });
      }

      data.value = unifiedData;
    } catch (err: any) {
      console.error('Error fetching horas de trabajo:', err);
      error.value = err.message || 'There was an error loading the data.';
    } finally {
      loading.value = false;
    }
  };

  return { data, loading, error, fetchData };
});
