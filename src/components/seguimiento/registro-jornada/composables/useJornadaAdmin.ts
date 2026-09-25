import { shallowRef } from "vue";
import { z } from "zod";
import { registroJornadaService } from "../services/registroJornada.service";
import type {
  ActividadTipo,
  CatalogosJornada,
  EventoLote,
  EventoLotePayload,
  ImplementoCrearPayload,
  JornadaFilaModel,
  JornadaAdministrativaFila,
  JornadaAdministrativaEvento,
  RegistroImplementoResponse,
  JornadaState,
  RegistroEventosLoteResponse,
  EditarJornadaFinalizadaPayload,
} from "../registroJornada.types";

export interface ValidacionContinuidad {
  ok: boolean;
  mensaje: string;
}

export interface CodigoResuelto {
  tipoActividad: ActividadTipo | null;
  actividadId: string | null;
  actividadNombre: string;
}

function horaLocalEvento(evento: JornadaAdministrativaEvento): string {
  const coincidencia = evento.ocurrioEnLocal?.match(
    /\s(\d{2}:\d{2})(?::\d{2})?$/,
  );
  if (!coincidencia?.[1]) {
    throw new Error(
      `El evento ${evento.secuencia} no incluye una hora local válida.`,
    );
  }

  return coincidencia[1];
}

function actividadDesdeEvento(
  tipoActividad: ActividadTipo,
  actividadId: string | null | undefined,
  catalogos: CatalogosJornada,
): Pick<
  JornadaFilaModel,
  "codigo" | "tipoActividad" | "actividadId" | "actividadNombre"
> {
  if (!actividadId) {
    throw new Error("El evento no incluye la actividad necesaria para editar.");
  }

  const actividad =
    tipoActividad === "labor"
      ? catalogos.labores.find((labor) => labor.id === actividadId)
      : catalogos.tiposParada.find((parada) => parada.id === actividadId);
  if (!actividad || actividad.orden === null) {
    throw new Error("No se pudo resolver la labor o causa del borrador.");
  }

  return {
    codigo: actividad.orden,
    tipoActividad,
    actividadId: actividad.id,
    actividadNombre: actividad.nombre,
  };
}

function crearFilaReconstruida(
  inicio: string,
  actividad: Pick<
    JornadaFilaModel,
    "codigo" | "tipoActividad" | "actividadId" | "actividadNombre"
  >,
  implementoId: string | null,
): JornadaFilaModel {
  return {
    idLocal: crypto.randomUUID(),
    inicio,
    fin: "",
    ...actividad,
    implementoId,
  };
}

export function mapearFilasDeJornadaAdministrativa(
  filas: JornadaAdministrativaFila[],
): JornadaFilaModel[] {
  return filas.map((fila) => {
    const actividad = fila.tipo === "labor" ? fila.labor : fila.parada;
    if (!actividad) {
      throw new Error(
        `La fila ${fila.numero} no incluye la ${fila.tipo} seleccionada.`,
      );
    }

    const codigo = Number(actividad.codigo);
    if (!Number.isInteger(codigo)) {
      throw new Error(`La fila ${fila.numero} incluye un código no válido.`);
    }

    return {
      idLocal: `jornada-${fila.numero}`,
      inicio: fila.inicioLocal,
      fin: fila.finLocal ?? "",
      codigo,
      tipoActividad: fila.tipo,
      actividadId: actividad.id,
      actividadNombre: actividad.nombre,
      implementoId: fila.implemento?.id ?? null,
    };
  });
}

