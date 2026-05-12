<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useComprasStore } from '@/stores/comprasStore';
import type { SolicitudCompra } from '@/stores/comprasStore';
import { useUserStore } from '@/stores/userStore';
import SolicitudCardList from '@/components/compras/list/SolicitudCardList.vue';
import SolicitudTable from '@/components/compras/list/SolicitudTable.vue';
import { defaultSolicitudColumns, type SolicitudDisplayConfig } from '@/components/compras/list/types';
import { Search, Plus, Layers, List, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const store = useComprasStore();
const userStore = useUserStore();

const searchQuery = ref('');
const sortBy = ref<'desc' | 'asc'>('desc');
const groupByTeam = ref(false);
const filterDropdownOpen = ref(false);
const viewMode = ref<'card' | 'table'>('table');
const currentPage = ref(1);
const pageSize = 20;
const tableGridClass = 'lg:grid-cols-[minmax(140px,0.75fr)_minmax(140px,0.75fr)_minmax(210px,1.2fr)_minmax(180px,0.9fr)_minmax(220px,1.2fr)_minmax(90px,0.5fr)]';
const solicitudColumns = defaultSolicitudColumns;

const isNewFormOpen = ref(false);

const userArea = computed(() => userStore.area);

const fetchData = async () => {
  await store.fetchEstados();
  await store.fetchSolicitudes(userStore.getArea(), userStore.getEmailsFilter());
};

onMounted(async () => {
  await userStore.fetchCurrentUserProfile();
  await store.escucharSolicitudesComprasUsuario(userStore.idsUser.compras);
  await fetchData();
  if (store.selectedEstadoId === null) {
    store.selectedEstadoId = 1;
  }
});

const openNewForm = () => {
  router.push('/compras/nueva');
};

const filterEstados = computed(() => {
  if (userArea.value === 'ALMACEN') {
    return store.estados.filter(e => [1, 2, 10].includes(e.id));
  }
  return store.estados;
});

const statesCounts = computed(() => {
  const counts: Record<number, number> = {};
  store.estados.forEach(e => counts[e.id] = 0);
  store.solicitudes.forEach(s => {
    if (counts[s.estado_id] !== undefined) {
      counts[s.estado_id]++;
    }
  });
  return counts;
});

const filteredRequests = computed(() => {
  let list = [...store.solicitudes];

  // Filtering by search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(item => 
      item.folio_sol?.toLowerCase().includes(q) ||
      item.observacion?.toLowerCase().includes(q) ||
      item.equipos?.some(e => 
        e.cod_equipo.toLowerCase().includes(q)
      )
    );
  }

  // Filtering by state
  if (store.selectedEstadoId !== null) {
    list = list.filter(item => item.estado_id === store.selectedEstadoId);
  }

  // Sorting
  list.sort((a, b) => {
    const dateA = new Date(a.fecha_creacion).getTime();
    const dateB = new Date(b.fecha_creacion).getTime();
    return sortBy.value === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return list;
});

const groupedRequests = computed(() => {
  if (!groupByTeam.value) return null;
  const groups: Record<string, SolicitudCompra[]> = {};
  
  paginatedRequests.value.forEach(req => {
    if (!req.equipos || req.equipos.length === 0) {
      if (!groups['Sin Equipo']) groups['Sin Equipo'] = [];
      groups['Sin Equipo'].push(req);
    } else {
      req.equipos.forEach(eq => {
        const name = eq.cod_equipo;
        if (!groups[name]) groups[name] = [];
        // Prevent duplicate refs in case request has same team assigned multiple times
        if (!groups[name].some(r => r.id === req.id)) {
            groups[name].push(req);
        }
      });
    }
  });
  return groups;
});

const totalRequests = computed(() => filteredRequests.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalRequests.value / pageSize)));
const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredRequests.value.slice(start, start + pageSize);
});

watch([searchQuery, sortBy, () => store.selectedEstadoId, groupByTeam, viewMode], () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});

const goToPreviousPage = () => {
  currentPage.value = Math.max(1, currentPage.value - 1);
};

const goToNextPage = () => {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
};

const toggleEstado = (id: number) => {
  if (store.selectedEstadoId === id) {
    store.selectedEstadoId = null;
  } else {
    store.selectedEstadoId = id;
  }
};

import { formatDateDisplay, formatPanamaDateTime } from '@/utils/dateUtils';

const formatDate = (d: string | null) => formatDateDisplay(d);
const formatDateTime = (d: string | null) => formatPanamaDateTime(d);

const estadoActualLabel = (req: SolicitudCompra) => {
  const estadoActual = store.getEstadoName(req.estado_id);
  const historial = req.historial_estado_actual;

  if (historial?.estado_id === req.estado_id && historial.fecha_inicio) {
    return `${estadoActual} · ${formatPanamaDateTime(historial.fecha_inicio)}`;
  }

  return estadoActual;
};

