import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoCreacionRevisionStep from "./EquipoCreacionRevisionStep.vue";
import type { CrearEquipoDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

const draft: CrearEquipoDraft = {
  datos: {
    codigo: "23434",
    tipoEquipo: {
      estado: "existente",
      id: 7,
      tempId: null,
      nombre: "Camecos",
      subtiposSugeridos: [],
    },
    subtipo: "BUS",
    etapas: [{ id: 3, nombre: "ZAFRA" }],
    estado: "activo",
  },
  filtros: [
    {
      draftId: "filter-1",
      tipoFiltro: {
        estado: "existente",
        id: 5,
        tempId: null,
        nombre: "Filtro de aceite 1",
      },
      filtro: {
        estado: "existente",
        id: 10,
        tempId: null,
        codigo: "LFP805",
        estaEnListaCompras: true,
      },
      cantidad: 1,
    },
  ],
  estructuraSistemas: [
    {
      localId: "estructura-1",
      estadoLocal: "nuevo",
      id: null,
      tempId: "estructura-1",
      parentId: null,
      parentTempId: null,
      sistemaId: 4,
      subsistemaId: null,
      aceiteId: 6,
      sistema: { id: 4, nombre: "Motor", activo: true },
      subsistema: null,
      aceite: { id: 6, nombre: "15W40", activo: true },
    },
  ],
  validacionCodigo: { estado: "valido", codigo: "23434" },
  equipoCreado: null,
};

describe("EquipoCreacionRevisionStep", () => {
  it("muestra toda la configuración del borrador antes de crear", () => {
    const wrapper = mount(EquipoCreacionRevisionStep, {
      props: { draft, errors: [], creating: false },
    });

    expect(wrapper.text()).toContain("Filtro de aceite 1");
    expect(wrapper.text()).toContain("LFP805");
    expect(wrapper.text()).toContain("En lista de compras");
    expect(wrapper.text()).toContain("Motor");
    expect(wrapper.text()).toContain("15W40");
  });

  it("presenta estructura vacía como opcional y permite volver a cada sección", async () => {
    const wrapper = mount(EquipoCreacionRevisionStep, {
      props: {
        draft: { ...draft, estructuraSistemas: [] },
        errors: [],
        creating: false,
      },
    });

    expect(wrapper.text()).toContain(
      "Sin estructura de lubricación — esta sección es opcional.",
    );
    const buttons = wrapper.findAll("button");
    await buttons[0].trigger("click");
    await buttons[1].trigger("click");
    await buttons[2].trigger("click");

    expect(wrapper.emitted("edit")?.map(([step]) => step)).toEqual([1, 2, 3]);
  });
});
