<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';

import SolicitudesDesktopTable from '@/components/compras/list/desktop/SolicitudesDesktopTable.vue';
import SolicitudesListEmptyState from '@/components/compras/list/SolicitudesListEmptyState.vue';
import SolicitudesListErrorState from '@/components/compras/list/SolicitudesListErrorState.vue';
import SolicitudesListLoadMoreTrigger from '@/components/compras/list/SolicitudesListLoadMoreTrigger.vue';
import SolicitudesListSkeleton from '@/components/compras/list/SolicitudesListSkeleton.vue';
import SolicitudesMobileList from '@/components/compras/list/mobile/SolicitudesMobileList.vue';
import { useSolicitudesCompraStore } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.store';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListItem,
  SolicitudCompraRoleCodigo,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const GRUPO_LABELS: Record<SolicitudCompraGrupoListado, string> = {
  en_proceso: 'En proceso',
  completadas: 'Completadas',
  descartadas: 'Descartadas',
};

// TODO SPEC-06: reemplazar este adaptador local por el composable real
// `src/components/compras/list/useSolicitudesCompraList.ts` cuando exista en el repo.
const useSolicitudesCompraList = () => {
  const store = useSolicitudesCompraStore();
  const {
    items,
    loading,
    loadingMore,
    searching,
    error,
    filters,
    pagination,
    initialized,
  } = storeToRefs(store);

  const activeGrupo = computed(() => filters.value.grupoListado);
  const hasMore = computed(() => pagination.value.hasMore);
  const isSearchMode = computed(() => filters.value.busqueda.trim().length > 0);
  const runStoreAction = async (action: () => Promise<void>): Promise<void> => {
    try {
      await action();
    } catch {
      // El store ya expone el error para el estado visual del listado.
    }
  };

  const loadInitial = async (): Promise<void> => {
    await runStoreAction(() => store.cargarInicial());
  };

  const loadMore = async (): Promise<void> => {
    if (loading.value || loadingMore.value || !hasMore.value) {
      return;
    }

    await runStoreAction(() => store.cargarMas());
  };

  const onGrupoChange = async (grupo: SolicitudCompraGrupoListado): Promise<void> => {
    await runStoreAction(() => store.cambiarGrupoListado(grupo));
  };

  const onRetry = async (): Promise<void> => {
    await loadInitial();
  };

  const onRowClick = (item: SolicitudCompraListItem): void => {
    store.prepararAbrirDetalle(item.id);
  };

  const onCardClick = (item: SolicitudCompraListItem): void => {
    store.prepararAbrirDetalle(item.id);
  };

  const onCreateClick = (): void => {
    store.prepararCrearSolicitud();
  };

  return {
    items,
    loading,
    loadingMore,
    searching,
    error,
    filters,
    activeGrupo,
    hasMore,
    isSearchMode,
    initialized,
    loadInitial,
    loadMore,
    onGrupoChange,
    onRetry,
    onRowClick,
    onCardClick,
    onCreateClick,
  };
};

const {
  items,
  loading,
  loadingMore,
  searching,
  error,
  filters,
  activeGrupo,
  hasMore,
  isSearchMode,
  initialized,
  loadInitial,
  loadMore,
  onGrupoChange,
  onRetry,
  onRowClick,
  onCardClick,
  onCreateClick,
} = useSolicitudesCompraList();

const totalVisible = computed(() => items.value.length);
const activeGrupoLabel = computed(() => GRUPO_LABELS[activeGrupo.value]);
const roleCodigo = computed<SolicitudCompraRoleCodigo>(
  () => items.value[0]?.viewerRoleCodigo ?? 'operativo'
);
const searchActive = computed(() =>
  filters.value.busqueda.trim().length > 0
  || Boolean(filters.value.estadoCodigo)
  || Boolean(filters.value.prioridadCodigo)
  || Boolean(filters.value.fechaDesde)
  || Boolean(filters.value.fechaHasta)
  || filters.value.soloBloqueadas
  || filters.value.soloDiferenciaOc
);

onMounted(() => {
  void loadInitial();
});
</script>

<template>
  <section class="min-h-screen bg-[#EEECE4]">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <div class="rounded-2xl border border-stone-300 bg-white/85 p-4 shadow-sm backdrop-blur">
        <!-- TODO SPEC-08: reemplazar este bloque por SolicitudesListToolbar -->
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="grid gap-3 md:flex-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
            <div class="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Búsqueda temporal
              </p>
              <p class="mt-1 text-sm text-stone-800">
                {{ filters.busqueda || 'Sin búsqueda activa' }}
              </p>
            </div>

            <div class="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Grupo activo
              </p>
              <p class="mt-1 text-sm text-stone-800">
                {{ activeGrupoLabel }}
              </p>
            </div>

            <div class="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Estado temporal
              </p>
              <p class="mt-1 text-sm text-stone-800">
                {{ totalVisible }} visibles
                <span v-if="searching" class="text-stone-500">· buscando</span>
                <span v-else-if="loading && initialized" class="text-stone-500">· actualizando</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            @click="onCreateClick"
          >
            Crear
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-stone-300 bg-white/85 p-3 shadow-sm backdrop-blur">
        <!-- TODO SPEC-09: reemplazar este bloque por SolicitudesGrupoTabs -->
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-medium transition"
            :class="activeGrupo === 'en_proceso'
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'"
            @click="onGrupoChange('en_proceso')"
          >
            En proceso
          </button>
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-medium transition"
            :class="activeGrupo === 'completadas'
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'"
            @click="onGrupoChange('completadas')"
          >
            Completadas
          </button>
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-medium transition"
            :class="activeGrupo === 'descartadas'
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'"
            @click="onGrupoChange('descartadas')"
          >
            Descartadas
          </button>
        </div>
      </div>

      <div
        v-if="loading && !initialized"
        class="space-y-3"
      >
        <div class="hidden md:block">
          <SolicitudesListSkeleton variant="desktop" :rows="5" />
        </div>

        <div class="md:hidden">
          <SolicitudesListSkeleton variant="mobile" :rows="4" />
        </div>
      </div>

      <SolicitudesListErrorState
        v-else-if="error"
        :message="error"
        @retry="onRetry"
      />

      <SolicitudesListEmptyState
        v-else-if="items.length === 0"
        :search-active="searchActive"
      />

      <template v-else>
        <div class="hidden md:block">
          <SolicitudesDesktopTable
            :items="items"
            :role-codigo="roleCodigo"
            :loading="loading"
            :loading-more="loadingMore"
            @row-click="onRowClick"
          />
        </div>

        <SolicitudesMobileList
          class="md:hidden"
          :items="items"
          :role-codigo="roleCodigo"
          :loading="loading"
          :loading-more="loadingMore"
          @card-click="onCardClick"
        />

        <div class="space-y-3">
          <div class="rounded-2xl border border-stone-300 bg-white/80 px-4 py-3 shadow-sm">
            <p class="text-sm text-stone-600">
              {{ totalVisible }} resultados visibles
              <span v-if="isSearchMode" class="text-stone-500">
                · modo búsqueda local
              </span>
            </p>
          </div>

          <SolicitudesListLoadMoreTrigger
            :loading-more="loadingMore"
            :has-more="hasMore"
            @load-more="loadMore"
          />
        </div>
      </template>
    </div>
  </section>
</template>
