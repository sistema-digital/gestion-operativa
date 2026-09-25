import { describe, expect, it } from "vitest";
import {
  dividirJornadaFila,
  eliminarJornadaFila,
  intercambiarContenidoDeFilas,
  puedeDividirJornadaFila,
} from "./dividirJornadaFila";
import type { JornadaFilaModel } from "../registroJornada.types";

function crearFila(inicio: string, fin: string): JornadaFilaModel {
  return {
    idLocal: "fila-original",
    inicio,
    fin,
    codigo: 10,
    tipoActividad: "labor",
    actividadId: "labor-1",
    actividadNombre: "Preparación",
    implementoId: "implemento-1",
  };
}

describe("dividirJornadaFila", () => {
  it("divide una fila por la mitad y conserva la continuidad", () => {
    const division = dividirJornadaFila(crearFila("08:00", "10:00"));

    expect(division).toEqual(
      expect.objectContaining({
        finFilaActual: "09:00",
        nuevaFila: expect.objectContaining({
          inicio: "09:00",
          fin: "10:00",
          codigo: null,
          tipoActividad: null,
          actividadId: null,
          implementoId: "implemento-1",
        }),
      }),
    );
  });

  it("bloquea la división cuando no puede crear dos intervalos válidos", () => {
    expect(puedeDividirJornadaFila(crearFila("08:00", "08:01"))).toBe(false);
    expect(dividirJornadaFila(crearFila("08:00", "08:01"))).toBeNull();
  });

  it("restaura el intervalo original al eliminar una fila creada por división", () => {
    const filaOriginal = crearFila("10:30", "11:30");
    const division = dividirJornadaFila(filaOriginal);
    if (!division) throw new Error("La fila debería poder dividirse.");

    filaOriginal.fin = division.finFilaActual;
    const filaPosterior = crearFila("11:30", "12:00");
    const filas = [filaOriginal, division.nuevaFila, filaPosterior];

    eliminarJornadaFila(filas, 1);

    expect(filas).toEqual([
      expect.objectContaining({ inicio: "10:30", fin: "11:30" }),
      expect.objectContaining({ inicio: "11:30", fin: "12:00" }),
    ]);
  });

  it("no reasigna tiempos al eliminar una fila cargada originalmente", () => {
    const filaAnterior = crearFila("10:30", "11:30");
    const filaOriginal = crearFila("11:30", "12:00");
    const filaSiguiente = crearFila("12:00", "13:00");
    const filas = [filaAnterior, filaOriginal, filaSiguiente];

    eliminarJornadaFila(filas, 1);

    expect(filas).toEqual([
      expect.objectContaining({ inicio: "10:30", fin: "11:30" }),
      expect.objectContaining({ inicio: "12:00", fin: "13:00" }),
    ]);
  });

  it("mueve actividad e implemento sin cambiar los intervalos ni su origen", () => {
    const primeraFila = {
      ...crearFila("10:30", "11:30"),
      origenDivision: { filaOrigenId: "origen", finOriginal: "11:30" },
    };
    const segundaFila = {
      ...crearFila("11:30", "12:00"),
      codigo: 20,
      actividadId: "labor-2",
      actividadNombre: "Transporte",
      implementoId: "implemento-2",
    };
    const filas = [primeraFila, segundaFila];

    expect(intercambiarContenidoDeFilas(filas, 0, 1)).toBe(true);
    expect(filas).toEqual([
      expect.objectContaining({
        inicio: "10:30",
        fin: "11:30",
        codigo: 20,
        implementoId: "implemento-2",
        origenDivision: { filaOrigenId: "origen", finOriginal: "11:30" },
      }),
      expect.objectContaining({
        inicio: "11:30",
        fin: "12:00",
        codigo: 10,
        implementoId: "implemento-1",
      }),
    ]);
  });
});
