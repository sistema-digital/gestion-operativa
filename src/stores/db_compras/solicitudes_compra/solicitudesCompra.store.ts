import { defineStore } from 'pinia';

import {
  isEstadoAllowedForGrupo,
} from '@/components/compras/list/solicitudesListOptions';

import { solicitudesCompraService } from './solicitudesCompra.service';
import {
  canShowMoreLocal,
  getDefaultDateRange,
  getInitialPagination,
  matchesSolicitudBusqueda,
  normalizarBusqueda,
} from './solicitudesCompra.helpers';
import { mapSolicitudCompraListRowsToItems } from './solicitudesCompra.mappers';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListFilters,
  SolicitudCompraListItem,
  SolicitudCompraListRpcParams,
  SolicitudCompraListRpcRow,
  SolicitudCompraListState,
} from './solicitudesCompra.types';

const REMOTE_PAGE_SIZE = 200;

const createInitialFilters = (): SolicitudCompraListFilters => ({
  busqueda: '',
  grupoListado: 'en_proceso',
  estadoCodigo: null,
  prioridadCodigo: null,
  ...getDefaultDateRange(),
  soloBloqueadas: false,
  soloDiferenciaOc: false,
});

const createInitialState = (): SolicitudCompraListState => ({
  baseRows: [],
  baseItems: [],
  items: [],
  loading: false,
  loadingMore: false,
  searching: false,
  error: null,
  filters: createInitialFilters(),
  pagination: getInitialPagination(),
  baseEmpty: false,
  lastRequestKey: null,
  initialized: false,
});

const createBaseRpcParams = (
  filters: SolicitudCompraListFilters,
  offset: number
): SolicitudCompraListRpcParams => ({
  p_busqueda: null,
  p_grupo_listado: null,
  p_estado_codigo: null,
  p_prioridad_codigo: null,
  p_fecha_desde: filters.fechaDesde,
  p_fecha_hasta: filters.fechaHasta,
  p_solo_bloqueadas: false,
  p_solo_diferencia_oc: false,
  p_limit: REMOTE_PAGE_SIZE,
  p_offset: offset,
});

const createRequestKey = (
  scope: string,
  filters: SolicitudCompraListFilters
): string =>
  JSON.stringify({
    scope,
    fechaDesde: filters.fechaDesde,
    fechaHasta: filters.fechaHasta,
  });

const filterVisibleItems = (
  items: SolicitudCompraListItem[],
  filters: SolicitudCompraListFilters
): SolicitudCompraListItem[] => items.filter((item) => {
  if (item.grupoListado !== filters.grupoListado) {
    return false;
  }

  if (filters.estadoCodigo && item.estado.codigo !== filters.estadoCodigo) {
    return false;
  }

  if (filters.prioridadCodigo && item.prioridad.codigo !== filters.prioridadCodigo) {
    return false;
  }

  if (filters.soloBloqueadas && !item.indicadores.bloqueado.visible) {
    return false;
  }

  if (filters.soloDiferenciaOc && !item.indicadores.diferenciaOc.visible) {
    return false;
  }

  return matchesSolicitudBusqueda(item, filters.busqueda);
});

const getSafeTotalCount = (
  rows: SolicitudCompraListRpcRow[],
  fallback = 0
): number => {
  const totalCount = rows[0]?.total_count;
  return typeof totalCount === 'number' && Number.isFinite(totalCount)
    ? Math.max(totalCount, 0)
    : fallback;
};

