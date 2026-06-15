import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  SolicitudCompraListItem,
  SolicitudCompraListRpcRow,
} from './solicitudesCompra.types';

vi.mock('./solicitudesCompra.service', () => ({
  solicitudesCompraService: {
    obtenerSolicitudesListaPagina: vi.fn(),
    buscarSolicitudesLista: vi.fn(),
  },
}));

vi.mock('./solicitudesCompra.mappers', () => ({
  mapSolicitudCompraListRowsToItems: vi.fn(),
}));

import { solicitudesCompraService } from './solicitudesCompra.service';
import { mapSolicitudCompraListRowsToItems } from './solicitudesCompra.mappers';
import { useSolicitudesCompraStore } from './solicitudesCompra.store';

const currentDir = dirname(fileURLToPath(import.meta.url));
const storeSource = readFileSync(
  resolve(currentDir, 'solicitudesCompra.store.ts'),
  'utf8'
);

const mockedService = vi.mocked(solicitudesCompraService);
const mockedMapper = vi.mocked(mapSolicitudCompraListRowsToItems);

const createRows = (
  count: number,
  startId: number,
  totalCount: number
): SolicitudCompraListRpcRow[] =>
  Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    viewer_email: 'viewer@cadasa.test',
    viewer_role_codigo: 'operativo',
    viewer_area_codigo: 'cosecha_agricola',
    folio_sol: `SOL-${startId + index}`,
    folio_oc_principal: null,
    folios_oc: [],
    observacion: `Observacion ${startId + index}`,
    estado_codigo: 'borrador',
    estado_nombre: 'Borrador',
    badge_codigo: 'borrador',
    badge_label: 'Borrador',
    prioridad_codigo: 'alta',
    prioridad_nombre: 'Alta',
    area_solicitante_codigo: 'cosecha_agricola',
    area_solicitante_nombre: 'Cosecha Agricola',
    solicitante_nombre: 'Usuario Test',
    fecha_entrega_mostrada: '2026-06-15',
    fecha_entrega_origen: 'solicitud',
    grupo_listado: 'en_proceso',
    disponible_desde: null,
    bloqueada: false,
    locked_by_email: null,
    locked_at: null,
    cantidad_adjuntos: 0,
    tiene_adjuntos: false,
    cantidad_oc: 0,
    ordenes_compra_resumen: null,
    estado_oc_principal: null,
    evaluacion_principal: null,
    recepcion_principal: null,
    proveedor_principal: null,
    cantidad_diferencias: 0,
    tiene_diferencia_oc: false,
    productos_total: 1,
    productos_activos: 1,
    servicios_total: 0,
    total_count: totalCount,
  }));

const createItemsFromRows = (
  rows: SolicitudCompraListRpcRow[]
): SolicitudCompraListItem[] =>
  rows.map((row) => ({
    id: row.id,
    viewerRoleCodigo: 'operativo',
    viewerAreaCodigo: row.viewer_area_codigo,
    folio: {
      folioSol: row.folio_sol,
      folioSolLabel: row.folio_sol,
      folioOcPrincipal: row.folio_oc_principal,
      foliosOc: [],
    },
    observacion: row.observacion,
    estado: {
      codigo: row.estado_codigo ?? 'borrador',
      nombre: row.estado_nombre ?? 'Borrador',
      badgeCodigo: row.badge_codigo ?? 'borrador',
      badgeLabel: row.badge_label ?? 'Borrador',
    },
    prioridad: {
      codigo: row.prioridad_codigo ?? 'alta',
      nombre: row.prioridad_nombre ?? 'Alta',
    },
    equipos: {
      loading: false,
      codigos: [],
      visibles: [],
      ocultos: 0,
      error: null,
      source: 'mock',
    },
    area: {
      codigo: row.area_solicitante_codigo,
      nombre: row.area_solicitante_nombre,
    },
    solicitante: {
      nombre: row.solicitante_nombre,
    },
    fechaEntrega: {
      fecha: row.fecha_entrega_mostrada,
      origen: row.fecha_entrega_origen,
    },
    indicadores: {
      bloqueado: {
        visible: false,
        lockedByEmail: null,
        lockedAt: null,
      },
      adjuntos: {
        visible: false,
        cantidad: 0,
      },
      diferenciaOc: {
        visible: false,
        cantidad: 0,
      },
    },
    grupoListado: 'en_proceso',
    disponibleDesde: row.disponible_desde,
    conteos: {
      productosTotal: row.productos_total,
      productosActivos: row.productos_activos,
      serviciosTotal: row.servicios_total,
      cantidadOc: row.cantidad_oc,
    },
    ocResumen: {
      estadoOcPrincipal: row.estado_oc_principal,
      evaluacionPrincipal: row.evaluacion_principal,
      recepcionPrincipal: row.recepcion_principal,
      proveedorPrincipal: row.proveedor_principal,
      ordenesCompraResumen: row.ordenes_compra_resumen,
    },
  }));

