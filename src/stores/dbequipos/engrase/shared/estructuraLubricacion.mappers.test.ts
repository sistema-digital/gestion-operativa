import { describe, expect, it } from "vitest";
import {
  mapAuxiliaresEstructuraLubricacion,
  mapNodoEstructuraLubricacion,
} from "./estructuraLubricacion.mappers";

const errorContrato = (mensaje: string): Error => new Error(mensaje);

describe("mappers de estructura de lubricación", () => {
  it("mapea auxiliares activos y exige sus tres catálogos", () => {
    expect(
      mapAuxiliaresEstructuraLubricacion(
        {
          ok: true,
          sistemas: [{ id: 1, nombre: " MOTOR " }],
          subsistemas: [{ id: 2, nombre: " BOMBA " }],
          aceites: [{ id: 3, nombre: " AW100 " }],
        },
        errorContrato,
      ),
    ).toEqual({
      sistemas: [{ id: 1, nombre: "MOTOR", activo: true }],
      subsistemas: [{ id: 2, nombre: "BOMBA", activo: true }],
      aceites: [{ id: 3, nombre: "AW100", activo: true }],
    });
  });

  it("rechaza auxiliares incompletos y el contrato legacy", () => {
    expect(() =>
      mapAuxiliaresEstructuraLubricacion(
        {
          ok: true,
          sistemas: [],
          aceites: [],
        },
        errorContrato,
      ),
    ).toThrow(/Auxiliares de estructura inválidos/);

    expect(() =>
      mapAuxiliaresEstructuraLubricacion(
        Object.assign(
          {
            ok: true,
            sistemas: [],
            subsistemas: [],
            aceites: [],
          },
          { sistemas_aceite: [] },
        ),
        errorContrato,
      ),
    ).toThrow(/sistemas_aceite ya no es compatible/);
  });

  it("acepta raíz sin aceite e hijo con aceite inactivo", () => {
    expect(
      mapNodoEstructuraLubricacion(
        {
          id: 10,
          parent_id: null,
          sistema: { id: 1, nombre: "MOTOR", activo: true },
          subsistema: null,
          aceite: null,
        },
        errorContrato,
      ),
    ).toMatchObject({ id: 10, parentId: null, aceite: null });

    expect(
      mapNodoEstructuraLubricacion(
        {
          id: 11,
          parent_id: 10,
          sistema: null,
          subsistema: { id: 2, nombre: "BOMBA", activo: false },
          aceite: { id: 3, nombre: "AW100", activo: false },
        },
        errorContrato,
      ),
    ).toMatchObject({ parentId: 10, subsistema: { activo: false } });
  });

  it("rechaza una raíz con subsistema", () => {
    expect(() =>
      mapNodoEstructuraLubricacion(
        {
          id: 10,
          parent_id: null,
          sistema: null,
          subsistema: { id: 2, nombre: "BOMBA", activo: true },
          aceite: null,
        },
        errorContrato,
      ),
    ).toThrow(/Nodo de estructura inválido/);
  });

  it.each([
    {
      id: 0,
      parent_id: null,
      sistema: { id: 1, nombre: "MOTOR", activo: true },
      subsistema: null,
      aceite: null,
    },
    {
      id: 10,
      parent_id: null,
      sistema: { id: 1, nombre: "   ", activo: true },
      subsistema: null,
      aceite: null,
    },
    {
      id: 10,
      parent_id: null,
      sistema: null,
      subsistema: null,
      aceite: null,
    },
    {
      id: 10,
      parent_id: 9,
      sistema: { id: 1, nombre: "MOTOR", activo: true },
      subsistema: null,
      aceite: null,
    },
    {
      id: 10,
      parent_id: 9,
      sistema: null,
      subsistema: null,
      aceite: null,
    },
  ])("rechaza nodos con identificadores, nombres o tipo inválido", (dto) => {
    expect(() => mapNodoEstructuraLubricacion(dto, errorContrato)).toThrow(
      /Nodo de estructura inválido/,
    );
  });
});
