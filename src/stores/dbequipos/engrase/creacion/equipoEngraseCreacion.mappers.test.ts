import { describe, expect, it } from "vitest";
import { mapCrearEquipoCompleto } from "./equipoEngraseCreacion.mappers";
import type { CrearEquipoCompletoDto } from "./equipoEngraseCreacion.dto";

const respuesta: CrearEquipoCompletoDto = {
  ok: true,
  codigo: "EQUIPO_CREADO",
  mensaje: "Equipo creado.",
  equipo_lista: {
    id: 21,
    codigo: "410021",
    tipo_equipo_id: 3,
    tipo_equipo: "Cosechadora",
    subtipo: "Serie 9",
    estado: "activo",
    main_storage_path: null,
    tiene_imagen_main: false,
    imagen_actualizada_en: null,
    etapas: [],
  },
  resumen_operaciones: {
    etapas_agregadas: 1,
    filtros_agregados: 2,
    aceites_agregados: 3,
    estructura_agregada: 4,
    sistemas_agregados: 1,
    subsistemas_agregados: 3,
  },
  estructura_temp_ids: { estructura_1: 500, estructura_2: 501 },
};

describe("mappers de creación de equipos", () => {
  it("mapea métricas y temporales de la estructura de lubricación", () => {
    const resultado = mapCrearEquipoCompleto(respuesta);

    expect(resultado.resumenOperaciones).toMatchObject({
      estructuraAgregada: 4,
      sistemasAgregados: 1,
      subsistemasAgregados: 3,
    });
    expect(resultado.estructuraTempIds).toEqual({
      estructura_1: 500,
      estructura_2: 501,
    });
  });
});
