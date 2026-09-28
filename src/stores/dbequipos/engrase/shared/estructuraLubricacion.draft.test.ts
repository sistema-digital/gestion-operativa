import { describe, expect, it } from "vitest";
import type {
  CatalogoActivo,
  NodoEstructuraLubricacion,
} from "./estructuraLubricacion.types";
import {
  agregarHijoEstructura,
  agregarRaizEstructura,
  actualizarAceiteNodo,
  clonarBorradorEstructura,
  crearBorradorEstructura,
  deshacerEliminacionNodo,
  marcarNodoParaEliminar,
  moverNodoEstructura,
  obtenerSubarbolActivo,
} from "./estructuraLubricacion.draft";
import { construirCambiosEstructura } from "./estructuraLubricacion.payload";
import { construirArbolEstructura } from "./estructuraLubricacion.tree";
import { validarBorradorEstructura } from "./estructuraLubricacion.validation";

const sistema: CatalogoActivo = { id: 1, nombre: "HIDRÁULICO", activo: true };
const subsistema: CatalogoActivo = { id: 2, nombre: "DIRECCIÓN", activo: true };
const bomba: CatalogoActivo = { id: 3, nombre: "BOMBA", activo: true };
const aceite: CatalogoActivo = { id: 4, nombre: "AW100", activo: true };
const aceiteInactivo: CatalogoActivo = {
  id: 5,
  nombre: "85W140",
  activo: false,
};
const auxiliares = {
  sistemas: [sistema, { ...sistema, id: 9, nombre: "TRANSMISIÓN" }],
  subsistemas: [subsistema, bomba, { ...subsistema, id: 8 }],
  aceites: [aceite],
};

const snapshot = (): NodoEstructuraLubricacion[] => [
  { id: 10, parentId: null, sistema, subsistema: null, aceite: null },
  {
    id: 11,
    parentId: 10,
    sistema: null,
    subsistema: { ...subsistema, activo: false },
    aceite: { ...aceite, activo: false },
  },
  { id: 12, parentId: 11, sistema: null, subsistema: bomba, aceite: null },
];

