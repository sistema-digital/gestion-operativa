import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquiposEngrasePanel from "./EquiposEngrasePanel.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";

describe("acciones del panel Equipos", () => {
  it("reenvía los atributos del contenedor al panel principal", () => {
    const wrapper = mount(EquiposEngrasePanel, {
      attrs: { class: "h-full" },
      props: {
        equipos: [],
        selectedEquipoId: null,
        filters: {
          estadoEquipo: "activo",
          tipoEquipoId: null,
          tipoFiltroId: null,
          modelo: "",
          etapaIds: [],
          codigoExactoSeleccionado: null,
        },
        countsByTipo: [],
        loading: false,
        error: null,
        resetSignal: 0,
      },
      global: { plugins: [createPinia()] },
    });

    expect(wrapper.get("section").classes()).toContain("h-full");
    wrapper.unmount();
  });

  it("muestra únicamente el botón Plus para agregar equipo", async () => {
    const pinia = createPinia();
    const featureAccess = useFeatureAccessStore(pinia);
    featureAccess.isLoaded = true;
    featureAccess.funcionalidadesPermitidas = ["editar_filtros_engrase"];

    const wrapper = mount(EquiposEngrasePanel, {
      props: {
        equipos: [],
        selectedEquipoId: null,
        filters: {
          estadoEquipo: "activo",
          tipoEquipoId: null,
          tipoFiltroId: null,
          modelo: "",
          etapaIds: [],
          codigoExactoSeleccionado: null,
        },
        countsByTipo: [],
        loading: false,
        error: null,
        resetSignal: 0,
      },
      global: { plugins: [pinia] },
    });

    const addButton = wrapper.get('button[aria-label="Agregar equipo"]');

    expect(addButton.find("svg.lucide-plus").exists()).toBe(true);
    expect(addButton.attributes("aria-haspopup")).toBeUndefined();
    await addButton.trigger("click");
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it("abre el visor al solicitar ampliar la miniatura de un equipo", async () => {
    const wrapper = mount(EquiposEngrasePanel, {
      props: {
        equipos: [
          {
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
          },
        ],
        selectedEquipoId: null,
        filters: {
          estadoEquipo: "activo",
          tipoEquipoId: null,
          tipoFiltroId: null,
          modelo: "",
          etapaIds: [],
          codigoExactoSeleccionado: null,
        },
        countsByTipo: [],
        loading: false,
        error: null,
        resetSignal: 0,
      },
      global: {
        plugins: [createPinia()],
        stubs: { ImageZoomViewer: true },
      },
    });

    await wrapper
      .get('button[aria-label="Ampliar imagen del equipo 422017"]')
      .trigger("click");

    expect(wrapper.find("image-zoom-viewer-stub").exists()).toBe(true);
    wrapper.unmount();
  });
});
