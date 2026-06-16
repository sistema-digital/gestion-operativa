<script setup lang="ts">
import { computed, onMounted } from 'vue';

import SolicitudesDesktopTable from '@/components/compras/list/desktop/SolicitudesDesktopTable.vue';
import SolicitudesGrupoTabs from '@/components/compras/list/SolicitudesGrupoTabs.vue';
import SolicitudesListEmptyState from '@/components/compras/list/SolicitudesListEmptyState.vue';
import SolicitudesListErrorState from '@/components/compras/list/SolicitudesListErrorState.vue';
import SolicitudesListLoadMoreTrigger from '@/components/compras/list/SolicitudesListLoadMoreTrigger.vue';
import SolicitudesListSkeleton from '@/components/compras/list/SolicitudesListSkeleton.vue';
import SolicitudesListToolbar from '@/components/compras/list/SolicitudesListToolbar.vue';
import SolicitudesMobileList from '@/components/compras/list/mobile/SolicitudesMobileList.vue';
import { useSolicitudesCompraList } from '@/components/compras/list/useSolicitudesCompraList';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraRoleCodigo,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const {
  items,
  loading,
  loadingMore,
  searching,
  error,
  filters,
  activeGrupo,
  hasMore,
  initialized,
  loadInitial,
  loadMore,
  onSearchChange,
  onGrupoChange,
  onFilterChange,
  onRetry,
  onRowClick,
  onCardClick,
  onCreateClick,
} = useSolicitudesCompraList();

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

const isListRefreshing = computed(() =>
  initialized.value
  && items.value.length > 0
  && (loading.value || searching.value)
);

const listRefreshingLabel = computed(() =>
  searching.value ? 'Buscando...' : 'Actualizando...'
);

const handleGrupoChange = async (
  grupo: SolicitudCompraGrupoListado
): Promise<void> => {
  await onGrupoChange(grupo);
};

const handleMobileFiltersOpen = (): void => {
  // El toolbar mobile ya expone el evento; la apertura real se conecta cuando exista ese flujo.
};

onMounted(() => {
  void loadInitial();
});
</script>

<template>
  <section class="min-h-screen bg-[#EEECE4]">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <div class="hidden md:block">
        <SolicitudesListToolbar
          :filters="filters"
          :loading="loading"
          :searching="searching"
          :is-mobile="false"
          @update:search="onSearchChange"
          @update:estado="onFilterChange({ estadoCodigo: $event })"
          @update:prioridad="onFilterChange({ prioridadCodigo: $event })"
          @update:fecha-desde="onFilterChange({ fechaDesde: $event })"
          @update:fecha-hasta="onFilterChange({ fechaHasta: $event })"
          @update:solo-bloqueadas="onFilterChange({ soloBloqueadas: $event })"
          @update:solo-diferencia-oc="onFilterChange({ soloDiferenciaOc: $event })"
          @create="onCreateClick"
        />
      </div>

      <div class="md:hidden">
        <SolicitudesListToolbar
          :filters="filters"
          :loading="loading"
          :searching="searching"
          :is-mobile="true"
          @update:search="onSearchChange"
          @update:estado="onFilterChange({ estadoCodigo: $event })"
          @update:prioridad="onFilterChange({ prioridadCodigo: $event })"
          @update:fecha-desde="onFilterChange({ fechaDesde: $event })"
          @update:fecha-hasta="onFilterChange({ fechaHasta: $event })"
          @update:solo-bloqueadas="onFilterChange({ soloBloqueadas: $event })"
          @update:solo-diferencia-oc="onFilterChange({ soloDiferenciaOc: $event })"
          @create="onCreateClick"
          @open-mobile-filters="handleMobileFiltersOpen"
        />
      </div>

      <div class="flex">
        <SolicitudesGrupoTabs
          :model-value="activeGrupo"
          @update:model-value="handleGrupoChange"
        />
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
        <div
          v-if="isListRefreshing"
          class="flex items-center justify-end"
        >
          <span class="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-600">
            {{ listRefreshingLabel }}
          </span>
        </div>

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

        <SolicitudesListLoadMoreTrigger
          :loading-more="loadingMore"
          :has-more="hasMore"
          @load-more="loadMore"
        />
      </template>
    </div>
  </section>
</template>
