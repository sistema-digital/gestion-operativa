import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import VueMultiselect from "vue-multiselect";
import type { NodoEstructuraArbol } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EstructuraLubricacionNodeDrawer from "./EstructuraLubricacionNodeDrawer.vue";

const catalogo = { id: 1, nombre: "Hidráulico", activo: true };
const child: NodoEstructuraArbol = {
  localId: "child",
  estadoLocal: "nuevo",
  id: null,
  tempId: "estructura_2",
  parentId: null,
  parentTempId: "estructura_1",
  sistemaId: null,
  subsistemaId: 2,
  aceiteId: null,
  sistema: null,
  subsistema: { id: 2, nombre: "Bomba", activo: true },
  aceite: null,
  hijos: [],
  profundidad: 1,
  ruta: "Hidráulico > Bomba",
};

describe("EstructuraLubricacionNodeDrawer", () => {
  it("limita el drawer de hijo a subsistema y aceite opcional", () => {
    const wrapper = mount(EstructuraLubricacionNodeDrawer, {
      props: {
        mode: "child",
        node: child,
        sistemas: [catalogo],
        subsistemas: [child.subsistema!],
        aceites: [catalogo],
        errors: [],
      },
      global: { stubs: { teleport: true } },
    });

    expect(wrapper.text()).toContain("Agregar subsistema");
    expect(wrapper.text()).toContain("Dentro de: Hidráulico > Bomba");
    expect(wrapper.text()).toContain("Subsistema *");
    const multiselects = wrapper.findAllComponents(VueMultiselect);
    const oilSelect = multiselects[1];

    expect(oilSelect.props("closeOnSelect")).toBe(true);
    expect(oilSelect.props("showLabels")).toBe(false);
    expect(oilSelect.props("allowEmpty")).toBe(false);
    expect(oilSelect.props("options")).toEqual([
      expect.objectContaining({ nombre: "Sin aceite", noOil: true }),
      catalogo,
    ]);
    expect(wrapper.findAll("label")).toHaveLength(0);
    expect(wrapper.text()).not.toContain("Sistema *");
  });
});
