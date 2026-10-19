import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it } from "vitest";
import { useFiltrosEngrase } from "./useFiltrosEngrase";

const ComposableHarness = defineComponent({
  setup() {
    return { filtrosEngrase: useFiltrosEngrase() };
  },
  template: "<div />",
});

describe("useFiltrosEngrase", () => {
  it("expone las acciones de carga diferida del detalle de equipo", () => {
    const wrapper = mount(ComposableHarness, {
      global: { plugins: [createPinia()] },
    });

    expect(typeof wrapper.vm.filtrosEngrase.cargarDatosGeneralesEquipo).toBe(
      "function",
    );
    expect(typeof wrapper.vm.filtrosEngrase.cargarFiltrosEquipo).toBe(
      "function",
    );
    expect(typeof wrapper.vm.filtrosEngrase.cargarAceitesEquipo).toBe(
      "function",
    );
    wrapper.unmount();
  });
});