const shouldShowPriorityBadge = (req: SolicitudCompra) => Number(req.prioridad_id) === 2 || Number(req.prioridad_id) === 3;

const priorityBadgeClass = (req: SolicitudCompra) => {
  if (Number(req.prioridad_id) === 3) {
    return 'bg-red-100 text-red-700 border-red-200';
  }

  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
};

const priorityLabel = (req: SolicitudCompra) => req.prioridad || 'Prioridad';

const ordenesCompraLabel = (req: SolicitudCompra) => {
  const folios = req.ordenes_compra
    ?.map(orden => orden.folio_oc)
    .filter(Boolean);

  return folios?.length ? folios.join(', ') : 'No Asignado';
};

const solicitudDisplay = computed<SolicitudDisplayConfig>(() => ({
  estadoLabel: estadoActualLabel,
  ordenesCompraLabel,
  shouldShowPriorityBadge,
  priorityLabel,
  priorityClass: priorityBadgeClass,
  formatDate,
  formatDateTime,
}));

// Handlers
const goToDetail = (id: string) => {
  if (userArea.value === 'ALMACEN') {
    router.push(`/compras/${id}/editar`);
  } else {
    router.push(`/compras/${id}`);
  }
};

const isChildRoute = computed(() => route.name !== 'Compras');

</script>

