import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./equipos.service', () => ({
  equiposService: {
    buscarEquipos: vi.fn(),
  },
}));

import { equiposService } from './equipos.service';
import { useEquiposStore } from './equipos.store';

const mockedService = vi.mocked(equiposService);

describe('equipos.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('busca equipos y excluye seleccionados del resultado', async () => {
    mockedService.buscarEquipos.mockResolvedValue([
      {
        id: 1,
        cod_equipo: 'EQ-001',
        modelo: '6155M',
        marca: 'John Deere',
        tipo: 'Tractor',
        activo: true,
      },
      {
        id: 2,
        cod_equipo: 'EQ-002',
        modelo: '7250',
        marca: 'Case IH',
        tipo: 'Cosechadora',
        activo: true,
      },
    ]);

    const store = useEquiposStore();
    store.selectedItems = [
      {
        id: 1,
        codEquipo: 'EQ-001',
        modelo: '6155M',
        marca: 'John Deere',
        tipo: 'Tractor',
        label: 'EQ-001 · Tractor · John Deere · 6155M',
      },
    ];

    await store.buscarEquipos('EQ');

    expect(store.searchResults).toHaveLength(1);
    expect(store.searchResults[0]?.codEquipo).toBe('EQ-002');
  });

  it('agrega y remueve equipos sin duplicarlos', () => {
    const store = useEquiposStore();
    const equipo = {
      id: 1,
      codEquipo: 'EQ-001',
      modelo: '6155M',
      marca: 'John Deere',
      tipo: 'Tractor',
      label: 'EQ-001 · Tractor · John Deere · 6155M',
    };

    store.agregarEquipo(equipo);
    store.agregarEquipo(equipo);
    store.removerEquipo('EQ-001');

    expect(store.selectedItems).toHaveLength(0);
  });
});
