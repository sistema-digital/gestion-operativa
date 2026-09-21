import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { registroJornadaService } from "@/components/seguimiento/registro-jornada/services/registroJornada.service";
import { useRegistroJornadaCatalogosStore } from "./registroJornadaCatalogos.store";

vi.mock(
  "@/components/seguimiento/registro-jornada/services/registroJornada.service",
  () => ({
    registroJornadaService: {
      listarImplementos: vi.fn(),
      listarLabores: vi.fn(),
      listarParadas: vi.fn(),
    },
  }),
);

describe("useRegistroJornadaCatalogosStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(registroJornadaService.listarImplementos).mockResolvedValue([
      { id: "implemento-1", numero: "439008", nombre: "Rastra" },
    ]);
    vi.mocked(registroJornadaService.listarLabores).mockResolvedValue([
      { id: "labor-1", orden: 96, nombre: "Traslado", activo: true },
    ]);
    vi.mocked(registroJornadaService.listarParadas).mockResolvedValue([
      { id: "parada-1", orden: 113, nombre: "Espera", activo: true },
    ]);
  });

  it("carga los catálogos una vez y conserva el resultado en memoria", async () => {
    const store = useRegistroJornadaCatalogosStore();

    await Promise.all([store.cargarCatalogos(), store.cargarCatalogos()]);
    await store.cargarCatalogos();

    expect(registroJornadaService.listarImplementos).toHaveBeenCalledOnce();
    expect(registroJornadaService.listarLabores).toHaveBeenCalledOnce();
    expect(registroJornadaService.listarParadas).toHaveBeenCalledOnce();
    expect(store.implementos).toHaveLength(1);
    expect(store.labores).toHaveLength(1);
    expect(store.tiposParada).toHaveLength(1);
  });

  it("agrega o reemplaza un implemento sin recargar el catálogo", async () => {
    const store = useRegistroJornadaCatalogosStore();
    await store.cargarCatalogos();

    store.agregarImplemento({
      id: "implemento-1",
      numero: "439008",
      nombre: "Rastra pesada",
    });

    expect(store.implementos).toEqual([
      { id: "implemento-1", numero: "439008", nombre: "Rastra pesada" },
    ]);
  });
});