<template>
  <div class="h-full flex overflow-hidden relative w-full">
    <!-- MAIN LIST PANEL -->
    <!-- Hidden on mobile when child route is active -->
    <div 
      class="flex-1 flex flex-col pt-4 px-4 sm:px-8 pb-0 md:pb-8 overflow-hidden h-full w-full"
      :class="{ 'hidden md:flex': isChildRoute }"
    >
    <!-- Filters & Actions -->
    <div class="flex flex-col gap-2 sm:gap-1 mb-4 bg-white p-4 sm:p-2 rounded-2xl shadow-sm border border-gray-100">
      
      <div class="flex flex-col md:flex-row gap-4 items-center">
        <!-- Search -->
        <div class="relative flex-1 w-full">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar folio, equipo, observación..."
            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-sm"
          />
        </div>

        <div class="hidden md:flex items-center gap-4 flex-wrap w-full md:w-auto justify-end">
          <!-- Grouping Toggle -->
          <button 
            @click="groupByTeam = !groupByTeam"
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors border cursor-pointer"
            :class="groupByTeam ? 'bg-main text-white border-main' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'"
          >
            <List v-if="groupByTeam" class="w-4 h-4" />
            <Layers v-else class="w-4 h-4" />
            Agrupar
          </button>

          <!-- Sorting -->
          <select v-model="sortBy" class="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-gray-700 bg-gray-50 cursor-pointer">
            <option value="desc">Más reciente</option>
            <option value="asc">Más antigua</option>
          </select>

          <div class="hidden lg:inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              @click="viewMode = 'card'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              :class="viewMode === 'card' ? 'bg-white text-main shadow-sm' : 'text-gray-500 hover:text-gray-800'"
              title="Vista de cards"
            >
              <Layers class="w-4 h-4" />
              Cards
            </button>
            <button
              @click="viewMode = 'table'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              :class="viewMode === 'table' ? 'bg-white text-main shadow-sm' : 'text-gray-500 hover:text-gray-800'"
              title="Vista de filas"
            >
              <List class="w-4 h-4" />
              Filas
            </button>
          </div>

          <!-- Desktop New Request btn -->
          <button v-if="userArea !== 'ALMACEN'" @click="openNewForm" class="hidden md:flex items-center gap-2 px-4 py-2 bg-accent text-main-dark font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-sm cursor-pointer hover:cursor-pointer">
            <Plus class="w-5 h-5" /> Nueva Solicitud
          </button>
        </div>
      </div>

      <!-- Segmented Filter Buttons Desktop -->
      <div class="hidden md:flex justify-center overflow-x-auto w-full hide-scrollbar border-t border-gray-100 pt-1">
        <div class="inline-flex gap-2 bg-gray-100 p-1.5 rounded-full">
          <button 
            v-for="estado in filterEstados" 
            :key="estado.id"
            @click="toggleEstado(estado.id)"
            class="flex justify-center items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer outline-none border"
            :class="store.selectedEstadoId === estado.id 
              ? 'bg-main/20 text-main shadow-sm border-main/20' 
              : 'text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-200/50 border-gray-400/20'"
          >
            <span>{{ estado.name }}</span>
            <span 
              class="px-2 py-0.5 rounded-full text-xs font-bold transition-colors"
              :class="store.selectedEstadoId === estado.id ? 'bg-white/60 text-main-dark' : 'bg-gray-200/80 text-gray-500'"
            >
              {{ statesCounts[estado.id] || 0 }}
            </span>
          </button>
        </div>
      </div>

      <!-- Filter Select Mobile/Tablet -->
      <div class="md:hidden relative z-20 w-full mt-1 border-t border-gray-100 pt-1">
        <div 
          @click="filterDropdownOpen = !filterDropdownOpen"
          class="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer shadow-sm"
        >
          <div class="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Filter class="w-4 h-4 text-main" />
            <span>
              {{ store.selectedEstadoId ? store.getEstadoName(store.selectedEstadoId) : 'Todos los estados' }}
            </span>
            <span v-if="store.selectedEstadoId" class="px-2 py-0.5 rounded-full bg-main/20 text-main text-xs font-bold">
              {{ statesCounts[store.selectedEstadoId] || 0 }}
            </span>
          </div>
          <ChevronDown class="w-4 h-4 text-gray-500 transition-transform" :class="filterDropdownOpen ? 'rotate-180' : ''" />
        </div>
        
        <div v-if="filterDropdownOpen" class="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg p-2 flex flex-col gap-1">
          <div 
            v-for="estado in filterEstados" 
            :key="estado.id"
            @click="toggleEstado(estado.id); filterDropdownOpen = false"
            class="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
            :class="store.selectedEstadoId === estado.id ? 'bg-main/20 text-main font-bold border border-main/20' : 'text-gray-600 hover:bg-gray-50 border border-transparent'"
          >
            <span>{{ estado.name }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold transition-colors" :class="store.selectedEstadoId === estado.id ? 'text-main bg-white/60' : 'text-gray-500 bg-gray-100'">
              {{ statesCounts[estado.id] || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    

    <!-- List grouped or flat -->
    <div class="flex-1 overflow-y-auto pb-[calc(132px+env(safe-area-inset-bottom))] md:pb-0">
      <div v-if="groupByTeam && groupedRequests" class="space-y-8">
        <div v-for="(group, groupName) in groupedRequests" :key="groupName" class="space-y-4">
          <h3 class="font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide text-xs">
            <div class="w-2 h-2 rounded-full bg-accent"></div>
            {{ groupName }} ({{ group.length }})
          </h3>
          <SolicitudCardList
            v-if="viewMode === 'card'"
            :items="group"
            :display="solicitudDisplay"
            :show-teams="false"
            @item-click="goToDetail($event.id)"
          />
          <SolicitudTable
            v-else
            :items="group"
            :columns="solicitudColumns"
            :display="solicitudDisplay"
            :grid-class="tableGridClass"
            @row-click="goToDetail($event.id)"
          />
        </div>
      </div>
      
      <SolicitudCardList
        v-else-if="viewMode === 'card'"
        :items="paginatedRequests"
        :display="solicitudDisplay"
        accent-cards
        @item-click="goToDetail($event.id)"
      >
        <template #empty>
          <Search class="w-12 h-12 mb-4 opacity-50" />
          <p>No se encontraron solicitudes.</p>
        </template>
      </SolicitudCardList>
      <SolicitudTable
        v-else
        :items="paginatedRequests"
        :columns="solicitudColumns"
        :display="solicitudDisplay"
        :grid-class="tableGridClass"
        @row-click="goToDetail($event.id)"
      >
        <template #empty>
          <Search class="w-12 h-12 mb-4 opacity-50" />
          <p>No se encontraron solicitudes.</p>
        </template>
      </SolicitudTable>
    </div>

    <div class="sticky bottom-0 z-30 flex items-center justify-center gap-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-second/95 backdrop-blur border-t border-gray-100">
      <button
        @click="goToPreviousPage"
        :disabled="currentPage === 1"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <ChevronLeft class="w-4 h-4" />
        Anterior
      </button>
      <span class="min-w-24 text-center text-sm font-bold text-gray-700">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        @click="goToNextPage"
        :disabled="currentPage === totalPages"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Siguiente
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
    </div> <!-- Close MAIN LIST PANEL div -->

    <!-- SIDE PANEL BACKDROP (Desktop) -->
    <transition name="fade">
      <div 
        v-if="isChildRoute"
        @click="router.push('/compras')"
        class="hidden md:block absolute inset-0 bg-black/20 z-[40]"
      ></div>
    </transition>

    <!-- SIDE PANEL (Desktop) / FULL PAGE (Mobile) -->
    <!-- Render this if child route is active -->
    <transition name="drawer">
      <div 
        v-if="isChildRoute"
        class="w-full md:w-[600px] lg:w-[800px] h-full bg-second shadow-2xl flex-shrink-0 border-l border-gray-200 z-[50] absolute top-0 right-0 overflow-hidden"
      >
        <router-view v-slot="{ Component }">
          <transition name="slide-panel" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-panel-enter-active,
.slide-panel-leave-active,
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
}
.slide-panel-enter-from,
.drawer-enter-from {
  transform: translateX(100%);
  opacity: 0.5;
}
.slide-panel-leave-to {
  transform: translateX(-100%); 
  opacity: 0;
}
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
