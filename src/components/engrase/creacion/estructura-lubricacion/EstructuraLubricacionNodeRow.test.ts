import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { NodoEstructuraArbol } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EstructuraLubricacionNodeRow from "./EstructuraLubricacionNodeRow.vue";

const node: NodoEstructuraArbol = {
  localId: "node-1",
  estadoLocal: "nuevo",
  id: null,
  tempId: "node-1",
  parentId: null,
  parentTempId: null,
  sistemaId: 1,
  subsistemaId: null,
  aceiteId: null,
  sistema: { id: 1, nombre: "Hidráulico", activo: true },
  subsistema: null,
  aceite: null,
  hijos: [],
  profundidad: 0,
  ruta: "Hidráulico",
};

describe("EstructuraLubricacionNodeRow", () => {
  it("expone las acciones de nodo sin aceite en un menú accesible", async () => {
    const wrapper = mount(EstructuraLubricacionNodeRow, {
      props: { node, expanded: false, disabled: false, errors: [] },
    });

    expect(wrapper.text()).toContain("Sin aceite");
    await wrapper
      .get('button[aria-label="Acciones para Hidráulico"]')
      .trigger("click");
    expect(wrapper.get('[role="group"]').text()).toContain("Asignar aceite");
    expect(wrapper.get('[role="group"]').classes()).toEqual(
      expect.arrayContaining(["fixed", "sm:absolute"]),
    );
    await wrapper.get('[role="group"] button').trigger("click");

    expect(wrapper.emitted("action")?.[0]?.[0]).toBe("add-child");
  });

  it("muestra el error junto al nodo y permite cerrar acciones con Escape", async () => {
    const wrapper = mount(EstructuraLubricacionNodeRow, {
      props: {
        node,
        expanded: false,
        disabled: false,
        errors: [{ mensaje: "El nodo no es válido.", fieldId: node.localId }],
      },
    });

    expect(wrapper.text()).toContain("El nodo no es válido.");
    await wrapper
      .get('button[aria-label="Acciones para Hidráulico"]')
      .trigger("click");
    await wrapper.get('[role="group"]').trigger("keydown", { key: "Escape" });
    expect(wrapper.find('[role="group"]').exists()).toBe(false);
  });

  it("ofrece cambiar y retirar un aceite ya asignado", async () => {
    const wrapper = mount(EstructuraLubricacionNodeRow, {
      props: {
        node: {
          ...node,
          aceiteId: 2,
          aceite: { id: 2, nombre: "AW100", activo: true },
        },
        expanded: false,
        disabled: false,
        errors: [],
      },
    });

    await wrapper
      .get('button[aria-label="Acciones para Hidráulico"]')
      .trigger("click");
    expect(wrapper.text()).toContain("Cambiar aceite");
    expect(wrapper.text()).toContain("Quitar aceite");
  });
});
