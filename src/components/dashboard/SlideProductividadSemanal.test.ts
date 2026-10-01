import { createPinia, setActivePinia } from "pinia";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import SlideProductividadSemanal from "./SlideProductividadSemanal.vue";
import { useHorasTrabajoStore } from "@/stores/horasTrabajoStore";
import { useMaintenanceStore } from "@/stores/maintenanceStore";
import { useHorasPerdidasAreaMotivoStore } from "@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.store";

describe("SlideProductividadSemanal", () => {
  it("permite reintentar después de un error y muestra los datos cargados", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const maintenance = useMaintenanceStore();
    const horas = useHorasTrabajoStore();
    const perdidas = useHorasPerdidasAreaMotivoStore();
    maintenance.hasLoaded = true;
    perdidas.isLoaded = true;

    vi.spyOn(maintenance, "fetchAllOrders").mockResolvedValue();
    vi.spyOn(horas, "fetchData").mockResolvedValue();
    vi.spyOn(perdidas, "cargarResumen").mockResolvedValue({
      por_area: [],
      por_motivo: [],
      fecha_desde: "2026-04-06",
      motivos_por_area: [],
      horas_por_jornada: 8,
      personal_activo_actual_total: 0,
    });

    const response = { success: true, semana: "40", areas: [] };
    let attempt = 0;
    const fetchProductividad = vi
      .spyOn(horas, "fetchProductividadSemanalPorEquipo")
      .mockImplementation(async () => {
        attempt += 1;
        if (attempt === 1) {
          horas.productividadSemanalError = "Fallo de prueba";
          throw new Error("Fallo de prueba");
        }

        horas.productividadSemanalError = null;
        horas.productividadSemanal = response;
        return response;
      });

    const wrapper = shallowMount(SlideProductividadSemanal, {
      props: { isActive: true, loadImmediately: true },
      global: { plugins: [pinia] },
    });

    await flushPromises();
    expect(wrapper.text()).toContain("Fallo de prueba");

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(fetchProductividad).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).not.toContain("Fallo de prueba");
    expect(wrapper.find("button").exists()).toBe(false);

    wrapper.unmount();
  });
});
