import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSolicitudesCompraStore } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.store';

import { useSolicitudesCompraList } from './useSolicitudesCompraList';

const flushTimers = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('useSolicitudesCompraList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  it('aplica debounce antes de actualizar la busqueda en el store', async () => {
    const store = useSolicitudesCompraStore();
    const actualizarFiltroSpy = vi
      .spyOn(store, 'actualizarFiltro')
      .mockResolvedValue();

    let composable!: ReturnType<typeof useSolicitudesCompraList>;

    mount(defineComponent({
      setup() {
        composable = useSolicitudesCompraList();
        return () => null;
      },
    }));

    composable.onSearchChange('motor');
    composable.onSearchChange('motor hidraulico');

    vi.advanceTimersByTime(349);
    await flushTimers();

    expect(actualizarFiltroSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await flushTimers();

    expect(actualizarFiltroSpy).toHaveBeenCalledTimes(1);
    expect(actualizarFiltroSpy).toHaveBeenCalledWith({
      busqueda: 'motor hidraulico',
    });
  });

  it('aplica debounce al cambio combinado cuando incluye busqueda', async () => {
    const store = useSolicitudesCompraStore();
    const actualizarFiltroSpy = vi
      .spyOn(store, 'actualizarFiltro')
      .mockResolvedValue();

    let composable!: ReturnType<typeof useSolicitudesCompraList>;

    mount(defineComponent({
      setup() {
        composable = useSolicitudesCompraList();
        return () => null;
      },
    }));

    void composable.onFilterChange({
      busqueda: 'urgente',
      soloBloqueadas: true,
    });

    vi.advanceTimersByTime(349);
    await flushTimers();

    expect(actualizarFiltroSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await flushTimers();

    expect(actualizarFiltroSpy).toHaveBeenCalledTimes(1);
    expect(actualizarFiltroSpy).toHaveBeenCalledWith({
      busqueda: 'urgente',
      soloBloqueadas: true,
    });
  });

  it('delegates loadMore solo cuando el listado permite cargar mas', async () => {
    const store = useSolicitudesCompraStore();
    const cargarMasSpy = vi.spyOn(store, 'cargarMas').mockResolvedValue();

    let composable!: ReturnType<typeof useSolicitudesCompraList>;

    mount(defineComponent({
      setup() {
        composable = useSolicitudesCompraList();
        return () => null;
      },
    }));

    await composable.loadMore();

    expect(cargarMasSpy).not.toHaveBeenCalled();

    store.pagination.hasMore = true;

    await composable.loadMore();

    expect(cargarMasSpy).toHaveBeenCalledTimes(1);
  });
});
