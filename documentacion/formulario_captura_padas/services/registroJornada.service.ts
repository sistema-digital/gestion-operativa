/**
 * registroJornada.service.ts
 *
 * Único lugar que debería conocer `supabase.rpc(...)`.
 *
 * RPC usados:
 * - rpc_admin_listar_operadores
 * - rpc_obtener_catalogos_offline
 * - rpc_admin_obtener_jornada
 * - rpc_admin_iniciar_jornada
 * - rpc_admin_cambiar_labor
 * - rpc_admin_registrar_parada
 * - rpc_admin_cambiar_tipo_parada
 * - rpc_admin_reanudar_trabajo
 * - rpc_admin_confirmar_cambio_implemento
 * - rpc_admin_finalizar_jornada
 * - rpc_admin_deshacer_ultimo_evento
 * - rpc_admin_registrar_implemento
 *
 * AJUSTE NECESARIO:
 * Cambia el import de `supabase` por la ruta real de tu proyecto.
 */

import { supabase } from '@/lib/supabase';
import type { ImplementoCrearPayload } from '../registroJornada.types';

export const registroJornadaService = {
  listarOperadores() {
    return supabase.rpc('rpc_admin_listar_operadores');
  },

  cargarCatalogos() {
    return supabase.rpc('rpc_obtener_catalogos_offline');
  },

  obtenerJornada(p_jornada_id: string) {
    return supabase.rpc('rpc_admin_obtener_jornada', { p_jornada_id });
  },

  iniciarJornada(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_iniciar_jornada', payload);
  },

  cambiarLabor(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_cambiar_labor', payload);
  },

  registrarParada(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_registrar_parada', payload);
  },

  cambiarTipoParada(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_cambiar_tipo_parada', payload);
  },

  reanudarTrabajo(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_reanudar_trabajo', payload);
  },

  cambiarImplemento(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_confirmar_cambio_implemento', payload);
  },

  finalizarJornada(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_finalizar_jornada', payload);
  },

  deshacerUltimoEvento(payload: Record<string, unknown>) {
    return supabase.rpc('rpc_admin_deshacer_ultimo_evento', payload);
  },

  registrarImplemento(payload: ImplementoCrearPayload) {
    return supabase.rpc('rpc_admin_registrar_implemento', {
      p_numero: payload.numero,
      p_tipo_implemento_id: payload.tipoImplementoId,
      p_nombre: payload.nombre || null,
    });
  },
};
