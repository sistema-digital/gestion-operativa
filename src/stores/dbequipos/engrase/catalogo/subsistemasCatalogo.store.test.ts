import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { CatalogoSubsistemaItem } from "./subsistemasCatalogo.types";

const listar = vi.hoisted(() => vi.fn());
const guardar = vi.hoisted(() => vi.fn());
vi.mock("./subsistemasCatalogo.service", () => ({
  subsistemasCatalogoService: { listar, guardar },
}));

import { useSubsistemasCatalogoStore } from "./subsistemasCatalogo.store";

const item = (
  id: number,
  nombre: string,
  activo = true,
): CatalogoSubsistemaItem => ({
  id,
  nombre,
  activo,
  creadoEn: null,
  actualizadoEn: null,
  sistemas: [],
  aceites: [],
  impacto: { totalEquipos: id, totalAsignaciones: id, tiposEquipo: [] },
});

describe("store del catálogo de subsistemas", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    listar.mockResolvedValue({
      items: [item(1, "Dirección"), item(2, "Bomba", false)],
      resumen: { total: 2, activos: 1, desactivados: 1 },
    });
  });

  it("deduplica la carga y filtra sin volver a consultar la red", async () => {
    const store = useSubsistemasCatalogoStore();
    await Promise.all([store.inicializar(), store.inicializar()]);
    store.actualizarEstado("todos");
    store.actualizarBusqueda("bomba");
    expect(store.itemsVisibles.map((value) => value.id)).toEqual([2]);
    expect(listar).toHaveBeenCalledOnce();
  });

  it("envía solo id, nombre y activo al guardar", async () => {
    const store = useSubsistemasCatalogoStore();
    await store.inicializar();
    guardar.mockResolvedValue({
      item: item(3, "Reductor"),
      operacion: "creado",
    });
    await store.guardar({ id: null, nombre: "Reductor", activo: true });
    expect(guardar).toHaveBeenCalledWith({
      id: null,
      nombre: "Reductor",
      activo: true,
    });
    expect(store.items).toHaveLength(3);
  });
});