export function reconstruirFilasDeEventos(
  eventos: JornadaAdministrativaEvento[],
  catalogos: CatalogosJornada,
): JornadaFilaModel[] {
  const activos = [...eventos]
    .filter((evento) => !evento.anulado)
    .sort((izquierda, derecha) => izquierda.secuencia - derecha.secuencia);
  const filas: JornadaFilaModel[] = [];
  let filaActual: JornadaFilaModel | null = null;

  const iniciarFila = (
    inicio: string,
    actividad: Pick<
      JornadaFilaModel,
      "codigo" | "tipoActividad" | "actividadId" | "actividadNombre"
    >,
    implementoId: string | null,
  ): void => {
    if (filaActual?.inicio === inicio) {
      filaActual.codigo = actividad.codigo;
      filaActual.tipoActividad = actividad.tipoActividad;
      filaActual.actividadId = actividad.actividadId;
      filaActual.actividadNombre = actividad.actividadNombre;
      filaActual.implementoId = implementoId;
      return;
    }

    if (filaActual) filaActual.fin = inicio;
    filaActual = crearFilaReconstruida(inicio, actividad, implementoId);
    filas.push(filaActual);
  };

  for (const evento of activos) {
    const hora = horaLocalEvento(evento);
    const payload = evento.payload;

    if (evento.tipoEvento === "inicio_jornada") {
      if (!payload.labor_id) continue;
      iniciarFila(
        hora,
        actividadDesdeEvento("labor", payload.labor_id, catalogos),
        payload.implemento_id ?? null,
      );
      continue;
    }

    if (
      evento.tipoEvento === "inicio_parada" ||
      evento.tipoEvento === "cambio_causa"
    ) {
      iniciarFila(
        hora,
        actividadDesdeEvento("parada", payload.tipo_parada_id, catalogos),
        filaActual?.implementoId ?? payload.implemento_id ?? null,
      );
      continue;
    }

    if (evento.tipoEvento === "reanudar") {
      iniciarFila(
        hora,
        actividadDesdeEvento("labor", payload.labor_id, catalogos),
        filaActual?.implementoId ?? payload.implemento_id ?? null,
      );
      continue;
    }

    if (evento.tipoEvento === "cambiar_labor") {
      iniciarFila(
        hora,
        actividadDesdeEvento("labor", payload.nueva_labor_id, catalogos),
        filaActual?.implementoId ?? null,
      );
      continue;
    }

    if (evento.tipoEvento === "confirmar_cambio_implemento") {
      const laborId = payload.labor_id ?? filaActual?.actividadId;
      iniciarFila(
        hora,
        actividadDesdeEvento("labor", laborId, catalogos),
        payload.nuevo_implemento_id ?? null,
      );
      continue;
    }

    if (evento.tipoEvento === "finalizar_jornada" && filaActual) {
      filaActual.fin = hora;
    }
  }

  return filas;
}

export class RegistroEventosLoteFallidoError extends Error {
  readonly resultado: RegistroEventosLoteResponse;

  constructor(resultado: RegistroEventosLoteResponse) {
    super(mensajeErrorLote(resultado));
    this.name = "RegistroEventosLoteFallidoError";
    this.resultado = resultado;
  }
}

const filaRequeridaSchema = z.object({
  inicio: z.string().min(1),
  fin: z.string().min(1),
  codigo: z.number().int(),
  actividadId: z.string().min(1),
});

const jornadaRequeridaSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  operadorId: z.string().uuid(),
  equipoNumero: z.string().min(1),
});

