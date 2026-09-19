import { shallowRef } from "vue";
import { z } from "zod";
import type { JornadaFilaModel } from "../registroJornada.types";

export interface ValidacionContinuidad {
  ok: boolean;
  mensaje: string;
}

const filaRequeridaSchema = z.object({
  inicio: z.string().min(1),
  fin: z.string().min(1),
  codigo: z.number().int(),
  actividadId: z.string().min(1),
});

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

  return { error, guardando, validarContinuidad };
}
