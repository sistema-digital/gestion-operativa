import type { JornadaFilaModel } from "../registroJornada.types";

function minutosDesdeHora(hora: string): number | null {
  const coincidencia = hora.match(/^(\d{2}):(\d{2})$/);
  if (!coincidencia) return null;

  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) return null;

  return horas * 60 + minutos;
}

function horaDesdeMinutos(totalMinutos: number): string {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function obtenerHoraDivision(fila: JornadaFilaModel): string | null {
  const inicio = minutosDesdeHora(fila.inicio);
  const fin = minutosDesdeHora(fila.fin);
  if (inicio === null || fin === null || fin - inicio < 2) return null;

  return horaDesdeMinutos(inicio + Math.floor((fin - inicio) / 2));
}

export interface DivisionJornadaFila {
  finFilaActual: string;
  nuevaFila: JornadaFilaModel;
}

export function puedeDividirJornadaFila(fila: JornadaFilaModel): boolean {
  return obtenerHoraDivision(fila) !== null;
}

export function dividirJornadaFila(
  fila: JornadaFilaModel,
): DivisionJornadaFila | null {
  const horaDivision = obtenerHoraDivision(fila);
  if (!horaDivision) return null;

  return {
    finFilaActual: horaDivision,
    nuevaFila: {
      idLocal: crypto.randomUUID(),
      inicio: horaDivision,
      fin: fila.fin,
      codigo: null,
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "",
      implementoId: fila.implementoId,
      origenDivision: {
        filaOrigenId: fila.idLocal,
        finOriginal: fila.fin,
      },
    },
  };
}

function puedeRestaurarFilaDividida(
  filas: JornadaFilaModel[],
  index: number,
): boolean {
  const fila = filas[index];
  const filaAnterior = index > 0 ? filas[index - 1] : undefined;
  const filaSiguiente = filas[index + 1];
  const origenDivision = fila?.origenDivision;

  return Boolean(
    fila &&
    filaAnterior &&
    origenDivision &&
    filaAnterior.idLocal === origenDivision.filaOrigenId &&
    filaAnterior.fin === fila.inicio &&
    fila.fin === origenDivision.finOriginal &&
    (!filaSiguiente || filaSiguiente.inicio === origenDivision.finOriginal),
  );
}

export function eliminarJornadaFila(
  filas: JornadaFilaModel[],
  index: number,
): void {
  const fila = filas[index];
  if (!fila) return;

  if (puedeRestaurarFilaDividida(filas, index)) {
    const filaAnterior = filas[index - 1];
    if (filaAnterior) {
      filaAnterior.fin = fila.origenDivision?.finOriginal ?? filaAnterior.fin;
    }
  }

  filas.splice(index, 1);
}

type ContenidoJornadaFila = Pick<
  JornadaFilaModel,
  | "codigo"
  | "tipoActividad"
  | "actividadId"
  | "actividadNombre"
  | "implementoId"
>;

function obtenerContenidoDeFila(fila: JornadaFilaModel): ContenidoJornadaFila {
  return {
    codigo: fila.codigo,
    tipoActividad: fila.tipoActividad,
    actividadId: fila.actividadId,
    actividadNombre: fila.actividadNombre,
    implementoId: fila.implementoId,
  };
}

export function intercambiarContenidoDeFilas(
  filas: JornadaFilaModel[],
  primerIndice: number,
  segundoIndice: number,
): boolean {
  const primeraFila = filas[primerIndice];
  const segundaFila = filas[segundoIndice];
  if (!primeraFila || !segundaFila) return false;

  const contenidoPrimeraFila = obtenerContenidoDeFila(primeraFila);
  Object.assign(primeraFila, obtenerContenidoDeFila(segundaFila));
  Object.assign(segundaFila, contenidoPrimeraFila);

  return true;
}