function ocurrioEn(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00-05:00`;
}

function observacionDeJornada(jornada: JornadaState): string | null {
  const observacion = jornada.observaciones.trim();
  return observacion === "" ? null : observacion;
}

function crearEventoLote(
  secuencia: number,
  tipoEvento: EventoLote["tipo_evento"],
  ocurrioEnEvento: string,
  payload: EventoLotePayload,
): EventoLote {
  return {
    secuencia,
    tipo_evento: tipoEvento,
    client_event_id: crypto.randomUUID(),
    ocurrio_en: ocurrioEnEvento,
    latitud: null,
    longitud: null,
    payload,
  };
}

export function construirEventosLote(
  jornada: JornadaState,
  fecha: string,
  operadorId: string,
  equipoNumero: string,
  incluirFinalizacion = true,
): EventoLote[] {
  const primeraFila = jornada.filas[0];
  if (
    !primeraFila ||
    primeraFila.tipoActividad === null ||
    primeraFila.actividadId === null
  )
    throw new Error("Completa la primera actividad de la jornada.");

  const eventos: EventoLote[] = [];
  const agregarEvento = (
    tipoEvento: EventoLote["tipo_evento"],
    ocurrioEnEvento: string,
    payload: EventoLotePayload,
  ): void => {
    eventos.push(
      crearEventoLote(eventos.length + 1, tipoEvento, ocurrioEnEvento, payload),
    );
  };
  const observacion = observacionDeJornada(jornada);

  agregarEvento("inicio_jornada", ocurrioEn(fecha, primeraFila.inicio), {
    operador_id: operadorId,
    fecha_operativa: fecha,
    equipo_numero: equipoNumero,
    labor_id:
      primeraFila.tipoActividad === "labor" ? primeraFila.actividadId : null,
    implemento_id: primeraFila.implementoId,
  });

  if (primeraFila.tipoActividad === "parada") {
    agregarEvento("inicio_parada", ocurrioEn(fecha, primeraFila.inicio), {
      tipo_parada_id: primeraFila.actividadId,
      observacion,
    });
  }

  for (let index = 1; index < jornada.filas.length; index += 1) {
    const filaAnterior = jornada.filas[index - 1];
    const filaActual = jornada.filas[index];
    if (
      !filaActual ||
      filaActual.tipoActividad === null ||
      filaActual.actividadId === null
    )
      throw new Error("Todas las filas deben tener una actividad resuelta.");

    const ocurrioEnFila = ocurrioEn(fecha, filaActual.inicio);
    const implementoCambio =
      filaAnterior.implementoId !== filaActual.implementoId;

    if (implementoCambio && filaAnterior.tipoActividad !== "labor") {
      throw new Error(
        `No puedes cambiar el implemento en la fila ${index + 1} mientras la jornada está en parada.`,
      );
    }

    if (implementoCambio) {
      agregarEvento("confirmar_cambio_implemento", ocurrioEnFila, {
        nuevo_implemento_id: filaActual.implementoId,
        labor_id:
          filaActual.tipoActividad === "labor" ? filaActual.actividadId : null,
      });
    }

    if (filaActual.tipoActividad === "labor") {
      if (implementoCambio || filaAnterior.tipoActividad === "parada") {
        agregarEvento("reanudar", ocurrioEnFila, {
          labor_id: filaActual.actividadId,
        });
      } else if (filaAnterior.actividadId !== filaActual.actividadId) {
        agregarEvento("cambiar_labor", ocurrioEnFila, {
          nueva_labor_id: filaActual.actividadId,
        });
      }
      continue;
    }

    if (implementoCambio || filaAnterior.tipoActividad === "parada") {
      if (
        implementoCambio ||
        filaAnterior.actividadId !== filaActual.actividadId
      ) {
        agregarEvento("cambio_causa", ocurrioEnFila, {
          tipo_parada_id: filaActual.actividadId,
          modo: "cambio_real",
          observacion,
        });
      }
      continue;
    }

    agregarEvento("inicio_parada", ocurrioEnFila, {
      tipo_parada_id: filaActual.actividadId,
      observacion,
    });
  }

  if (incluirFinalizacion) {
    const ultimaFila = jornada.filas.at(-1);
    if (!ultimaFila) throw new Error("Agrega al menos un registro.");
    agregarEvento("finalizar_jornada", ocurrioEn(fecha, ultimaFila.fin), {});
  }

  return eventos;
}

function mensajeErrorLote(resultado: RegistroEventosLoteResponse): string {
  if (resultado.ok) return "";
  const eventoFallido = resultado.evento_fallido;
  const detalleEvento = eventoFallido
    ? ` Evento ${eventoFallido.secuencia}: ${eventoFallido.tipo_evento}.`
    : "";
  return `${resultado.error?.mensaje ?? "No se pudo registrar la jornada."}${detalleEvento}`;
}

/**
 * Resuelve un código únicamente contra los catálogos ya disponibles.
 * La labor activa tiene prioridad sobre la parada activa con el mismo orden.
 */
export function resolverCodigo(
  codigo: number | null,
  catalogos: CatalogosJornada,
): CodigoResuelto {
  if (codigo === null) {
    return {
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "",
    };
  }

  const labor = catalogos.labores.find(
    (item) => item.orden === codigo && item.activo,
  );
  if (labor) {
    return {
      tipoActividad: "labor",
      actividadId: labor.id,
      actividadNombre: labor.nombre,
    };
  }

  const parada = catalogos.tiposParada.find(
    (item) => item.orden === codigo && item.activo,
  );
  if (parada) {
    return {
      tipoActividad: "parada",
      actividadId: parada.id,
      actividadNombre: parada.nombre,
    };
  }

  return {
    tipoActividad: null,
    actividadId: null,
    actividadNombre: "Código no reconocido",
  };
}

/**
 * Reglas locales de la captura. No realiza llamadas RPC ni persiste filas.
 */
export function useJornadaAdmin() {
  const guardando = shallowRef(false);
  const error = shallowRef<string | null>(null);
  const jornadaIdPendiente = shallowRef<string | null>(null);

  function establecerJornadaPendiente(jornadaId: string): void {
    jornadaIdPendiente.value = jornadaId;
  }

  function validarContinuidad(
    filas: JornadaFilaModel[],
  ): ValidacionContinuidad {
    if (filas.length === 0) {
      return { ok: false, mensaje: "Agrega al menos un registro." };
    }

    for (let index = 0; index < filas.length; index += 1) {
      const fila = filas[index];
      if (!filaRequeridaSchema.safeParse(fila).success) {
        return { ok: false, mensaje: `Completa la fila ${index + 1}.` };
      }

      if (fila.fin <= fila.inicio) {
        return {
          ok: false,
          mensaje: `La hora fin de la fila ${index + 1} debe ser posterior al inicio.`,
        };
      }

      if (index > 0 && filas[index - 1].fin !== fila.inicio) {
        return {
          ok: false,
          mensaje: `Existe un espacio o solapamiento entre las filas ${index} y ${index + 1}.`,
        };
      }
    }

    return { ok: true, mensaje: "La secuencia de horas es continua." };
  }

  async function registrarImplemento(
    payload: ImplementoCrearPayload,
  ): Promise<RegistroImplementoResponse | null> {
    const { data, error: rpcError } =
      await registroJornadaService.registrarImplemento(payload);
    if (rpcError) throw rpcError;
    return data;
  }

  async function registrarDesdeFilas(
    jornada: JornadaState,
    p_finalizar: boolean,
  ): Promise<RegistroEventosLoteResponse> {
    const validacion = validarContinuidad(jornada.filas);
    if (!validacion.ok) throw new Error(validacion.mensaje);
    const datosJornada = jornadaRequeridaSchema.safeParse(jornada);
    if (!datosJornada.success) {
      throw new Error(
        "Completa la fecha, el operador y el equipo de la jornada.",
      );
    }

    guardando.value = true;
    error.value = null;

    try {
      const p_jornada_id = jornadaIdPendiente.value ?? crypto.randomUUID();
      jornadaIdPendiente.value = p_jornada_id;
      const p_eventos = construirEventosLote(
        jornada,
        datosJornada.data.fecha,
        datosJornada.data.operadorId,
        datosJornada.data.equipoNumero,
        p_finalizar,
      );
      const resultado = await registroJornadaService.registrarEventosLote({
        p_jornada_id,
        p_eventos,
        p_finalizar,
      });
      if (!resultado.ok) throw new RegistroEventosLoteFallidoError(resultado);
      if (p_finalizar) jornadaIdPendiente.value = null;
      return resultado;
    } catch (capturado) {
      error.value =
        capturado instanceof Error ? capturado.message : "Error desconocido";
      throw capturado;
    } finally {
      guardando.value = false;
    }
  }

  async function guardarBorradorDesdeFilas(
    jornada: JornadaState,
  ): Promise<RegistroEventosLoteResponse> {
    return registrarDesdeFilas(jornada, false);
  }

  async function finalizarDesdeFilas(
    jornada: JornadaState,
  ): Promise<RegistroEventosLoteResponse> {
    return registrarDesdeFilas(jornada, true);
  }

  async function editarJornadaFinalizadaDesdeFilas(
    jornada: JornadaState,
    jornadaId: string,
  ): Promise<RegistroEventosLoteResponse> {
    const validacion = validarContinuidad(jornada.filas);
    if (!validacion.ok) throw new Error(validacion.mensaje);
    const datosJornada = jornadaRequeridaSchema.safeParse(jornada);
    if (!datosJornada.success) {
      throw new Error(
        "Completa la fecha, el operador y el equipo de la jornada.",
      );
    }

    guardando.value = true;
    error.value = null;

    try {
      const payload: EditarJornadaFinalizadaPayload = {
        p_jornada_id: jornadaId,
        p_eventos: construirEventosLote(
          jornada,
          datosJornada.data.fecha,
          datosJornada.data.operadorId,
          datosJornada.data.equipoNumero,
          true,
        ),
        p_motivo: null,
      };
      const resultado =
        await registroJornadaService.editarJornadaFinalizada(payload);
      if (!resultado.ok) throw new RegistroEventosLoteFallidoError(resultado);
      return resultado;
    } catch (capturado) {
      error.value =
        capturado instanceof Error ? capturado.message : "Error desconocido";
      throw capturado;
    } finally {
      guardando.value = false;
    }
  }

  return {
    error,
    guardando,
    registrarImplemento,
    resolverCodigo,
    validarContinuidad,
    guardarBorradorDesdeFilas,
    finalizarDesdeFilas,
    editarJornadaFinalizadaDesdeFilas,
    establecerJornadaPendiente,
  };
}