export const useSolicitudesCompraStore = defineStore('solicitudesCompraList', {
  state: (): SolicitudCompraListState => createInitialState(),

  actions: {
    applyVisibleItems(): void {
      const filteredItems = filterVisibleItems(this.baseItems, this.filters);
      const nextVisibleCount = Math.max(
        this.pagination.pageSize,
        Math.min(this.pagination.localVisibleCount, filteredItems.length || this.pagination.pageSize)
      );

      this.items = filteredItems.slice(0, nextVisibleCount);
      this.pagination = {
        ...this.pagination,
        localVisibleCount: nextVisibleCount,
        totalCount: filteredItems.length,
        hasMore: canShowMoreLocal(filteredItems.length, nextVisibleCount),
      };
    },

    resetVisibleItems(): void {
      this.pagination = getInitialPagination();
      this.applyVisibleItems();
    },

    async cargarInicial(): Promise<void> {
      const requestKey = createRequestKey('cargarInicial', this.filters);

      this.loading = true;
      this.loadingMore = false;
      this.searching = false;
      this.error = null;
      this.lastRequestKey = requestKey;

      try {
        let allRows: SolicitudCompraListRpcRow[] = [];
        let offset = 0;
        let totalCount = 0;

        while (true) {
          const rows = await solicitudesCompraService.obtenerSolicitudesListaPagina(
            createBaseRpcParams(this.filters, offset)
          );

          if (this.lastRequestKey !== requestKey) {
            return;
          }

          totalCount = getSafeTotalCount(rows, totalCount);
          allRows = [...allRows, ...rows];

          if (rows.length < REMOTE_PAGE_SIZE || allRows.length >= totalCount) {
            break;
          }

          offset += REMOTE_PAGE_SIZE;
        }

        const baseItems = mapSolicitudCompraListRowsToItems(allRows);

        this.baseRows = allRows;
        this.baseItems = baseItems;
        this.baseEmpty = baseItems.length === 0;
        this.pagination = getInitialPagination();
        this.resetVisibleItems();
      } catch (error) {
        if (this.lastRequestKey !== requestKey) {
          return;
        }

        const message = error instanceof Error
          ? error.message
          : 'No se pudieron obtener las solicitudes';

        this.error = message;
        throw error;
      } finally {
        if (this.lastRequestKey === requestKey) {
          this.loading = false;
          this.initialized = true;
        }
      }
    },

    async cargarMas(): Promise<void> {
      if (this.loadingMore || !this.pagination.hasMore) {
        return;
      }

      this.loadingMore = true;

      try {
        const nextVisibleCount =
          this.pagination.localVisibleCount + this.pagination.pageSize;
        const filteredItems = filterVisibleItems(this.baseItems, this.filters);

        this.items = filteredItems.slice(0, nextVisibleCount);
        this.pagination = {
          ...this.pagination,
          localVisibleCount: nextVisibleCount,
          totalCount: filteredItems.length,
          hasMore: canShowMoreLocal(filteredItems.length, nextVisibleCount),
        };
      } finally {
        this.loadingMore = false;
      }
    },

    async actualizarFiltro(
      partialFilters: Partial<SolicitudCompraListFilters>
    ): Promise<void> {
      const normalizedBusqueda = partialFilters.busqueda !== undefined
        ? normalizarBusqueda(partialFilters.busqueda)
        : this.filters.busqueda;
      const nextFilters = {
        ...this.filters,
        ...partialFilters,
        busqueda: normalizedBusqueda,
      };
      const shouldReloadBase =
        partialFilters.fechaDesde !== undefined
        || partialFilters.fechaHasta !== undefined;

      if (!isEstadoAllowedForGrupo(nextFilters.grupoListado, nextFilters.estadoCodigo)) {
        nextFilters.estadoCodigo = null;
      }

      this.filters = nextFilters;

      if (shouldReloadBase) {
        await this.cargarInicial();
        return;
      }

      this.resetVisibleItems();
    },

    async limpiarFiltros(): Promise<void> {
      this.filters = {
        ...createInitialFilters(),
        fechaDesde: this.filters.fechaDesde,
        fechaHasta: this.filters.fechaHasta,
      };
      this.resetVisibleItems();
    },

    async cambiarGrupoListado(
      grupo: SolicitudCompraGrupoListado
    ): Promise<void> {
      this.filters = {
        ...this.filters,
        grupoListado: grupo,
        estadoCodigo: isEstadoAllowedForGrupo(grupo, this.filters.estadoCodigo)
          ? this.filters.estadoCodigo
          : null,
      };
      this.resetVisibleItems();
    },

    async refrescar(): Promise<void> {
      await this.cargarInicial();
    },

    prepararAbrirDetalle(itemId: string | number): void {
      void itemId;
      // TODO: conectar con la futura ruta de detalle cuando exista.
    },

    prepararCrearSolicitud(): void {
      // TODO: conectar con el futuro flujo de creación cuando exista.
    },
  },
});
