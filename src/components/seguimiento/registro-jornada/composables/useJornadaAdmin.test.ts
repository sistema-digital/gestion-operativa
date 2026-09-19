import { describe, expect, it } from "vitest";
import { resolverCodigo, useJornadaAdmin } from "./useJornadaAdmin";
import type { CatalogosJornada } from "../registroJornada.types";

const catalogos: CatalogosJornada = {
  labores: [
    { id: "labor-1", orden: 10, nombre: "Siembra", activo: true },
    { id: "labor-2", orden: 20, nombre: "Labor inactiva", activo: false },
  ],
  tiposParada: [
    { id: "parada-1", orden: 10, nombre: "Pausa", activo: true },
    { id: "parada-2", orden: 30, nombre: "Abastecimiento", activo: true },
    { id: "parada-3", orden: 40, nombre: "Parada inactiva", activo: false },
  ],
  implementos: [],
  implementoTipos: [],
};

describe("resolverCodigo", () => {
  it("prioriza la labor activa cuando coincide con una parada", () => {
    expect(resolverCodigo(10, catalogos)).toEqual({
      tipoActividad: "labor",
      actividadId: "labor-1",
      actividadNombre: "Siembra",
    });
  });

  it("resuelve una parada activa cuando no existe labor activa", () => {
    expect(resolverCodigo(30, catalogos)).toEqual({
      tipoActividad: "parada",
      actividadId: "parada-2",
      actividadNombre: "Abastecimiento",
    });
  });

  it("limpia la actividad cuando el código está vacío", () => {
    expect(resolverCodigo(null, catalogos)).toEqual({
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "",
    });
  });

  it("no resuelve coincidencias inactivas ni códigos desconocidos", () => {
    expect(resolverCodigo(20, catalogos)).toEqual({
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "Código no reconocido",
    });
    expect(resolverCodigo(40, catalogos)).toEqual({
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "Código no reconocido",
    });
  });

  it("queda disponible desde el composable", () => {
    expect(useJornadaAdmin().resolverCodigo).toBe(resolverCodigo);
  });
});
