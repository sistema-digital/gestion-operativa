<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useComprasStore } from '@/stores/comprasStore';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Calendar, Clock, Filter, Layers, List } from 'lucide-vue-next';
import BaseKPI from '@/components/BaseKPI.vue';

const router = useRouter();
const store = useComprasStore();

const searchQuery = ref('');
const sortBy = ref<'desc' | 'asc'>('desc');
const groupByTeam = ref(false);

const isNewFormOpen = ref(false);

const userEmail = ref('');
const userArea = ref('');
const allProfiles = ref<any[]>([]);

const fetchData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.email) {
    userEmail.value = user.email;
  }
  
  const { data: currentProfile } = await supabase.from('PROFILE').select('*').eq('email', userEmail.value).maybeSingle();
  if (currentProfile) {
    userArea.value = (currentProfile.area || '').toUpperCase();
  }

  let emailsFilter: string[] = [];

  if (userArea.value === 'ALL') {
    const { data: profiles } = await supabase.from('PROFILE').select('*');
    if (profiles) {
      allProfiles.value = profiles;
    }
  } else if (userArea.value === 'ALMACEN') {
    const { data: profiles } = await supabase.from('PROFILE').select('*');
    if (profiles) {
      allProfiles.value = profiles;
    }
    // No email filtering because ALMACEN will be strictly filtered by states 1, 2, 10 in the store
  } else {
    // Buscar tipo OR con el area igual o el email propio
    const { data: profiles } = await supabase.from('PROFILE').select('*').or(`area.ilike.${userArea.value},email.eq.${userEmail.value}`);
    if (profiles) {
      allProfiles.value = profiles;
      emailsFilter = profiles.map(p => p.email);
    }
    if (!emailsFilter.includes(userEmail.value) && userEmail.value) {
      emailsFilter.push(userEmail.value);
    }
  }

  await store.fetchEstados();
  await store.fetchSolicitudes(userArea.value, emailsFilter);
};

onMounted(async () => {
  await fetchData();
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
  const groups: Record<string, typeof filteredRequests.value> = {};
  
  filteredRequests.value.forEach(req => {
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

const toggleEstado = (id: number) => {
  if (store.selectedEstadoId === id) {
    store.selectedEstadoId = null;
  } else {
    store.selectedEstadoId = id;
  }
};

import { formatDateDisplay } from '@/utils/dateUtils';

const formatDate = (d: string | null) => formatDateDisplay(d);

// Handlers
const goToDetail = (id: string) => {
  router.push(`/compras/${id}`);
};

</script>

<template>
  <div class="h-full flex flex-col pt-4 px-4 sm:px-8 pb-32 md:pb-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-display font-bold text-main-dark">Solicitudes de Compra</h1>
    </div>

    <!-- Filters & Actions -->
    <div class="flex flex-col md:flex-row gap-4 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center">
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

      <div class="flex items-center gap-4 flex-wrap w-full md:w-auto justify-end">
        <!-- Grouping Toggle -->
        <button 
          @click="groupByTeam = !groupByTeam"
          class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors border"
          :class="groupByTeam ? 'bg-main text-white border-main' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'"
        >
          <List v-if="groupByTeam" class="w-4 h-4" />
          <Layers v-else class="w-4 h-4" />
          Agrupar
        </button>

        <!-- Sorting -->
        <select v-model="sortBy" class="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-gray-700 bg-gray-50">
          <option value="desc">Más reciente</option>
          <option value="asc">Más antigua</option>
        </select>

        <button @click="openNewForm" class="flex items-center gap-2 px-4 py-2 bg-accent text-main-dark font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-sm">
          <Plus class="w-5 h-5" /> Nueva Solicitud
        </button>
      </div>
    </div>

    <!-- KPI States Scroll -->
    <div class="flex overflow-x-auto gap-4 pb-4 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div 
        v-for="estado in filterEstados" 
        :key="estado.id"
        @click="toggleEstado(estado.id)"
        class="flex-shrink-0 cursor-pointer transition-transform hover:-translate-y-1"
      >
        <BaseKPI
          :name="estado.name"
          :value="statesCounts[estado.id] || 0"
          :color="store.selectedEstadoId === estado.id ? 'border-accent' : 'border-main'"
          class="w-48 transition-colors"
          :class="[store.selectedEstadoId === estado.id ? 'ring-2 ring-accent bg-main-dark text-white' : '']"
        />
      </div>
    </div>

    <!-- List grouped or flat -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="groupByTeam && groupedRequests" class="space-y-8">
        <div v-for="(group, groupName) in groupedRequests" :key="groupName" class="space-y-4">
          <h3 class="font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide text-xs">
            <div class="w-2 h-2 rounded-full bg-accent"></div>
            {{ groupName }} ({{ group.length }})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="req in group" 
              :key="req.id"
              @click="goToDetail(req.id)"
              class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-accent hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group/card"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-gray-900 group-hover/card:text-main transition-colors">{{ req.folio_sol || 'Sin Folio' }}</h4>
                </div>
                <span class="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg whitespace-nowrap">{{ store.getEstadoName(req.estado_id) }}</span>
              </div>
              <p class="text-sm text-gray-600 line-clamp-2">{{ req.observacion }}</p>
              
              <div class="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-[10px] text-gray-400 truncate font-medium">Req: <span class="uppercase font-bold text-gray-600">{{ req.nombreSolicitante || req.email }}</span></div>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <div class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-main opacity-70" />
                    <span>{{ formatDate(req.fecha_creacion) }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5 text-secondary opacity-70" />
                    <span>{{ formatDate(req.fecha_entrega) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="req in filteredRequests" 
          :key="req.id"
          @click="goToDetail(req.id)"
          class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-accent hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group/card relative overflow-hidden"
        >
          <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-3xl z-0 pointer-events-none"></div>
          <div class="flex justify-between items-start z-10">
            <div>
              <h4 class="font-bold text-gray-900 group-hover/card:text-main transition-colors">{{ req.folio_sol || 'Sin Folio' }}</h4>
            </div>
            <span class="text-[10px] uppercase tracking-wide font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg whitespace-nowrap">{{ store.getEstadoName(req.estado_id) }}</span>
          </div>
          
          <div class="flex-1 space-y-2 z-10">
            <p class="text-sm text-gray-600 line-clamp-2">{{ req.observacion }}</p>
            <div v-if="req.equipos?.length" class="flex flex-wrap gap-1 mt-2">
              <span v-for="eq in req.equipos" :key="eq.cod_equipo" class="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                {{ eq.cod_equipo }}
              </span>
            </div>
          </div>
          
          <div class="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2 z-10">
            <div class="flex items-center justify-between">
              <div class="text-[10px] text-gray-400 truncate font-medium">Req: <span class="uppercase font-bold text-gray-600">{{ req.nombreSolicitante || req.email }}</span></div>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <div class="flex items-center gap-1.5">
                <Calendar class="w-3 h-3 text-main opacity-70" />
                <span>{{ formatDate(req.fecha_creacion) }}</span>
              </div>
              <div class="flex items-center gap-1.5" title="Fecha Entrega">
                <Clock class="w-3 h-3 text-secondary opacity-70" />
                <span class="font-medium text-gray-700">{{ formatDate(req.fecha_entrega) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="filteredRequests.length === 0" class="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
          <Search class="w-12 h-12 mb-4 opacity-50" />
          <p>No se encontraron solicitudes.</p>
        </div>
      </div>
    </div>
  </div>
</template>
