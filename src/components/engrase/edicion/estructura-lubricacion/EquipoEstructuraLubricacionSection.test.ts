import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { NodoEstructuraBorrador } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EquipoEstructuraLubricacionSection from "./EquipoEstructuraLubricacionSection.vue";

const system = { id: 1, nombre: "Hidráulico", activo: true };
const subsystem = { id: 2, nombre: "Bomba", activo: true };
const nodes: NodoEstructuraBorrador[] = [
  {
    localId: "root",
    estadoLocal: "existente",
    id: 1,
    tempId: null,
    parentId: null,
    parentTempId: null,
    sistemaId: 1,
    subsistemaId: null,
    aceiteId: null,
    sistema: system,
    subsistema: null,
    aceite: null,
  },
  {
    localId: "child",
    estadoLocal: "existente",
    id: 2,
    tempId: null,
    parentId: 1,
    parentTempId: null,
    sistemaId: null,
    subsistemaId: 2,
    aceiteId: 3,
    sistema: null,
    subsistema: subsystem,
    aceite: { id: 3, nombre: "AW100", activo: true },
  },
  {
    localId: "grandchild",
    estadoLocal: "existente",
    id: 3,
    tempId: null,
    parentId: 2,
    parentTempId: null,
    sistemaId: null,
    subsistemaId: 2,
    aceiteId: null,
    sistema: null,
    subsistema: subsystem,
    aceite: null,
  },
];

describe("EquipoEstructuraLubricacionSection", () => {
  it("cuenta todos los nodos activos aunque el árbol esté contraído", () => {
    const wrapper = mount(EquipoEstructuraLubricacionSection, {
      props: {
        nodos: nodes,
        sistemas: [system],
        subsistemas: [subsystem],
        aceites: [],
        errors: [],
        disabled: false,
      },
      global: {
        stubs: {
          EstructuraLubricacionNodeDrawer: true,
          EstructuraLubricacionDeleteDialog: true,
        },
      },
    });
    expect(wrapper.text()).toContain("3 nodos · 1 con aceite");
    expect(wrapper.findAll("li")).toHaveLength(1);
  });

  it("muestra el error junto al nodo que lo originó", async () => {
    const wrapper = mount(EquipoEstructuraLubricacionSection, {
      props: {
        nodos: nodes,
        sistemas: [system],
        subsistemas: [subsystem],
        aceites: [],
        errors: [
          {
            codigo: "ACEITE_INVALIDO",
            mensaje: "Aceite inválido",
            localId: "child",
          },
        ],
        disabled: false,
      },
      global: {
        stubs: {
          EstructuraLubricacionNodeDrawer: true,
          EstructuraLubricacionDeleteDialog: true,
        },
      },
    });
    expect(wrapper.text()).not.toContain("Aceite inválido");
    await wrapper
      .get('button[aria-label="Expandir Hidráulico"]')
      .trigger("click");
    expect(wrapper.text()).toContain("Aceite inválido");
  });
});
