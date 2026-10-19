import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FiltrosEngraseToolbar from "./FiltrosEngraseToolbar.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { initialFiltrosEngraseQuery } from "@/stores/dbequipos/engrase/filtrosEngrase.helpers";

function mountToolbar(features: string[] = []) {
  const pinia = createPinia();
  const featureAccessStore = useFeatureAccessStore(pinia);
  featureAccessStore.$patch({
    funcionalidadesPermitidas: features,
    isLoaded: true,
  });

  return mount(FiltrosEngraseToolbar, {
    props: {
      filters: initialFiltrosEngraseQuery(),
      etapas: [],
      sugerenciasCodigo: [],
      loading: false,
      loadingSugerencias: false,
      resetSignal: 0,
    },
    global: {
      plugins: [pinia],
    },
  });
}

describe("FiltrosEngraseToolbar", () => {
  it("oculta la búsqueda por código cuando falta equipo_filtros", () => {
    const wrapper = mountToolbar();

    expect(wrapper.find("#codigo-filtro").exists()).toBe(false);
    wrapper.unmount();
  });

  it("muestra la búsqueda por código con equipo_filtros", () => {
    const wrapper = mountToolbar(["equipo_filtros"]);

    expect(wrapper.find("#codigo-filtro").exists()).toBe(true);
    wrapper.unmount();
  });
});
