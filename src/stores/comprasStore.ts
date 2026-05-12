import { defineStore } from 'pinia';
import { supabase, supabaseCompras, supabaseEquipos } from '@/lib/supabase';
import type { TomarSolicitudParaEdicionResponse } from '@/types';

type ComprasRealtimeChannel = ReturnType<typeof supabaseCompras.channel>;

export interface EstadoCompra {
  id: number;
  name: string;
}

export interface SolicitudCompra {
  id: string;
  folio_sol: string | null;
  email: string;
  estado_id: number;
  prioridad?: string | null;
  prioridad_id?: number | null;
  isUrgent?: boolean;
  fecha_entrega: string;
  fecha_creacion: string;
  observacion: string;
  fecha_subida_sistema?: string | null;
  historial_estado_actual?: HistorialAnteriorCompra | null;
  ordenes_compra: OrdenCompraResumen[];
  equipos?: { cod_equipo: string }[];
  nombreSolicitante?: string;
}

export interface HistorialAnteriorCompra {
  estado_id: number | null;
  fecha_inicio: string | null;
}

export interface DetalleSolicitud {
  id: string;
  solicitud_id: string;
  folio_sol: string | null;
  cod_producto: string | null;
  cantidad: number;
  cantidad_inventario: number | null;
  cantidad_gerencia: number | null;
  cantidad_subida_sistema_compra: number | null;
}

export interface OrdenCompraResumen {
  folio_oc: string;
  estado: string;
  proveedor: string;
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

const toLocalDateTimeString = (value: string | null | undefined) => {
  if (!value) return value || '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

interface SolicitudesCompraRpcResponse {
  success: boolean;
  message: string;
  data: SolicitudCompra[];
  total: number;
  limit: number;
  offset: number;
}

export const useComprasStore = defineStore('compras', {
  state: () => ({
    estados: [] as EstadoCompra[],
    solicitudes: [] as SolicitudCompra[],
    selectedEstadoId: null as number | null,
    isLoading: false,
    error: null as string | null,
    comprasSolicitudesUserChannel: null as ComprasRealtimeChannel | null,
    comprasSolicitudesUserChannelId: null as string | null,
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
      this.error = null;
      try {
        const pageSize = 1000;
        let offset = 0;
        let total = 0;
        const solicitudesDataRaw: SolicitudCompra[] = [];

        do {
          const { data: rpcResponse, error: solError } = await supabaseCompras.rpc(
            'listar_solicitudes_compra_con_historial',
            {
              p_user_area: userArea,
              p_emails_filter: emailsFilter,
              p_limit: pageSize,
              p_offset: offset,
            }
          );

          if (solError) throw solError;

          const response = rpcResponse as SolicitudesCompraRpcResponse | null;
          if (!response?.success) {
            throw new Error(response?.message || 'No se pudieron cargar las solicitudes de compra');
          }

          const pageData = response.data || [];
          solicitudesDataRaw.push(...pageData);
          total = response.total || pageData.length;

          offset += pageSize;

          if (pageData.length < pageSize) break;
        } while (solicitudesDataRaw.length < total);

        // Collect unique emails
        const uniqueEmails = Array.from(new Set((solicitudesDataRaw || []).map(s => s.email).filter(Boolean)));
        
        let profileNamesMap: Record<string, string> = {};
        
        if (uniqueEmails.length > 0) {
           const { data: profilesData } = await supabase
              .from('PROFILE')
              .select('email, nombre')
              .in('email', uniqueEmails);
              
           if (profilesData) {
              profilesData.forEach(p => {
                 if (p.email && p.nombre) {
                    profileNamesMap[p.email] = p.nombre;
                 }
              });
           }
        }

        let solicitudesData = (solicitudesDataRaw || []).map(s => ({
          ...s,
          fecha_creacion: toLocalDateTimeString(s.fecha_creacion),
          nombreSolicitante: s.email ? (profileNamesMap[s.email] || s.email) : 'Nombre no asignado'
        }));

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
          folio_sol: sol.folio_sol?.startsWith('TMP-COMP-') ? 'Num Req No asignado' : sol.folio_sol,
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
    },

    actualizarSolicitudDesdeRespuestaEdicion(response: TomarSolicitudParaEdicionResponse) {
      if (!response?.solicitud_id || typeof response.estado_actual_id !== 'number') return;
      console.log("ACTUALIZANDO BRAODCAST");
      
      const solicitud = this.solicitudes.find(item => item.id === response.solicitud_id);
      if (!solicitud) return;

      if (solicitud.estado_id !== response.estado_actual_id) {
        solicitud.estado_id = response.estado_actual_id;
      }

      if (response.folio_sol?.trim()) {
        solicitud.folio_sol = response.folio_sol;
      }
    },

    async escucharSolicitudesComprasUsuario(userId: string | null | undefined) {
      if (!userId) return null;

      if (this.comprasSolicitudesUserChannel && this.comprasSolicitudesUserChannelId === userId) {
        return this.comprasSolicitudesUserChannel;
      }

      if (this.comprasSolicitudesUserChannel) {
        await this.comprasSolicitudesUserChannel.unsubscribe();
      }

      const channelName = `compras-solicitudes-user-${userId}`;
      const channel = supabaseCompras
        .channel(channelName, {
          config: {
            private: true,
          },
        })
        .on('broadcast',  { event: 'solicitud_compra_estado_actualizado' }, ({ payload }) => {
          this.actualizarSolicitudDesdeRespuestaEdicion(payload as TomarSolicitudParaEdicionResponse);
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error(`Error en canal realtime de compras: ${channelName}`);
          }
        });

      this.comprasSolicitudesUserChannel = channel;
      this.comprasSolicitudesUserChannelId = userId;

      return channel;
    },

    async tomarSolicitudParaEdicion(solicitudId: string, estadoEdicionId: number, emailUsuario: string) {
      try {
        const { data, error } = await supabaseCompras.rpc('tomar_solicitud_para_edicion', {
          p_solicitud_id: solicitudId,
          p_estado_edicion_id: estadoEdicionId,
          p_creado_por: emailUsuario
        });
        if (error) throw error;
        
        const result = data as TomarSolicitudParaEdicionResponse
        if (result.success) {
           const sol = this.solicitudes.find(s => s.id === solicitudId);
           if (sol) {
              sol.estado_id = estadoEdicionId;
              if (result.folio_sol?.trim()) {
                sol.folio_sol = result.folio_sol;
              }
           }
        }else{
          this.actualizarSolicitudDesdeRespuestaEdicion(result);
        }
        
        return data;
      } catch (err: any) {
        console.error('Error al tomar solicitud para edición:', err);
        throw err;
      }
    },

    async cancelarEdicionSolicitud(solicitudId: string, emailUsuario: string) {
      try {
        const { data, error } = await supabaseCompras.rpc('cancelar_edicion_solicitud_compra', {
          p_solicitud_id: solicitudId,
          p_creado_por: emailUsuario
        });
        if (error) throw error;
        
        // Update local state if successful
        if (data.success && data.estado_actual_id) {
           const sol = this.solicitudes.find(s => s.id === solicitudId);
           if (sol) {
              sol.estado_id = data.estado_actual_id;
           }
        }
        
        return data;
      } catch (err: any) {
        console.error('Error al cancelar edición de solicitud:', err);
        throw err;
      }
    }
  }
});
