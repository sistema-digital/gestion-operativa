import { supabase, supabaseCapturaOperador } from "@/lib/supabase";
import { z } from "zod";
import type {
  CambiarImplementoRpcPayload,
  CambiarLaborRpcPayload,
  CambiarTipoParadaRpcPayload,
  ImplementoCrearPayload,
  JornadaEventoRpcPayload,
  JornadaInicioRpcPayload,
  JornadaAdministrativaDetalle,
  JornadaAdministrativaFiltros,
  JornadaAdministrativaListaItem,
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
  OperadorCrearPayload,
  RegistroOperadorResponse,
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
  modo: z.string().min(1).optional(),
  borrador: z.boolean().optional(),
  borrador_reemplazado: z.boolean().optional(),
  borrador_previo_conservado: z.boolean().optional(),
  estado_captura: z.enum(["en_edicion", "finalizada", "descartada"]).optional(),
  publicada_jornada_id: z.string().uuid().nullable().optional(),
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

const jornadaEstadoCapturaSchema = z.enum([
  "en_edicion",
  "finalizada",
  "descartada",
]);

const jornadaAdministrativaListadoSchema = z.object({
  ok: z.boolean(),
  limit: z.number().int().positive(),
  items: z.array(
    z.object({
      jornada_id: z.string().uuid(),
      operador_id: z.string().uuid(),
      operador: z.string().min(1),
      equipo_numero: z.string().min(1),
      fecha_operativa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      iniciada_en: z.string().nullable(),
      finalizada_en: z.string().nullable(),
      estado_captura: jornadaEstadoCapturaSchema,
      publicada_jornada_id: z.string().uuid().nullable(),
      actualizado_en: z.string().nullable(),
      eventos_activos: z.number().int().nonnegative(),
    }),
  ),
});

const jornadaAdministrativaFilaActividadSchema = z.object({
  uuid: z.string().uuid(),
  codigo: z.string().min(1),
  descripcion: z.string().min(1),
  requiere_implemento: z.boolean().optional(),
});

const jornadaAdministrativaFilaSchema = z.object({
  fila: z.number().int().positive(),
  inicio: z.string().min(1),
  fin: z.string().min(1).nullable(),
  inicio_local: z.string().regex(/^\d{2}:\d{2}$/),
  fin_local: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  tipo: z.enum(["labor", "parada"]),
  equipo_numero: z.string().min(1),
  labor: jornadaAdministrativaFilaActividadSchema.nullable(),
  parada: jornadaAdministrativaFilaActividadSchema.nullable(),
  implemento: z
    .object({
      uuid: z.string().uuid(),
      codigo: z.string().min(1),
      descripcion: z.string().nullable(),
    })
    .nullable(),
  observacion: z.string().nullable(),
  duracion: z.string().nullable(),
});

const jornadaAdministrativaDetalleSchema = z.object({
  ok: z.boolean(),
  jornada: z.object({
    id: z.string().uuid(),
    operador_id: z.string().uuid(),
    operador: z.string().min(1),
    fecha_operativa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    iniciada_en: z.string().nullable(),
    finalizada_en: z.string().nullable(),
    estado_captura: jornadaEstadoCapturaSchema,
  }),
  estado_actual: z.object({
    equipo_numero: z.string().nullable(),
    eventos_activos: z.number().int().nonnegative(),
  }),
  filas: z.array(jornadaAdministrativaFilaSchema),
  eventos: z.array(
    z.object({
      id: z.string().uuid(),
      client_event_id: z.string().uuid().nullable(),
      public_evento_id: z.string().uuid().nullable(),
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
      ocurrio_en: z.string().min(1),
      ocurrio_en_local: z.string().nullable(),
      anulado: z.boolean(),
      payload: z.object({
        operador_id: z.string().uuid().optional(),
        fecha_operativa: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        equipo_numero: z.string().min(1).optional(),
        labor_id: z.string().uuid().nullable().optional(),
        implemento_id: z.string().uuid().nullable().optional(),
        nueva_labor_id: z.string().uuid().optional(),
        tipo_parada_id: z.string().uuid().optional(),
        modo: z.literal("cambio_real").optional(),
        observacion: z.string().nullable().optional(),
        nuevo_implemento_id: z.string().uuid().nullable().optional(),
      }),
    }),
  ),
});

function mapJornadaListado(
  item: z.infer<typeof jornadaAdministrativaListadoSchema>["items"][number],
): JornadaAdministrativaListaItem {
  return {
    jornadaId: item.jornada_id,
    operadorId: item.operador_id,
    operador: item.operador,
    equipoNumero: item.equipo_numero,
    fechaOperativa: item.fecha_operativa,
    iniciadaEn: item.iniciada_en,
    finalizadaEn: item.finalizada_en,
    estadoCaptura: item.estado_captura,
    publicadoJornadaId: item.publicada_jornada_id,
    actualizadoEn: item.actualizado_en,
    eventosActivos: item.eventos_activos,
  };
}

function mapJornadaDetalle(
  data: z.infer<typeof jornadaAdministrativaDetalleSchema>,
): JornadaAdministrativaDetalle {
  return {
    id: data.jornada.id,
    operadorId: data.jornada.operador_id,
    operador: data.jornada.operador,
    fechaOperativa: data.jornada.fecha_operativa,
    iniciadaEn: data.jornada.iniciada_en,
    finalizadaEn: data.jornada.finalizada_en,
    estadoCaptura: data.jornada.estado_captura,
    equipoNumero: data.estado_actual.equipo_numero,
    eventosActivos: data.estado_actual.eventos_activos,
    filas: data.filas.map((fila) => ({
      numero: fila.fila,
      inicio: fila.inicio,
      fin: fila.fin,
      inicioLocal: fila.inicio_local,
      finLocal: fila.fin_local,
      tipo: fila.tipo,
      equipoNumero: fila.equipo_numero,
      labor: fila.labor
        ? {
            id: fila.labor.uuid,
            codigo: fila.labor.codigo,
            nombre: fila.labor.descripcion,
          }
        : null,
      parada: fila.parada
        ? {
            id: fila.parada.uuid,
            codigo: fila.parada.codigo,
            nombre: fila.parada.descripcion,
            requiereImplemento: fila.parada.requiere_implemento,
          }
        : null,
      implemento: fila.implemento
        ? {
            id: fila.implemento.uuid,
            numero: fila.implemento.codigo,
            nombre: fila.implemento.descripcion,
          }
        : null,
      observacion: fila.observacion,
      duracion: fila.duracion,
    })),
    eventos: data.eventos.map((evento) => ({
      id: evento.id,
      clientEventId: evento.client_event_id,
      publicEventoId: evento.public_evento_id,
      secuencia: evento.secuencia,
      tipoEvento: evento.tipo_evento,
      ocurrioEn: evento.ocurrio_en,
      ocurrioEnLocal: evento.ocurrio_en_local,
      anulado: evento.anulado,
      payload: evento.payload,
    })),
  };
}

/** Este servicio conserva el único acceso directo al cliente para este flujo. */
export const registroJornadaService = {
  async listarJornadasAdministrativas(
    filtros: JornadaAdministrativaFiltros,
  ): Promise<JornadaAdministrativaListaItem[]> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_listar_jornadas", {
        p_operador_id: null,
        p_desde: filtros.desde,
        p_hasta: filtros.hasta,
        p_estado: filtros.estado,
        p_limit: 100,
      })
      .overrideTypes<z.infer<typeof jornadaAdministrativaListadoSchema>>();
    if (error) throw error;

    const resultado = jornadaAdministrativaListadoSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error("La respuesta del listado de jornadas no es válida.");
    }

    return resultado.data.items.map(mapJornadaListado);
  },

  async obtenerJornadaAdministrativa(
    jornadaId: string,
  ): Promise<JornadaAdministrativaDetalle> {
    const { data, error } = await supabaseCapturaOperador
      .rpc("rpc_admin_obtener_jornada", { p_jornada_id: jornadaId })
      .overrideTypes<z.infer<typeof jornadaAdministrativaDetalleSchema>>();
    if (error) throw error;

    const resultado = jornadaAdministrativaDetalleSchema.safeParse(data);
    if (!resultado.success) {
      throw new Error("La respuesta del detalle de jornada no es válida.");
    }

    return mapJornadaDetalle(resultado.data);
  },

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

  registrarOperador(payload: OperadorCrearPayload) {
    return supabaseCapturaOperador
      .rpc("rpc_admin_registrar_operador", { p_nombre: payload.nombre })
      .overrideTypes<RegistroOperadorResponse>();
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
