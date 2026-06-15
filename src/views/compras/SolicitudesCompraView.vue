<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';

import { useSolicitudesCompraStore } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.store';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListItem,
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

  const loadInitial = async (): Promise<void> => {
    await store.cargarInicial();
  };

  const loadMore = async (): Promise<void> => {
    if (loading.value || loadingMore.value || !hasMore.value) {
      return;
    }

    await store.cargarMas();
  };

  const onGrupoChange = async (grupo: SolicitudCompraGrupoListado): Promise<void> => {
    await store.cambiarGrupoListado(grupo);
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
        class="rounded-2xl border border-stone-300 bg-white/85 px-5 py-10 text-center shadow-sm"
      >
        <p class="text-sm font-medium text-stone-700">
          Cargando solicitudes de compra...
        </p>
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 shadow-sm"
      >
        <p class="text-sm font-semibold text-rose-700">
          No se pudo cargar el listado.
        </p>
        <p class="mt-1 text-sm text-rose-600">
          {{ error }}
        </p>
        <button
          type="button"
          class="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          @click="onRetry"
        >
          Reintentar
        </button>
      </div>

      <div
        v-else-if="items.length === 0"
        class="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-5 py-10 text-center shadow-sm"
      >
        <p class="text-sm font-medium text-stone-700">
          No hay solicitudes para mostrar.
        </p>
        <p class="mt-1 text-sm text-stone-500">
          Este estado temporal será reemplazado por el empty state del listado.
        </p>
      </div>

      <template v-else>
        <div class="hidden md:block">
          <!-- TODO SPEC-10: reemplazar este bloque por SolicitudesDesktopTable -->
          <div class="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
            <div class="grid grid-cols-[1.1fr_2fr_1fr_1fr_1.2fr] gap-4 border-b border-stone-200 bg-stone-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              <span>Folio</span>
              <span>Observación</span>
              <span>Estado</span>
              <span>Prioridad</span>
              <span>Área</span>
            </div>

            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              class="grid w-full grid-cols-[1.1fr_2fr_1fr_1fr_1.2fr] gap-4 border-b border-stone-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-stone-50"
              @click="onRowClick(item)"
            >
              <span class="text-sm font-semibold text-stone-900">
                {{ item.folio.folioSolLabel || 'Sin folio' }}
              </span>
              <span class="truncate text-sm text-stone-700">
                {{ item.observacion || 'Sin observación' }}
              </span>
              <span class="text-sm text-stone-700">
                {{ item.estado.badgeLabel }}
              </span>
              <span class="text-sm text-stone-700">
                {{ item.prioridad.nombre }}
              </span>
              <span class="text-sm text-stone-600">
                {{ item.area.nombre || 'Sin área' }}
              </span>
            </button>
          </div>
        </div>

        <div class="space-y-3 md:hidden">
          <!-- TODO SPEC-12: reemplazar este bloque por SolicitudesMobileList -->
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-4 text-left shadow-sm transition hover:bg-stone-50"
            @click="onCardClick(item)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-stone-900">
                  {{ item.folio.folioSolLabel || 'Sin folio' }}
                </p>
                <p class="mt-1 text-sm text-stone-600">
                  {{ item.estado.badgeLabel }}
                </p>
              </div>
              <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {{ item.prioridad.nombre }}
              </span>
            </div>

            <p class="mt-3 text-sm text-stone-700">
              {{ item.observacion || 'Sin observación' }}
            </p>

            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
              <span>{{ item.area.nombre || 'Sin área' }}</span>
              <span>{{ item.solicitante.nombre || 'Sin solicitante' }}</span>
            </div>
          </button>
        </div>

        <div class="rounded-2xl border border-stone-300 bg-white/85 p-4 shadow-sm">
          <!-- TODO SPEC-14: reemplazar este bloque por LoadMoreTrigger -->
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p class="text-sm text-stone-600">
              {{ totalVisible }} resultados visibles
              <span v-if="isSearchMode" class="text-stone-500">
                · modo búsqueda local
              </span>
            </p>

            <button
              v-if="hasMore"
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loadingMore || loading"
              @click="loadMore"
            >
              {{ loadingMore ? 'Cargando más...' : 'Cargar más' }}
            </button>

            <p v-else class="text-sm text-stone-500">
              No hay más resultados por ahora.
            </p>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
