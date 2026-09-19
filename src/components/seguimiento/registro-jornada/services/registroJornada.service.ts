import { supabase } from "@/lib/supabase";
import type {
  ImplementoCrearPayload,
  RegistroImplementoResponse,
} from "../registroJornada.types";

/**
 * La firma y respuesta de este RPC deben verificarse en Supabase.
 * Este servicio conserva el único acceso directo al cliente para este flujo.
 */
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
};
