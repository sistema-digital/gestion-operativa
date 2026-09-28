import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoCreacionEstructuraLubricacionStep from "./EquipoCreacionEstructuraLubricacionStep.vue";

const catalogo = { id: 1, nombre: "Hidráulico", activo: true };

describe("EquipoCreacionEstructuraLubricacionStep", () => {
  it("muestra el estado vacío y abre el drawer de raíz desde su CTA", async () => {
    const wrapper = mount(EquipoCreacionEstructuraLubricacionStep, {
      props: {
        nodos: [],
        sistemas: [catalogo],
        subsistemas: [catalogo],
        aceites: [catalogo],
        disabled: false,
        errors: [],
      },
      global: { stubs: { teleport: true } },
    });

    expect(wrapper.text()).toContain("Estructura de lubricación");
    expect(wrapper.text()).toContain("Aún no hay estructura de lubricación");
    await wrapper.findAll("button")[1]!.trigger("click");

    expect(wrapper.text()).toContain("Agregar sistema");
    expect(wrapper.text()).toContain("Usar Sin aceite");
  });
});
