import { shallowRef } from "vue";
import { z } from "zod";
import { registroJornadaService } from "../services/registroJornada.service";
import type {
  ActividadTipo,
  CatalogosJornada,
  ImplementoCrearPayload,
  JornadaFilaModel,
  JornadaInicioRpcPayload,
  RegistroImplementoResponse,
  RegistrarParadaRpcPayload,
  ReanudarTrabajoRpcPayload,
  JornadaState,
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

const coordenadasNulas = {
  p_latitud: null,
  p_longitud: null,
} as const;

function ocurrioEn(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00-05:00`;
}

function observacionDeJornada(jornada: JornadaState): string | null {
  const observacion = jornada.observaciones.trim();
  return observacion === "" ? null : observacion;
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

  async function ejecutarInicio(
    jornada: JornadaState,
    primeraFila: JornadaFilaModel,
  ): Promise<string> {
    const datosJornada = jornadaRequeridaSchema.safeParse(jornada);
    if (
      !datosJornada.success ||
      primeraFila.tipoActividad === null ||
      primeraFila.actividadId === null
    ) {
      throw new Error("Completa los datos generales y la primera actividad.");
    }

    const payload: JornadaInicioRpcPayload = {
      p_operador_id: datosJornada.data.operadorId,
      p_fecha_operativa: datosJornada.data.fecha,
      p_equipo_numero: datosJornada.data.equipoNumero,
      p_labor_id:
        primeraFila.tipoActividad === "labor" ? primeraFila.actividadId : null,
      p_ocurrio_en: ocurrioEn(datosJornada.data.fecha, primeraFila.inicio),
      p_implemento_id: primeraFila.implementoId,
      ...coordenadasNulas,
    };
    const { data, error: rpcError } =
      await registroJornadaService.iniciarJornada(payload);

    if (rpcError) throw rpcError;
    if (!data?.ok || !data.jornada_id) {
      throw new Error("No se recibió el identificador de la jornada iniciada.");
    }

    if (primeraFila.tipoActividad === "parada") {
      const paradaPayload: RegistrarParadaRpcPayload = {
        p_jornada_id: data.jornada_id,
        p_tipo_parada_id: primeraFila.actividadId,
        p_ocurrio_en: ocurrioEn(datosJornada.data.fecha, primeraFila.inicio),
        p_observacion: observacionDeJornada(jornada),
        ...coordenadasNulas,
      };
      const { error: paradaError } =
        await registroJornadaService.registrarParada(paradaPayload);
      if (paradaError) throw paradaError;
    }

    return data.jornada_id;
  }

  async function traducirFila(
    jornada: JornadaState,
    jornadaId: string,
    filaAnterior: JornadaFilaModel,
    filaActual: JornadaFilaModel,
  ): Promise<void> {
    if (filaActual.tipoActividad === null || filaActual.actividadId === null) {
      throw new Error("Todas las filas deben tener una actividad resuelta.");
    }

    const fecha = jornada.fecha;
    if (fecha === null) {
      throw new Error("Completa la fecha de la jornada.");
    }

    const ocurrioEnFila = ocurrioEn(fecha, filaActual.inicio);
    const observacion = observacionDeJornada(jornada);
    const implementoCambio =
      filaAnterior.implementoId !== filaActual.implementoId;

    if (implementoCambio) {
      const { error: implementoError } =
        await registroJornadaService.cambiarImplemento({
          p_jornada_id: jornadaId,
          p_ocurrio_en: ocurrioEnFila,
          p_nuevo_implemento_id: filaActual.implementoId,
          p_labor_id:
            filaActual.tipoActividad === "labor"
              ? filaActual.actividadId
              : null,
          ...coordenadasNulas,
        });
      if (implementoError) throw implementoError;
    }

    const debeReanudar =
      filaActual.tipoActividad === "labor" &&
      (implementoCambio || filaAnterior.tipoActividad === "parada");

    if (debeReanudar) {
      const payload: ReanudarTrabajoRpcPayload = {
        p_jornada_id: jornadaId,
        p_ocurrio_en: ocurrioEnFila,
        p_labor_id: filaActual.actividadId,
        ...coordenadasNulas,
      };
      const { error: reanudarError } =
        await registroJornadaService.reanudarTrabajo(payload);
      if (reanudarError) throw reanudarError;
      return;
    }

    if (filaActual.tipoActividad === "labor") {
      if (
        filaAnterior.tipoActividad === "labor" &&
        filaAnterior.actividadId !== filaActual.actividadId
      ) {
        const { error: laborError } = await registroJornadaService.cambiarLabor(
          {
            p_jornada_id: jornadaId,
            p_nueva_labor_id: filaActual.actividadId,
            p_ocurrio_en: ocurrioEnFila,
            ...coordenadasNulas,
          },
        );
        if (laborError) throw laborError;
      }
      return;
    }

    if (implementoCambio || filaAnterior.tipoActividad === "parada") {
      if (
        implementoCambio ||
        filaAnterior.actividadId !== filaActual.actividadId
      ) {
        const { error: paradaError } =
          await registroJornadaService.cambiarTipoParada({
            p_jornada_id: jornadaId,
            p_tipo_parada_id: filaActual.actividadId,
            p_ocurrio_en: ocurrioEnFila,
            p_modo: "cambio_real",
            p_observacion: observacion,
            ...coordenadasNulas,
          });
        if (paradaError) throw paradaError;
      }
      return;
    }

    const { error: paradaError } = await registroJornadaService.registrarParada(
      {
        p_jornada_id: jornadaId,
        p_tipo_parada_id: filaActual.actividadId,
        p_ocurrio_en: ocurrioEnFila,
        p_observacion: observacion,
        ...coordenadasNulas,
      },
    );
    if (paradaError) throw paradaError;
  }

  async function finalizarDesdeFilas(jornada: JornadaState): Promise<void> {
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
      const primeraFila = jornada.filas[0];
      const jornadaId = await ejecutarInicio(jornada, primeraFila);

      for (let index = 1; index < jornada.filas.length; index += 1) {
        await traducirFila(
          jornada,
          jornadaId,
          jornada.filas[index - 1],
          jornada.filas[index],
        );
      }

      const ultimaFila = jornada.filas.at(-1);
      if (!ultimaFila) throw new Error("Agrega al menos un registro.");

      const { error: finalizarError } =
        await registroJornadaService.finalizarJornada({
          p_jornada_id: jornadaId,
          p_ocurrio_en: ocurrioEn(datosJornada.data.fecha, ultimaFila.fin),
          ...coordenadasNulas,
        });
      if (finalizarError) throw finalizarError;
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
    finalizarDesdeFilas,
  };
}
