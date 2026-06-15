import { defineStore } from 'pinia';
import { solicitudesCompraService } from './solicitudesCompra.service';
import {
  canLoadMoreRemote,
  canShowMoreLocal,
  getInitialPagination,
  getNextRemoteOffset,
  isSearchMode,
  normalizarBusqueda,
} from './solicitudesCompra.helpers';
import { mapSolicitudCompraListRowsToItems } from './solicitudesCompra.mappers';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListFilters,
  SolicitudCompraListRpcParams,
  SolicitudCompraListRpcRow,
  SolicitudCompraListState,
} from './solicitudesCompra.types';

const createInitialFilters = (): SolicitudCompraListFilters => ({
  busqueda: '',
  grupoListado: 'en_proceso',
  estadoCodigo: null,
  prioridadCodigo: null,
  fechaDesde: null,
  fechaHasta: null,
  soloBloqueadas: false,
  soloDiferenciaOc: false,
});

const createInitialState = (): SolicitudCompraListState => ({
  items: [],
  allSearchItems: [],
  rawRows: [],
  loading: false,
  loadingMore: false,
  searching: false,
  error: null,
  filters: createInitialFilters(),
  pagination: getInitialPagination(),
  lastRequestKey: null,
  initialized: false,
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

const createRpcParams = (
  filters: SolicitudCompraListFilters,
  offset: number,
  limit: number
): SolicitudCompraListRpcParams => ({
  p_busqueda: normalizarBusqueda(filters.busqueda) || null,
  p_grupo_listado: filters.grupoListado,
  p_estado_codigo: filters.estadoCodigo,
  p_prioridad_codigo: filters.prioridadCodigo,
  p_fecha_desde: filters.fechaDesde,
  p_fecha_hasta: filters.fechaHasta,
  p_solo_bloqueadas: filters.soloBloqueadas,
  p_solo_diferencia_oc: filters.soloDiferenciaOc,
  p_limit: limit,
  p_offset: offset,
});

const createRequestKey = (
  scope: string,
  filters: SolicitudCompraListFilters,
  offset: number
): string =>
  JSON.stringify({
    scope,
    offset,
    filters: {
      ...filters,
      busqueda: normalizarBusqueda(filters.busqueda),
    },
  });

export const useSolicitudesCompraStore = defineStore('solicitudesCompraList', {
  state: (): SolicitudCompraListState => createInitialState(),

  actions: {
    async cargarInicial(): Promise<void> {
      const requestKey = createRequestKey('cargarInicial', this.filters, 0);

      this.loading = true;
      this.loadingMore = false;
      this.searching = false;
      this.error = null;
      this.pagination = getInitialPagination();
      this.lastRequestKey = requestKey;

      try {
        if (isSearchMode(this.filters.busqueda)) {
          await this.buscar(requestKey);
          return;
        }

        const params = createRpcParams(
          this.filters,
          0,
          this.pagination.pageSize
        );
        const rows = await solicitudesCompraService.obtenerSolicitudesListaPagina(params);

        if (this.lastRequestKey !== requestKey) {
          return;
        }

        const totalCount = getSafeTotalCount(rows, 0);

        this.rawRows = rows;
        this.allSearchItems = [];
        this.items = mapSolicitudCompraListRowsToItems(rows);
        this.pagination = {
          ...getInitialPagination(totalCount),
          hasMore: canLoadMoreRemote({
            ...getInitialPagination(totalCount),
            totalCount,
          }),
        };
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

      if (isSearchMode(this.filters.busqueda)) {
        const nextVisibleCount =
          this.pagination.localVisibleCount + this.pagination.pageSize;

        this.pagination = {
          ...this.pagination,
          localVisibleCount: nextVisibleCount,
          totalCount: this.allSearchItems.length,
          hasMore: canShowMoreLocal(this.allSearchItems.length, nextVisibleCount),
        };
        this.items = this.allSearchItems.slice(0, nextVisibleCount);
        return;
      }

      const nextOffset = getNextRemoteOffset(this.pagination);
      const requestKey = createRequestKey('cargarMas', this.filters, nextOffset);

      this.loadingMore = true;
      this.error = null;
      this.lastRequestKey = requestKey;

      try {
        const params = createRpcParams(
          this.filters,
          nextOffset,
          this.pagination.pageSize
        );
        const rows = await solicitudesCompraService.obtenerSolicitudesListaPagina(params);

        if (this.lastRequestKey !== requestKey) {
          return;
        }

        const appendedItems = mapSolicitudCompraListRowsToItems(rows);
        const totalCount = getSafeTotalCount(rows, this.pagination.totalCount);
        const nextPagination = {
          ...this.pagination,
          remoteOffset: nextOffset,
          totalCount,
        };

        this.rawRows = [...this.rawRows, ...rows];
        this.items = [...this.items, ...appendedItems];
        this.pagination = {
          ...nextPagination,
          hasMore: canLoadMoreRemote(nextPagination),
        };
      } catch (error) {
        if (this.lastRequestKey !== requestKey) {
          return;
        }

        const message = error instanceof Error
          ? error.message
          : 'No se pudieron cargar más solicitudes';

        this.error = message;
        throw error;
      } finally {
        if (this.lastRequestKey === requestKey) {
          this.loadingMore = false;
        }
      }
    },

    async buscar(requestKey?: string): Promise<void> {
      if (!isSearchMode(this.filters.busqueda)) {
        await this.cargarInicial();
        return;
      }

      const activeRequestKey =
        requestKey ??
        createRequestKey('buscar', this.filters, 0);
      const localPagination = getInitialPagination();

      this.searching = true;
      this.error = null;
      this.pagination = localPagination;
      this.lastRequestKey = activeRequestKey;

      try {
        const params = createRpcParams(
          this.filters,
          0,
          this.pagination.pageSize
        );
        const rows = await solicitudesCompraService.buscarSolicitudesLista(params);

        if (this.lastRequestKey !== activeRequestKey) {
          return;
        }

        const allSearchItems = mapSolicitudCompraListRowsToItems(rows);

        this.rawRows = rows;
        this.allSearchItems = allSearchItems;
        this.items = allSearchItems.slice(0, localPagination.localVisibleCount);
        this.pagination = {
          ...localPagination,
          totalCount: allSearchItems.length,
          hasMore: canShowMoreLocal(
            allSearchItems.length,
            localPagination.localVisibleCount
          ),
        };
      } catch (error) {
        if (this.lastRequestKey !== activeRequestKey) {
          return;
        }

        const message = error instanceof Error
          ? error.message
          : 'No se pudieron buscar las solicitudes';

        this.error = message;
        throw error;
      } finally {
        if (this.lastRequestKey === activeRequestKey) {
          this.searching = false;
        }
      }
    },

    async actualizarFiltro(
      partialFilters: Partial<SolicitudCompraListFilters>
    ): Promise<void> {
      this.filters = {
        ...this.filters,
        ...partialFilters,
        busqueda: partialFilters.busqueda !== undefined
          ? normalizarBusqueda(partialFilters.busqueda)
          : this.filters.busqueda,
      };
      this.pagination = getInitialPagination();

      await this.cargarInicial();
    },

    async limpiarFiltros(): Promise<void> {
      this.filters = {
        ...createInitialFilters(),
        grupoListado: this.filters.grupoListado,
      };
      this.pagination = getInitialPagination();

      await this.cargarInicial();
    },

    async cambiarGrupoListado(
      grupo: SolicitudCompraGrupoListado
    ): Promise<void> {
      this.filters = {
        ...this.filters,
        grupoListado: grupo,
      };
      this.pagination = getInitialPagination();

      await this.cargarInicial();
    },

    async refrescar(): Promise<void> {
      this.pagination = getInitialPagination();
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
