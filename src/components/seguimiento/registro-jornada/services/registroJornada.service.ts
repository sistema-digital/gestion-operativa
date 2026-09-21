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
  RegistroEventosLotePayload,
  RegistroEventosLoteResponse,
  ReanudarTrabajoRpcPayload,
  RegistrarParadaRpcPayload,
  RegistroImplementoResponse,
} from "../registroJornada.types";
import type {
  ImplementoOption,
  ImplementoTipoOption,
  EquipoOption,
  LaborCatalogo,
  OperadorOption,
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

const operadorListadoSchema = z.array(
  z.object({
    uuid: z.string().uuid(),
    nombre: z.string().min(1),
  }),
);

const tipoImplementoListadoSchema = z.array(
  z.object({
    uuid: z.string().uuid(),
    descripcion: z.string().min(1),
  }),
);

const equiposRegistroJornadaResponseSchema = z.object({
  data: z.array(
    z.object({
      codigo: codigoListadoSchema,
      tipo: z.string().trim().min(1),
      marca: z.string().trim().min(1),
    }),
  ),
  count: z.number().int().nonnegative(),
});

const registroEventosLoteResponseSchema = z.object({
  ok: z.boolean(),
  rollback: z.boolean(),
  jornada_id: z.string().uuid(),
  procesados: z.number().int().nonnegative(),
  error: z
    .object({
      codigo: z.string().min(1),
      mensaje: z.string().min(1),
      detalle: z.string().nullable(),
      pista: z.string().nullable(),
    })
    .optional(),
  evento_fallido: z
    .object({
      secuencia: z.number().int().positive(),
      tipo_evento: z.enum([
        "inicio_jornada",
        "cambiar_labor",
        "inicio_parada",
        "cambio_causa",
        "reanudar",
        "confirmar_cambio_implemento",
        "finalizar_jornada",
      ]),
      client_event_id: z.string().uuid(),
      ocurrio_en: z.string().min(1),
    })
    .optional(),
});

/** Este servicio conserva el único acceso directo al cliente para este flujo. */
export const registroJornadaService = {
  async registrarEventosLote(
    payload: RegistroEventosLotePayload,
  ): Promise<RegistroEventosLoteResponse> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_registrar_eventos_lote", payload)
      .overrideTypes<z.infer<typeof registroEventosLoteResponseSchema>>();
    if (error) throw error;

    const resultado = registroEventosLoteResponseSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error(
        "La respuesta del registro de eventos no tiene el formato esperado.",
      );
    }

    return resultado.data;
  },

  async listarEquiposRegistroJornada(): Promise<EquipoOption[]> {
    const { data, error } = await supabaseCapturaOperador.functions.invoke(
      "equipos-registro-jornada",
    );
    if (error) throw error;

    const resultado = equiposRegistroJornadaResponseSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error("La respuesta de equipos no tiene el formato esperado.");
    }

    return resultado.data.data.map((equipo) => ({
      numero: equipo.codigo,
      etiqueta: `${equipo.codigo} - ${equipo.tipo} ${equipo.marca}`,
    }));
  },

  async listarOperadores(): Promise<OperadorOption[]> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_listar_operadores")
      .overrideTypes<z.infer<typeof operadorListadoSchema>>();
    if (error) throw error;

    const resultado = operadorListadoSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error(
        "La respuesta de operadores no tiene el formato esperado.",
      );
    }

    return resultado.data.map((operador) => ({
      id: operador.uuid,
      nombre: operador.nombre,
    }));
  },

  async listarTiposImplemento(): Promise<ImplementoTipoOption[]> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_listar_tipos_implemento")
      .overrideTypes<z.infer<typeof tipoImplementoListadoSchema>>();
    if (error) throw error;

    const resultado = tipoImplementoListadoSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error(
        "La respuesta de tipos de implemento no tiene el formato esperado.",
      );
    }

    return resultado.data.map((tipo) => ({
      id: tipo.uuid,
      nombre: tipo.descripcion,
    }));
  },

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
