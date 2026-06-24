<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SolicitudesDesktopTable from '@/components/compras/list/desktop/SolicitudesDesktopTable.vue';
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
  baseItems,
  loading,
  loadingMore,
  searching,
  error,
  filters,
  activeGrupo,
  baseEmpty,
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
} = useSolicitudesCompraList();
const router = useRouter();
const route = useRoute();
const isTransitioningToCreate = ref(false);
const CREATE_VIEW_TRANSITION_MS = 260;

const roleCodigo = computed<SolicitudCompraRoleCodigo>(
  () => items.value[0]?.viewerRoleCodigo ?? baseItems.value[0]?.viewerRoleCodigo ?? 'operativo'
);
const isCreateOverlayOpen = computed(() => route.name === 'SolicitudCompraCrear');

const searchActive = computed(() =>
  filters.value.busqueda.trim().length > 0
  || Boolean(filters.value.estadoCodigo)
  || Boolean(filters.value.prioridadCodigo)
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

const openCreateOverlay = (): void => {
  if (isTransitioningToCreate.value || isCreateOverlayOpen.value) {
    return;
  }

  isTransitioningToCreate.value = true;
  window.dispatchEvent(new CustomEvent('prepare-open-solicitud-compra'));

  window.setTimeout(() => {
    void router.push({ name: 'SolicitudCompraCrear' });
  }, CREATE_VIEW_TRANSITION_MS);
};

const handleOpenNewSolicitudCompra = (): void => {
  openCreateOverlay();
};

onMounted(() => {
  window.addEventListener('open-new-solicitud-compra', handleOpenNewSolicitudCompra);
  void loadInitial();
});

watch(
  () => route.name,
  (name) => {
    if (name === 'Compras') {
      isTransitioningToCreate.value = false;
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('open-new-solicitud-compra', handleOpenNewSolicitudCompra);
});
</script>

<template>
  <section class="relative min-h-screen bg-[#EEECE4]">
    <div
      class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 transition-all duration-300 md:px-6 md:py-6"
      :class="[
        isCreateOverlayOpen ? 'pointer-events-none select-none' : '',
        isTransitioningToCreate ? '-translate-x-8 opacity-0' : 'translate-x-0 opacity-100'
      ]"
      :aria-hidden="isCreateOverlayOpen"
    >
      <div class="hidden lg:block">
        <SolicitudesListToolbar
          :filters="filters"
          :loading="loading"
          :searching="searching"
          :active-grupo="activeGrupo"
          :is-mobile="false"
          @update:search="onSearchChange"
          @update:grupo="handleGrupoChange"
          @update:estado="onFilterChange({ estadoCodigo: $event })"
          @update:prioridad="onFilterChange({ prioridadCodigo: $event })"
          @update:fecha-desde="onFilterChange({ fechaDesde: $event })"
          @update:fecha-hasta="onFilterChange({ fechaHasta: $event })"
          @update:solo-bloqueadas="onFilterChange({ soloBloqueadas: $event })"
          @update:solo-diferencia-oc="onFilterChange({ soloDiferenciaOc: $event })"
          @create="openCreateOverlay"
        />
      </div>

      <div class="lg:hidden">
        <SolicitudesListToolbar
          :filters="filters"
          :loading="loading"
          :searching="searching"
          :active-grupo="activeGrupo"
          :is-mobile="true"
          @update:search="onSearchChange"
          @update:grupo="handleGrupoChange"
          @update:estado="onFilterChange({ estadoCodigo: $event })"
          @update:prioridad="onFilterChange({ prioridadCodigo: $event })"
          @update:fecha-desde="onFilterChange({ fechaDesde: $event })"
          @update:fecha-hasta="onFilterChange({ fechaHasta: $event })"
          @update:solo-bloqueadas="onFilterChange({ soloBloqueadas: $event })"
          @update:solo-diferencia-oc="onFilterChange({ soloDiferenciaOc: $event })"
          @create="openCreateOverlay"
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
        :suggest-date-range="baseEmpty"
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

    <router-view v-slot="{ Component, route: childRoute }">
      <transition name="overlay-slide">
        <div
          v-if="Component"
          class="fixed inset-0 z-[70] overflow-y-auto bg-[#EEECE4]"
        >
          <component :is="Component" :key="childRoute.fullPath" />
        </div>
      </transition>
    </router-view>
  </section>
</template>

<style scoped>
.overlay-slide-enter-active,
.overlay-slide-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.overlay-slide-enter-from,
.overlay-slide-leave-to {
  opacity: 0;
  transform: translateX(3rem);
}
</style>
