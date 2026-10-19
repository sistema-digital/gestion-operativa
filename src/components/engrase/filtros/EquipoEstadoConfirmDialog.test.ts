import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoEstadoConfirmDialog from "./EquipoEstadoConfirmDialog.vue";

function mountDialog(
  estadoDestino: "activo" | "descartado" = "descartado",
  saving = false,
) {
  return mount(EquipoEstadoConfirmDialog, {
    props: {
      codigoEquipo: "4-58-014",
      estadoDestino,
      saving,
    },
    global: { stubs: { Teleport: true } },
  });
}

describe("EquipoEstadoConfirmDialog", () => {
  it("explica el descarte y emite la confirmación", async () => {
    const wrapper = mountDialog();
    const confirmButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("Confirmar descarte"));

    expect(wrapper.text()).toContain("Equipo 4-58-014");
    expect(wrapper.text()).toContain(
      "dejará de mostrarse entre los equipos activos",
    );
    expect(confirmButton).toBeDefined();

    await confirmButton?.trigger("click");

    expect(wrapper.emitted("confirm")).toHaveLength(1);
    wrapper.unmount();
  });

  it("adapta el contenido para la activación", () => {
    const wrapper = mountDialog("activo");

    expect(wrapper.text()).toContain("Confirmar activación");
    expect(wrapper.text()).toContain("volverá a estar disponible");
    wrapper.unmount();
  });

  it("bloquea las acciones mientras actualiza", () => {
    const wrapper = mountDialog("descartado", true);

    expect(wrapper.text()).toContain("Actualizando…");
    expect(
      wrapper
        .findAll("button")
        .every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
    wrapper.unmount();
  });
});
