import { describe, expect, it } from "vitest";
import { crearEquipoDraftInicial } from "./equipoEngraseCreacion.draft";
import { validarPasoEstructuraLubricacion } from "./equipoEngraseCreacion.validation";

describe("validarPasoEstructuraLubricacion", () => {
  it("permite una estructura vacía y bloquea un nodo estructuralmente inválido", () => {
    const vacio = crearEquipoDraftInicial();
    expect(validarPasoEstructuraLubricacion(vacio).valido).toBe(true);

    const invalido = crearEquipoDraftInicial();
    invalido.estructuraSistemas = [
      {
        localId: "estructura-invalida",
        estadoLocal: "nuevo",
        id: null,
        tempId: "estructura-invalida",
        parentId: null,
        parentTempId: null,
        sistemaId: null,
        subsistemaId: 2,
        aceiteId: null,
        sistema: null,
        subsistema: { id: 2, nombre: "Bomba", activo: true },
        aceite: null,
      },
    ];

    const resultado = validarPasoEstructuraLubricacion(invalido);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores[0]).toMatchObject({
      paso: 3,
      seccion: "estructura",
      fieldId: "estructura-invalida",
    });
  });
});