describe("motor de borrador de estructura de lubricación", () => {
  it("inicializa lista plana y preserva valores inactivos existentes", () => {
    const borrador = crearBorradorEstructura(snapshot());
    expect(borrador).toHaveLength(3);
    expect(borrador[1]).toMatchObject({
      estadoLocal: "existente",
      parentId: 10,
      subsistemaId: 2,
      aceiteId: 4,
      subsistema: { activo: false },
    });
  });

  it("agrega raíces e hijos de profundidad N, reutilizando aceite", () => {
    const raiz = agregarRaizEstructura([], { sistema, aceite }, auxiliares);
    expect(raiz.ok).toBe(true);
    if (!raiz.ok) return;
    const hijo = agregarHijoEstructura(
      raiz.nodos,
      {
        parentLocalId: raiz.localId,
        subsistema,
        aceite,
      },
      auxiliares,
    );
    expect(hijo.ok).toBe(true);
    if (!hijo.ok) return;
    const nieto = agregarHijoEstructura(
      hijo.nodos,
      {
        parentLocalId: hijo.localId,
        subsistema: bomba,
        aceite: null,
      },
      auxiliares,
    );
    expect(nieto.ok).toBe(true);
    if (!nieto.ok) return;
    expect(
      construirArbolEstructura(nieto.nodos)[0]?.hijos[0]?.hijos[0]?.profundidad,
    ).toBe(2);
  });

  it("solo acepta IDs presentes en los auxiliares autorizados", () => {
    expect(
      agregarRaizEstructura(
        [],
        { sistema: { ...sistema, activo: false }, aceite: null },
        auxiliares,
      ),
    ).toMatchObject({ ok: true });
    expect(
      agregarRaizEstructura(
        [],
        {
          sistema: { ...sistema, id: 999, activo: true },
          aceite: null,
        },
        auxiliares,
      ),
    ).toMatchObject({ ok: false, codigo: "ESTRUCTURA_CATALOGO_INACTIVO" });
    const borrador = crearBorradorEstructura(snapshot());
    expect(
      actualizarAceiteNodo(
        borrador,
        {
          localId: borrador[0]!.localId,
          aceite: aceiteInactivo,
        },
        auxiliares,
      ),
    ).toMatchObject({ ok: false, codigo: "ACEITE_NO_DISPONIBLE_PARA_ASIGNAR" });
  });

  it("cambia o retira aceite sin eliminar el nodo", () => {
    const borrador = crearBorradorEstructura(snapshot());
    const cambio = actualizarAceiteNodo(
      borrador,
      {
        localId: borrador[1]!.localId,
        aceite: null,
      },
      auxiliares,
    );
    expect(cambio.ok).toBe(true);
    if (!cambio.ok) return;
    expect(cambio.nodos[1]).toMatchObject({ id: 11, aceiteId: null });
    expect(
      construirCambiosEstructura(snapshot(), cambio.nodos).actualizados,
    ).toEqual([{ id: 11, aceite_id: null }]);
  });

  it("mueve un hijo a padre temporal y evita ciclos", () => {
    const borrador = crearBorradorEstructura(snapshot());
    const nuevaRaiz = agregarRaizEstructura(
      borrador,
      {
        sistema: { ...sistema, id: 9, nombre: "TRANSMISIÓN" },
        aceite: null,
      },
      auxiliares,
    );
    expect(nuevaRaiz.ok).toBe(true);
    if (!nuevaRaiz.ok) return;
    const movido = moverNodoEstructura(nuevaRaiz.nodos, {
      localId: borrador[1]!.localId,
      nuevoPadreLocalId: nuevaRaiz.localId,
    });
    expect(movido.ok).toBe(true);
    if (!movido.ok) return;
    expect(movido.nodos.find((nodo) => nodo.id === 11)).toMatchObject({
      parentId: null,
      parentTempId: nuevaRaiz.nodos.find(
        (nodo) => nodo.localId === nuevaRaiz.localId,
      )?.tempId,
    });
    expect(
      construirCambiosEstructura(snapshot(), movido.nodos).actualizados,
    ).toEqual([
      expect.objectContaining({
        id: 11,
        parent_temp_id: nuevaRaiz.nodos.find(
          (item) => item.localId === nuevaRaiz.localId,
        )?.tempId,
      }),
    ]);
    expect(
      construirCambiosEstructura(snapshot(), movido.nodos).actualizados[0],
    ).not.toHaveProperty("parent_id");
    expect(
      moverNodoEstructura(movido.nodos, {
        localId: borrador[1]!.localId,
        nuevoPadreLocalId: borrador[2]!.localId,
      }),
    ).toMatchObject({ ok: false, codigo: "ESTRUCTURA_CICLO" });
  });

  it("marca el subárbol persistido y lo recupera al deshacer", () => {
    const borrador = crearBorradorEstructura(snapshot());
    const eliminado = marcarNodoParaEliminar(borrador, borrador[1]!.localId);
    expect(eliminado.eliminados.map((nodo) => nodo.id)).toEqual([11, 12]);
    expect(
      eliminado.nodos.filter(
        (nodo) => nodo.estadoLocal === "pendiente_eliminacion",
      ),
    ).toHaveLength(2);
    const restaurado = deshacerEliminacionNodo(
      eliminado.nodos,
      borrador[1]!.localId,
    );
    expect(restaurado.ok).toBe(true);
    if (restaurado.ok)
      expect(
        restaurado.nodos.filter(
          (nodo) => nodo.estadoLocal === "pendiente_eliminacion",
        ),
      ).toHaveLength(0);
  });

  it("elimina nodos nuevos sin añadirlos a eliminados y colapsa el payload de cascada", () => {
    const raiz = agregarRaizEstructura(
      [],
      { sistema, aceite: null },
      auxiliares,
    );
    if (!raiz.ok) return;
    const hijo = agregarHijoEstructura(
      raiz.nodos,
      {
        parentLocalId: raiz.localId,
        subsistema,
        aceite,
      },
      auxiliares,
    );
    if (!hijo.ok) return;
    expect(marcarNodoParaEliminar(hijo.nodos, raiz.localId).nodos).toEqual([]);

    const borrador = crearBorradorEstructura(snapshot());
    const eliminado = marcarNodoParaEliminar(borrador, borrador[0]!.localId);
    expect(
      construirCambiosEstructura(snapshot(), eliminado.nodos).eliminados,
    ).toEqual([{ id: 10 }]);
  });

  it("deriva árbol conservando el orden, la ruta y excluyendo pendientes", () => {
    const borrador = crearBorradorEstructura(snapshot());
    const arbol = construirArbolEstructura(borrador);
    expect(arbol[0]).toMatchObject({ profundidad: 0, ruta: "HIDRÁULICO" });
    expect(arbol[0]?.hijos[0]).toMatchObject({
      profundidad: 1,
      ruta: "HIDRÁULICO > DIRECCIÓN",
    });
    const eliminado = marcarNodoParaEliminar(borrador, borrador[1]!.localId);
    expect(construirArbolEstructura(eliminado.nodos)[0]?.hijos).toEqual([]);
  });

  it("detecta padre inválido, tipo incorrecto y ciclos en el borrador", () => {
    const borrador = crearBorradorEstructura(snapshot());
    const invalido = clonarBorradorEstructura(borrador);
    invalido[1]!.sistemaId = sistema.id;
    invalido[1]!.sistema = sistema;
    invalido[1]!.subsistemaId = null;
    invalido[1]!.subsistema = null;
    expect(
      validarBorradorEstructura(invalido).errores.map((error) => error.codigo),
    ).toContain("ESTRUCTURA_HIJO_INVALIDO");

    const ciclo = clonarBorradorEstructura(borrador);
    ciclo[0]!.parentId = 12;
    expect(
      validarBorradorEstructura(ciclo).errores.map((error) => error.codigo),
    ).toContain("ESTRUCTURA_CICLO");
  });

  it("valida identidades duplicadas aunque un nodo esté pendiente de eliminación", () => {
    const borrador = crearBorradorEstructura(snapshot());
    const invalido = clonarBorradorEstructura(borrador);
    invalido[2]!.estadoLocal = "pendiente_eliminacion";
    invalido[2]!.id = invalido[0]!.id;
    const errores = validarBorradorEstructura(invalido).errores.map(
      (error) => error.codigo,
    );
    expect(errores).toContain("ESTRUCTURA_ID_DUPLICADO");

    const primeraRaiz = agregarRaizEstructura(
      [],
      { sistema, aceite: null },
      auxiliares,
    );
    if (!primeraRaiz.ok) return;
    const segundaRaiz = agregarRaizEstructura(
      primeraRaiz.nodos,
      { sistema: auxiliares.sistemas[1]!, aceite: null },
      auxiliares,
    );
    if (!segundaRaiz.ok) return;
    const temporales = clonarBorradorEstructura(segundaRaiz.nodos);
    temporales[1]!.tempId = temporales[0]!.tempId;
    expect(
      validarBorradorEstructura(temporales).errores.map(
        (error) => error.codigo,
      ),
    ).toContain("ESTRUCTURA_TEMP_ID_DUPLICADO");
  });

  it("serializa un nuevo hijo bajo un padre persistido con parent_id", () => {
    const borrador = crearBorradorEstructura(snapshot());
    const hijo = agregarHijoEstructura(
      borrador,
      {
        parentLocalId: borrador[0]!.localId,
        subsistema: { ...subsistema, id: 8 },
        aceite: null,
      },
      auxiliares,
    );
    expect(hijo.ok).toBe(true);
    if (!hijo.ok) return;
    expect(construirCambiosEstructura(snapshot(), hijo.nodos).nuevos).toEqual([
      expect.objectContaining({
        parent_id: 10,
        parent_temp_id: null,
        sistema_id: null,
        subsistema_id: 8,
      }),
    ]);
  });

  it("devuelve arreglos vacíos cuando la estructura no cambia", () => {
    const borrador = crearBorradorEstructura(snapshot());
    expect(construirCambiosEstructura(snapshot(), borrador)).toEqual({
      nuevos: [],
      actualizados: [],
      eliminados: [],
    });
    expect(obtenerSubarbolActivo(borrador, "inexistente")).toEqual([]);
  });
});
