import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { NodoEstructuraBorrador } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EstructuraLubricacionDeleteDialog from "./EstructuraLubricacionDeleteDialog.vue";

const subarbol: NodoEstructuraBorrador[] = [
  {
    localId: "raiz",
    estadoLocal: "nuevo" as const,
    id: null,
    tempId: "estructura_1",
    parentId: null,
    parentTempId: null,
    sistemaId: 1,
    subsistemaId: null,
    aceiteId: null,
    sistema: { id: 1, nombre: "Hidráulico", activo: true },
    subsistema: null,
    aceite: null,
  },
  {
    localId: "hijo",
    estadoLocal: "nuevo" as const,
    id: null,
    tempId: "estructura_2",
    parentId: null,
    parentTempId: "estructura_1",
    sistemaId: null,
    subsistemaId: 2,
    aceiteId: 3,
    sistema: null,
    subsistema: { id: 2, nombre: "Bomba", activo: true },
    aceite: { id: 3, nombre: "AW100", activo: true },
  },
];

describe("EstructuraLubricacionDeleteDialog", () => {
  it("explica el alcance antes de confirmar la eliminación", () => {
    const wrapper = mount(EstructuraLubricacionDeleteDialog, {
      props: { subarbol },
      global: { stubs: { teleport: true } },
    });

    expect(wrapper.text()).toContain("2 nodos");
    expect(wrapper.text()).toContain("1 asignaciones de aceite");
    expect(wrapper.text()).toContain("Hidráulico > Bomba");
  });
});
