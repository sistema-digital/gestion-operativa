import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const obtenerFiltrosDeEquipo = vi.hoisted(() => vi.fn());
const obtenerAceitesDeEquipo = vi.hoisted(() => vi.fn());
const obtenerEquivalenciasActivas = vi.hoisted(() => vi.fn());
const crearUrlFirmadaImagen = vi.hoisted(() => vi.fn());
const cambiarEstadoEquipo = vi.hoisted(() => vi.fn());
const obtenerDatosGeneralesEquipo = vi.hoisted(() => vi.fn());

vi.mock("./filtrosEngrase.service", () => ({
  filtrosEngraseService: {
    obtenerFiltrosDeEquipo,
    obtenerAceitesDeEquipo,
    obtenerEquivalenciasActivas,
    crearUrlFirmadaImagen,
    cambiarEstadoEquipo,
    obtenerDatosGeneralesEquipo,
  },
}));

import { useFiltrosEngraseStore } from "./filtrosEngrase.store";
import type { EquipoEngraseListItem } from "./filtrosEngrase.types";

const equipo = (id: number, codigo: string): EquipoEngraseListItem => ({
  id,
  codigo,
  tipo_equipo_id: 5,
  tipo_equipo: "Combinadas",
  subtipo: "Cosechadora",
  estado: "activo",
  main_storage_path: null,
  tiene_imagen_main: false,
  imagen_actualizada_en: null,
  etapas: [],
});

describe("detalle de filtros y aceites del equipo", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    obtenerFiltrosDeEquipo.mockResolvedValue([]);
    obtenerAceitesDeEquipo.mockResolvedValue([
      { sistema: "Motor", subsistema: null, ruta: "Motor", aceite: "15W-40" },
    ]);
    obtenerEquivalenciasActivas.mockResolvedValue([]);
    obtenerDatosGeneralesEquipo.mockResolvedValue({
      numero_equipo: "422017",
      tipo: "Combinadas",
      marca: "Marca",
      modelo: "Cosechadora",
      tenencia: "PROPIA",
      combustible: "DIÉSEL",
      fecha_llegada: "21/05/2026",
      potencia_cv: 203.94,
      consumo_base_gal_h: 5.39,
      etapas: [],
    });
  });

  it("carga cada recurso solamente al solicitar su pestaña y conserva cache", async () => {
    const store = useFiltrosEngraseStore();
    store.equipos = [equipo(123, "422017")];

    store.seleccionarEquipo(123);

    expect(obtenerFiltrosDeEquipo).not.toHaveBeenCalled();
    expect(obtenerAceitesDeEquipo).not.toHaveBeenCalled();
    expect(obtenerDatosGeneralesEquipo).not.toHaveBeenCalled();

    await store.cargarFiltrosEquipo(123);

    expect(obtenerFiltrosDeEquipo).toHaveBeenCalledWith(123);
    expect(obtenerAceitesDeEquipo).not.toHaveBeenCalled();
    expect(obtenerDatosGeneralesEquipo).not.toHaveBeenCalled();

    await store.cargarAceitesEquipo(123);

    expect(store.aceitesEquipo).toEqual([
      { sistema: "Motor", subsistema: null, ruta: "Motor", aceite: "15W-40" },
    ]);
    expect(obtenerAceitesDeEquipo).toHaveBeenCalledWith(123);

    await store.cargarDatosGeneralesEquipo(123, "422017");

    expect(obtenerDatosGeneralesEquipo).toHaveBeenCalledWith("422017");
    await store.cargarFiltrosEquipo(123);
    await store.cargarAceitesEquipo(123);
    await store.cargarDatosGeneralesEquipo(123, "422017");
    expect(obtenerFiltrosDeEquipo).toHaveBeenCalledOnce();
    expect(obtenerAceitesDeEquipo).toHaveBeenCalledOnce();
    expect(obtenerDatosGeneralesEquipo).toHaveBeenCalledOnce();
  });

  it("confirma el estado por RPC y actualiza el store sin recargar equipos", async () => {
    cambiarEstadoEquipo.mockResolvedValue("descartado");
    const store = useFiltrosEngraseStore();
    store.equipos = [equipo(123, "422017"), equipo(124, "422018")];
    store.equipoSeleccionadoId = 123;

    await store.cambiarEstadoEquipo("422017", "descartado");

    expect(cambiarEstadoEquipo).toHaveBeenCalledWith("422017", "descartado");
    expect(store.equipos[0]?.estado).toBe("descartado");
    expect(store.equipoSeleccionadoId).toBe(123);
    expect(store.equiposVisibles.map((item) => item.id)).toEqual([124]);
  });
});