describe('solicitudesCompra.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    mockedMapper.mockImplementation((rows) => createItemsFromRows(rows));
  });

  it('cargarInicial limpia estado y trae 25 items usando service y mapper', async () => {
    const rows = createRows(25, 1, 60);
    mockedService.obtenerSolicitudesListaPagina.mockResolvedValue(rows);

    const store = useSolicitudesCompraStore();
    store.error = 'error previo';
    store.allSearchItems = createItemsFromRows(createRows(2, 900, 2));

    await store.cargarInicial();

    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenCalledTimes(1);
    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenCalledWith(
      expect.objectContaining({
        p_busqueda: null,
        p_offset: 0,
        p_limit: 25,
        p_grupo_listado: 'en_proceso',
      })
    );
    expect(mockedMapper).toHaveBeenCalledTimes(1);
    expect(mockedMapper).toHaveBeenCalledWith(rows);
    expect(store.error).toBeNull();
    expect(store.items).toHaveLength(25);
    expect(store.rawRows).toEqual(rows);
    expect(store.allSearchItems).toEqual([]);
    expect(store.pagination.remoteOffset).toBe(0);
    expect(store.pagination.totalCount).toBe(60);
    expect(store.pagination.hasMore).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.initialized).toBe(true);
  });

  it('cargarMas trae otros 25 y aumenta el offset correctamente', async () => {
    const firstPage = createRows(25, 1, 60);
    const secondPage = createRows(25, 26, 60);
    mockedService.obtenerSolicitudesListaPagina
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const store = useSolicitudesCompraStore();

    await store.cargarInicial();
    await store.cargarMas();

    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        p_offset: 25,
        p_limit: 25,
      })
    );
    expect(mockedMapper).toHaveBeenNthCalledWith(2, secondPage);
    expect(store.items).toHaveLength(50);
    expect(store.rawRows).toHaveLength(50);
    expect(store.pagination.remoteOffset).toBe(25);
    expect(store.pagination.totalCount).toBe(60);
    expect(store.pagination.hasMore).toBe(true);
    expect(store.loadingMore).toBe(false);
  });

  it('calcula hasMore usando total_count del RPC', async () => {
    const rows = createRows(25, 1, 25);
    mockedService.obtenerSolicitudesListaPagina.mockResolvedValue(rows);

    const store = useSolicitudesCompraStore();

    await store.cargarInicial();

    expect(store.pagination.totalCount).toBe(25);
    expect(store.pagination.hasMore).toBe(false);
  });

  it('buscar usa el service de busqueda y muestra bloques locales de 25 sin cargar remoto adicional', async () => {
    const searchRows = createRows(60, 1, 60);
    mockedService.buscarSolicitudesLista.mockResolvedValue(searchRows);

    const store = useSolicitudesCompraStore();
    store.filters.busqueda = '  motor   hidraulico  ';

    await store.buscar();

    expect(mockedService.buscarSolicitudesLista).toHaveBeenCalledTimes(1);
    expect(mockedService.buscarSolicitudesLista).toHaveBeenCalledWith(
      expect.objectContaining({
        p_busqueda: 'motor hidraulico',
        p_offset: 0,
        p_limit: 25,
      })
    );
    expect(mockedService.obtenerSolicitudesListaPagina).not.toHaveBeenCalled();
    expect(mockedMapper).toHaveBeenCalledWith(searchRows);
    expect(store.allSearchItems).toHaveLength(60);
    expect(store.items).toHaveLength(25);
    expect(store.pagination.localVisibleCount).toBe(25);
    expect(store.pagination.hasMore).toBe(true);

    await store.cargarMas();

    expect(mockedService.buscarSolicitudesLista).toHaveBeenCalledTimes(1);
    expect(mockedService.obtenerSolicitudesListaPagina).not.toHaveBeenCalled();
    expect(store.items).toHaveLength(50);
    expect(store.pagination.localVisibleCount).toBe(50);
    expect(store.pagination.hasMore).toBe(true);

    await store.cargarMas();

    expect(store.items).toHaveLength(60);
    expect(store.pagination.localVisibleCount).toBe(75);
    expect(store.pagination.hasMore).toBe(false);
  });

  it('mantiene el store libre de RPC directos, templates y clases Tailwind', () => {
    expect(storeSource).toContain("from './solicitudesCompra.service'");
    expect(storeSource).toContain("from './solicitudesCompra.mappers'");
    expect(storeSource).not.toContain('.rpc(');
    expect(storeSource).not.toContain('<template');
    expect(storeSource).not.toContain('class=');
    expect(storeSource).not.toContain('bg-');
    expect(storeSource).not.toContain('text-');
  });
});
