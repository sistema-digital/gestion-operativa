import { shallowRef } from "vue";
import { z } from "zod";
import { registroJornadaService } from "../services/registroJornada.service";
import type {
  ActividadTipo,
  CatalogosJornada,
  ImplementoCrearPayload,
  JornadaFilaModel,
  RegistroImplementoResponse,
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

  return {
    error,
    guardando,
    registrarImplemento,
    resolverCodigo,
    validarContinuidad,
  };
}
