import { defineStore } from 'pinia';
import { supabaseCompras, supabaseEquipos } from '@/lib/supabase';

export interface EstadoCompra {
  id: number;
  name: string;
}

export interface SolicitudCompra {
  id: string;
  folio_sol: string | null;
  email: string;
  estado_id: number;
  fecha_entrega: string;
  fecha_creacion: string;
  observacion: string;
  fecha_subida_sistema: string | null;
  equipos?: { cod_equipo: string }[];
}

export interface DetalleSolicitud {
  id: string;
  solicitud_id: string;
  folio_sol: string | null;
  cod_producto: string | null;
  descripcion_manual: string | null;
  cantidad: number;
  cantidad_inventario: number | null;
  cantidad_gerencia: number | null;
  cantidad_subida_sistema_compra: number | null;
}

export interface Producto {
  id: string;
  cod_producto: string;
  descripcion: string;
  unidad_medida_id: number;
  unidad_medida?: { id: number, nombre: string, abreviatura: string };
}

export interface Equipo {
  cod_equipo: string;
}

export const useComprasStore = defineStore('compras', {
  state: () => ({
    estados: [] as EstadoCompra[],
    solicitudes: [] as SolicitudCompra[],
    selectedEstadoId: null as number | null,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchEstados() {
      const { data, error } = await supabaseCompras
        .from('estado')
        .select('*')
        .order('id');
      
      if (error) {
        console.error('Error fetching states:', error);
      } else {
        this.estados = data || [];
      }
    },

    async fetchSolicitudes(userArea: string = '', emailsFilter: string[] = []) {
      this.isLoading = true;
      try {
        let query = supabaseCompras
          .from('solicitud_compra')
          .select('*')
          .order('fecha_creacion', { ascending: false });

        if (userArea !== 'ALL' && userArea !== '') {
           if (emailsFilter.length > 0) {
              query = query.in('email', emailsFilter);
           } else {
              // fallback if for some reason emailsFilter is empty
              // but userArea is not ALL
              query = query.filter('email', 'eq', 'NONE'); // won't return anything
           }
        }

        const { data: solicitudesData, error: solError } = await query;

        if (solError) throw solError;

        // Fetch equipos logically linked
        const solIds = solicitudesData?.map(s => s.id) || [];
        let equiposMap: Record<string, any[]> = {};

        if (solIds.length > 0) {
           // We might need to chunk this if the array is too large, 
           // but for now we fetch relationships where solicitud_id is in solIds
           const { data: equipoSolsData, error: eqError } = await supabaseEquipos
             .from('equipo_solicitudes')
             .select('solicitud_id, cod_equipo')
             .in('solicitud_id', solIds);

             if (eqError) throw eqError;

             // Map by solicitud_id
             (equipoSolsData || []).forEach(eq => {
                if (!equiposMap[eq.solicitud_id]) equiposMap[eq.solicitud_id] = [];
                equiposMap[eq.solicitud_id].push(eq);
             });
        }

        this.solicitudes = (solicitudesData || []).map(sol => ({
          ...sol,
          equipos: equiposMap[sol.id] || []
        }));

      } catch (e: any) {
        console.error('Error fetching solicitudes:', e);
        this.error = e.message;
      } finally {
        this.isLoading = false;
      }
    },
    
    getEstadoName(id: number) {
      return this.estados.find(e => e.id === id)?.name || 'Desconocido';
    }
  }
});
