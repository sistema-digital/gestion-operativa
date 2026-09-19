import { supabase, supabaseCapturaOperador } from "@/lib/supabase";
import type {
  CambiarImplementoRpcPayload,
  CambiarLaborRpcPayload,
  CambiarTipoParadaRpcPayload,
  ImplementoCrearPayload,
  JornadaEventoRpcPayload,
  JornadaInicioRpcPayload,
  JornadaRpcResponse,
  ReanudarTrabajoRpcPayload,
  RegistrarParadaRpcPayload,
  RegistroImplementoResponse,
} from "../registroJornada.types";

/** Este servicio conserva el único acceso directo al cliente para este flujo. */
export const registroJornadaService = {
  registrarImplemento(payload: ImplementoCrearPayload) {
    return supabase
      .rpc("rpc_admin_registrar_implemento", {
        p_numero: payload.numero,
        p_tipo_implemento_id: payload.tipoImplementoId,
        p_nombre: payload.nombre ?? null,
      })
      .overrideTypes<RegistroImplementoResponse>();
  },

  iniciarJornada(payload: JornadaInicioRpcPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_iniciar_jornada", payload)
      .overrideTypes<JornadaRpcResponse>();
  },

  cambiarLabor(payload: CambiarLaborRpcPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_cambiar_labor", payload)
      .overrideTypes<JornadaRpcResponse>();
  },

  registrarParada(payload: RegistrarParadaRpcPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_registrar_parada", payload)
      .overrideTypes<JornadaRpcResponse>();
  },

  cambiarTipoParada(payload: CambiarTipoParadaRpcPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_cambiar_tipo_parada", payload)
      .overrideTypes<JornadaRpcResponse>();
  },

  reanudarTrabajo(payload: ReanudarTrabajoRpcPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_reanudar_trabajo", payload)
      .overrideTypes<JornadaRpcResponse>();
  },

  cambiarImplemento(payload: CambiarImplementoRpcPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_confirmar_cambio_implemento", payload)
      .overrideTypes<JornadaRpcResponse>();
  },

  finalizarJornada(payload: JornadaEventoRpcPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_finalizar_jornada", payload)
      .overrideTypes<JornadaRpcResponse>();
  },
};
