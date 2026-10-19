import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FiltrosEquipoPanel from "./FiltrosEquipoPanel.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import type { EquipoEngraseListItem } from "@/stores/dbequipos/engrase/filtrosEngrase.types";

const equipo: EquipoEngraseListItem = {
  id: 123,
  codigo: "422017",
  tipo_equipo_id: 5,
  tipo_equipo: "Combinadas",
  subtipo: "Cosechadora",
  estado: "activo",
  main_storage_path: "equipos/422017/main.webp",
  tiene_imagen_main: true,
  imagen_actualizada_en: "2026-10-19T00:00:00.000Z",
  etapas: [],
  imageUrl: "https://example.com/equipos/422017/main.webp",
};

function mountPanel(features: string[] = []) {
  const pinia = createPinia();
  const featureAccessStore = useFeatureAccessStore(pinia);
  featureAccessStore.$patch({
    funcionalidadesPermitidas: features,
    isLoaded: true,
  });

  return mount(FiltrosEquipoPanel, {
    props: {
      equipo,
      filtros: [],
      aceites: [],
      datosGenerales: null,
      equivalencias: {},
      codigoBuscado: null,
      selectedFiltroId: null,
      loading: false,
      loadingAceites: false,
      loadingDatosGenerales: false,
      error: null,
      errorAceites: null,
      errorDatosGenerales: null,
      loadingCambioEstado: false,
      errorCambioEstado: null,
    },
    global: {
      plugins: [pinia],
      stubs: {
        FiltrosEquipoAceitesPanel: true,
        FiltrosEquipoDatosGeneralesPanel: true,
        EquipoEstadoConfirmDialog: true,
        ImageZoomViewer: true,
      },
    },
  });
}

describe("FiltrosEquipoPanel", () => {
  it("abre el visor al pulsar la imagen del equipo", async () => {
    const wrapper = mountPanel();

    await wrapper
      .get('button[aria-label="Ampliar imagen del equipo 422017"]')
      .trigger("click");

    expect(wrapper.find("image-zoom-viewer-stub").exists()).toBe(true);
    wrapper.unmount();
  });

  it("muestra únicamente las pestañas para las que el usuario tiene permiso", () => {
    const wrapper = mountPanel(["equipo_filtros"]);

    expect(wrapper.find("#tab-datos-generales-equipo").exists()).toBe(false);
    expect(wrapper.find("#tab-filtros-equipo").exists()).toBe(true);
    expect(wrapper.find("#tab-aceites-equipo").exists()).toBe(false);
    expect(wrapper.emitted("tabVisible")).toEqual([["filtros"]]);
    wrapper.unmount();
  });
});
