import { supabase, supabaseCapturaOperador } from "@/lib/supabase";
import { z } from "zod";
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
import type {
  ImplementoOption,
  LaborCatalogo,
  TipoParadaCatalogo,
} from "../registroJornada.types";

const codigoListadoSchema = z
  .union([z.string().min(1), z.number().int().nonnegative()])
  .transform((codigo) => String(codigo));

const implementoListadoSchema = z.array(
  z.object({
    uuid: z.string().min(1),
    codigo: codigoListadoSchema,
    descripcion: z.string().nullable(),
  }),
);

const actividadListadoSchema = z.array(
  z.object({
    uuid: z.string().min(1),
    codigo: codigoListadoSchema.nullable(),
    descripcion: z.string().min(1),
  }),
);

/** Este servicio conserva el único acceso directo al cliente para este flujo. */
export const registroJornadaService = {
  async listarImplementos(): Promise<ImplementoOption[]> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_listar_implementos")
      .overrideTypes<z.infer<typeof implementoListadoSchema>>();
    if (error) throw error;

    const resultado = implementoListadoSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error(
        "La respuesta de implementos no tiene el formato esperado.",
      );
    }

    return resultado.data.map((implemento) => ({
      id: implemento.uuid,
      numero: implemento.codigo,
      nombre: implemento.descripcion,
    }));
  },

  async listarLabores(): Promise<LaborCatalogo[]> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_listar_labores")
      .overrideTypes<z.infer<typeof actividadListadoSchema>>();
    if (error) throw error;

    const resultado = actividadListadoSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error("La respuesta de labores no tiene el formato esperado.");
    }

    return resultado.data.map((labor) => ({
      id: labor.uuid,
      orden: labor.codigo === null ? null : Number(labor.codigo),
      nombre: labor.descripcion,
      activo: true,
    }));
  },

  async listarParadas(): Promise<TipoParadaCatalogo[]> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_listar_paradas")
      .overrideTypes<z.infer<typeof actividadListadoSchema>>();
    if (error) throw error;

    const resultado = actividadListadoSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error("La respuesta de paradas no tiene el formato esperado.");
    }

    return resultado.data.map((parada) => ({
      id: parada.uuid,
      orden: parada.codigo === null ? null : Number(parada.codigo),
      nombre: parada.descripcion,
      activo: true,
    }));
  },

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
