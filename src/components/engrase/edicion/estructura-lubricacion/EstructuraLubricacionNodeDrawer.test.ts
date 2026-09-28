import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import VueMultiselect from "vue-multiselect";
import EstructuraLubricacionNodeDrawer from "./EstructuraLubricacionNodeDrawer.vue";

const system = { id: 1, nombre: "Hidráulico", activo: true };

describe("EstructuraLubricacionNodeDrawer", () => {
  it("evita etiquetas automáticas y conserva Sin aceite como opción", () => {
    const wrapper = mount(EstructuraLubricacionNodeDrawer, {
      props: {
        mode: "root",
        node: null,
        sistemas: [system],
        subsistemas: [],
        aceites: [],
        movementOptions: [],
        errors: [],
      },
      global: { stubs: { teleport: true } },
    });
    const multiselects = wrapper.findAllComponents(VueMultiselect);
    const catalogSelect = multiselects[0];
    const oilSelect = multiselects[1];

    expect(catalogSelect.props("closeOnSelect")).toBe(true);
    expect(catalogSelect.props("showLabels")).toBe(false);
    expect(catalogSelect.props("hideSelected")).toBe(true);
    expect(oilSelect.props("showLabels")).toBe(false);
    expect(oilSelect.props("allowEmpty")).toBe(false);
    expect(oilSelect.props("options")).toEqual([
      expect.objectContaining({ nombre: "Sin aceite", noOil: true }),
    ]);
    expect(wrapper.findAll("label")).toHaveLength(0);
  });
});
