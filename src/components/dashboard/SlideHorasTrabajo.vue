<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useHorasTrabajoStore, type HoraTrabajoData } from '@/stores/horasTrabajoStore';
import EChart from '@/components/ui/EChart.vue';
import { RefreshCw, ChevronDown, FilterX, Check } from 'lucide-vue-next';
import { getOrderStatusColor } from '@/lib/constants';
import { getWeekNumber } from '@/utils/dateUtils';

const store = useHorasTrabajoStore();

const windowWidth = ref(window.innerWidth);
const updateWidth = () => {
  windowWidth.value = window.innerWidth;
};
const isMobile = computed(() => windowWidth.value < 768);

const formatAreaLabel = (area: string) => {
  if (!isMobile.value) return area;
  const lower = area.toLowerCase();
  if (lower.includes('servicios generales')) return 'S.Generales';
  if (lower.includes('equipo pesado') || lower.includes('equipos pesados') || lower.includes('pesado')) return 'Pesado';
  if (lower.includes('mecanizada')) return 'Mecanizada';
  if (lower.includes('agricola') || lower.includes('agrícola')) return 'Agrícola';
  if (lower.includes('transporte')) return 'M. Transporte';
  return area;
};

// Filtros
const selectedArea = ref<string>('ALL');
const selectedEstatus = ref<string>('ALL');
const selectedWeek = ref<string>('ALL');
const searchQueryInput = ref('');
const searchQuery = ref('');

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery.value = searchQueryInput.value.toLowerCase().trim();
  }, 1000);
};

// Custom Dropdown State
const openDropdown = ref<string | null>(null);

const toggleDropdown = (dropdown: string) => {
  openDropdown.value = openDropdown.value === dropdown ? null : dropdown;
};

const closeDropdowns = () => {
  openDropdown.value = null;
};

const clearFilters = () => {
  selectedWeek.value = 'ALL';
  selectedArea.value = 'ALL';
  selectedEstatus.value = 'ALL';
  searchQueryInput.value = '';
  searchQuery.value = '';
  closeDropdowns();
};

// Opciones de filtro
const availableAreas = computed(() => ['ALL', ...new Set(store.data.map(d => d.area))].sort());
const availableEstatus = computed(() => ['ALL', ...new Set(store.data.map(d => d.estatus))].sort());
const availableWeeks = computed(() => {
  const weeks = [...new Set(store.data.map(d => d.semana_inicio))].sort((a,b) => parseInt(b) - parseInt(a));
  return ['ALL', ...weeks];
});

watch(() => availableWeeks.value, (newVal) => {
  if (selectedWeek.value === 'ALL' && newVal.length > 1) {
    const currentWeekNum = String(getWeekNumber(new Date()));
    // Verificamos si la semana actual está en los datos, sino elegimos la más reciente
    const hasCurrentWeek = newVal.includes(currentWeekNum);
    if (hasCurrentWeek) {
      selectedWeek.value = currentWeekNum;
    } else {
      const maxWeek = newVal.find(w => w !== 'ALL');
      if (maxWeek) {
        selectedWeek.value = maxWeek;
      }
    }
  }
}, { immediate: true });

// Filtrar data
const filteredData = computed(() => {
  return store.data.filter(d => {
    const matchArea = selectedArea.value === 'ALL' || d.area === selectedArea.value;
    const matchEstatus = selectedEstatus.value === 'ALL' || d.estatus === selectedEstatus.value;
    const matchWeek = selectedWeek.value === 'ALL' || d.semana_inicio === selectedWeek.value;
    const matchSearch = !searchQuery.value || (d.equipo && d.equipo.toLowerCase().includes(searchQuery.value));
    return matchArea && matchEstatus && matchWeek && matchSearch;
  });
});

// Filtros para la tabla
const retrasadasData = computed(() => {
  return filteredData.value
    .filter(d => d.is_retrasada)
    .sort((a, b) => parseInt(b.semana_inicio || '0') - parseInt(a.semana_inicio || '0'));
});

// KPIs
const kpiData = computed(() => {
  let retrasada = 0;
  let proceso = 0;
  let concluida = 0;
  let ausencia = 0;

  filteredData.value.forEach(d => {
    const estatus = (d.estatus || '').toLowerCase();
    const hs = d.horas_calculadas || 0;
    
    if (estatus.includes('retrasada') || estatus.includes('retraso')) {
      retrasada += hs;
    } else if (estatus.includes('proceso') || estatus.includes('programado')) {
      proceso += hs;
    } else if (estatus.includes('concluida') || estatus.includes('finalizada') || estatus.includes('completada') || estatus.includes('concluido')) {
      concluida += hs;
    } else if (estatus.includes('ausencia')) {
      ausencia += hs;
    } else {
      // By default if unmapped
    }
  });

  return {
    retrasada,
    proceso,
    concluida,
    ausencia
  };
});

const getColor = (status: string) => {
  return getOrderStatusColor(status).text;
};

// Option refs
const stackedBarOption = ref<any>({});
const areaOption = ref<any>({});
const equipoOption = ref<any>({});

onMounted(async () => {
  window.addEventListener('resize', updateWidth);
  await store.fetchData();
  updateCharts();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
});

watch(() => filteredData.value, () => {
  updateCharts();
}, { deep: true });

watch(isMobile, () => {
  updateCharts();
});

const updateCharts = () => {
  updateStackedBarChart();
  updateAreaChart();
  updateEquipoChart();
};

// 1) Gráfica principal — Horas por semana (estado)
const updateStackedBarChart = () => {
  const data = filteredData.value;
  
  const weeks = [...new Set(data.map(d => d.semana_inicio))].sort((a,b) => parseInt(a) - parseInt(b));
  const statuses = [...new Set(data.map(d => d.estatus))];
  
    const series = statuses.map(status => {
      const colorObj = getOrderStatusColor(status);
    return {
      name: status,
      type: 'bar',
      stack: 'total',
      itemStyle: { 
        color: colorObj.background, 
        borderColor: colorObj.text + 'CC',
        borderWidth: 1,
        borderRadius: [4, 4, 0, 0] 
      },
      data: weeks.map(w => {
        return data.filter(d => d.semana_inicio === w && d.estatus === status)
                   .reduce((sum, d) => sum + d.horas_calculadas, 0);
      })
    };
  });

  stackedBarOption.value = {
    tooltip: { 
       trigger: 'axis', 
       axisPointer: { type: 'shadow' },
       formatter: (params: any) => {
         if (!params) return '';
         let paramsArr = Array.isArray(params) ? params : [params];
         if (paramsArr.length === 0) return '';
         let total = paramsArr.reduce((sum: number, p: any) => sum + Number(p.value || 0), 0);
         let res = `<strong>${paramsArr[0].name}</strong><br/>`;
         paramsArr.forEach((p: any) => {
            if(p.value > 0) {
               let pct = total > 0 ? ((Number(p.value) / total) * 100).toFixed(1) : 0;
               res += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong> hrs <span style="font-size: 11px; color: #666">(${pct}%)</span><br/>`;
            }
         });
         res += `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #ddd;"><strong>Total:</strong> ${total} hrs</div>`;
         return res;
       }
    },
    legend: { data: statuses, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: weeks,
      axisLabel: { fontSize: 10, fontWeight: '900', color: '#1e293b' },
      axisLine: { lineStyle: { color: '#f1f5f9' } }
    },
    yAxis: { 
      type: 'value', 
      name: 'Horas',
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    series
  };
};

// 3) Comparación por área (Horizontales)
const updateAreaChart = () => {
  const data = filteredData.value;
  const areas = [...new Set(data.map(d => d.area))].sort();
  const statuses = [...new Set(data.map(d => d.estatus))];

  const series = statuses.map(status => {
    const colorObj = getOrderStatusColor(status);
    return {
      name: status,
      type: 'bar',
      stack: 'total',
      itemStyle: { 
        color: colorObj.background, 
        borderColor: colorObj.text + 'CC',
        borderWidth: 1,
        borderRadius: [0, 4, 4, 0] 
      },
      data: areas.map(a => {
         return data.filter(d => d.area === a && d.estatus === status)
                    .reduce((sum, d) => sum + d.horas_calculadas, 0);
      })
    };
  });

  areaOption.value = {
    tooltip: { 
       trigger: 'axis', 
       axisPointer: { type: 'shadow' },
       formatter: (params: any) => {
         if (!params) return '';
         let paramsArr = Array.isArray(params) ? params : [params];
         if (paramsArr.length === 0) return '';
         let total = paramsArr.reduce((sum: number, p: any) => sum + Number(p.value || 0), 0);
         let res = `<strong>${paramsArr[0].name}</strong><br/>`;
         paramsArr.forEach((p: any) => {
            if(p.value > 0) {
               let pct = total > 0 ? ((Number(p.value) / total) * 100).toFixed(1) : 0;
               res += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong> hrs <span style="font-size: 11px; color: #666">(${pct}%)</span><br/>`;
            }
         });
         res += `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #ddd;"><strong>Total:</strong> ${total} hrs</div>`;
         return res;
       }
    },
    legend: { data: statuses, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'value', 
      name: 'Horas',
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    yAxis: { 
      type: 'category', 
      data: areas,
      axisLabel: { 
        fontSize: 10, 
        fontWeight: '900', 
        color: '#1e293b',
        formatter: (val: string) => formatAreaLabel(val)
      },
      axisLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series
  };
};

// 4) Distribución por equipo (Top N Barras)
const updateEquipoChart = () => {
  const data = filteredData.value;
  // Agrupar por equipo y sumar horas totales
  const equipoSums: Record<string, number> = {};
  data.forEach(d => {
    equipoSums[d.equipo] = (equipoSums[d.equipo] || 0) + d.horas_calculadas;
  });
  
  // Sort and take top 10
  const topEquiposResult = Object.entries(equipoSums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
    
  const equipos = topEquiposResult.map(entry => entry[0]).reverse(); // Reverse for yAxis so highest is at top
  
  const totalData: number[] = [];
  const retrasadaData: number[] = [];
  
  equipos.forEach(eq => {
    const eqData = data.filter(d => d.equipo === eq);
    const total = eqData.reduce((sum, d) => sum + d.horas_calculadas, 0);
    const retrasadas = eqData.filter(d => d.estatus === 'Retrasada').reduce((sum, d) => sum + d.horas_calculadas, 0);
    totalData.push(total);
    retrasadaData.push(retrasadas);
  });

  equipoOption.value = {
    tooltip: { 
       trigger: 'axis', 
       axisPointer: { type: 'shadow' },
       formatter: (params: any) => {
         if (!params) return '';
         let paramsArr = Array.isArray(params) ? params : [params];
         if (paramsArr.length === 0) return '';
         let total = Number(paramsArr[0]?.value || 0);
         let retrasadas = Number(paramsArr[1]?.value || 0);
         let pct = total > 0 ? ((retrasadas / total) * 100).toFixed(1) : '0.0';
         return `<strong>${paramsArr[0]?.name || ''}</strong><br/>` +
                `${paramsArr[0]?.marker || ''} Horas Totales: <strong>${total}</strong> hrs<br/>` +
                `${paramsArr[1]?.marker || ''} Horas Retrasadas: <strong>${retrasadas}</strong> hrs <span style="font-size: 11px; color: #666">(${pct}%)</span>`;
       }
    },
    legend: { data: ['Horas Totales', 'Horas Retrasadas'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'value', 
      name: 'Horas',
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    yAxis: { 
      type: 'category', 
      data: equipos,
      axisLabel: { fontSize: 10, fontWeight: '900', color: '#1e293b' },
      axisLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      { name: 'Horas Totales', type: 'bar', data: totalData, itemStyle: { color: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: [0, 4, 4, 0] }, barGap: '-100%' },
      { name: 'Horas Retrasadas', type: 'bar', data: retrasadaData, itemStyle: { color: getOrderStatusColor('Retrasada').background, borderColor: getOrderStatusColor('Retrasada').text + 'CC', borderWidth: 1, borderRadius: [0, 4, 4, 0] } }
    ]
  };
};

</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto w-full">
    
    <!-- HEADER & ACTIONS -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
         <h1 class="text-2xl font-bold tracking-tight text-gray-900">Horas de Trabajo</h1>
      </div>
      <div class="flex items-center gap-2">
         <button @click="store.fetchData()" class="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:ring-4 focus:outline-none px-3 py-2 text-xs border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:text-main focus:ring-gray-100 gap-2">
            <RefreshCw class="w-4 h-4" :class="{'animate-spin': store.loading}" />
            Actualizar
         </button>
      </div>
    </div>

    <!-- STICKY FILTER & SEARCH & KPIs -->
    <div class="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-sm p-2 md:p-3 rounded-2xl mb-6 mx-0 border border-gray-100">
      
      <!-- Transparen Overlay to close dropdowns -->
      <div v-if="openDropdown" class="fixed inset-0 z-30" @click="closeDropdowns"></div>

      <div class="flex flex-col lg:flex-row gap-2 relative z-40">
        
        <!-- Row 1 Mobile / Flex start Desktop -->
        <div class="flex gap-2 flex-grow lg:flex-grow-0 items-center justify-between">
          <!-- Semana -->
          <div class="relative flex-1 lg:w-40 min-w-0">
            <div @click="toggleDropdown('week')" class="w-full h-9 flex items-center justify-between bg-gray-50 border border-gray-200 text-gray-700 text-[11px] md:text-sm font-semibold rounded-full focus:ring-2 focus:ring-main/50 px-2.5 md:px-3 transition-colors cursor-pointer shadow-sm hover:bg-gray-100">
              <span class="truncate">{{ selectedWeek === 'ALL' ? 'Semanas' : 'S: ' + selectedWeek }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </div>
            <div v-show="openDropdown === 'week'" class="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-60 overflow-y-auto">
              <div v-for="w in availableWeeks" :key="w" @click="selectedWeek = w; closeDropdowns()" class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-sm text-gray-700">
                <span :class="{'font-bold text-main': selectedWeek === w}">{{ w === 'ALL' ? 'Todas las Semanas' : 'Semana ' + w }}</span>
                <Check v-if="selectedWeek === w" class="w-4 h-4 text-main shrink-0 ml-2" />
              </div>
            </div>
          </div>

          <!-- Area -->
          <div class="relative flex-1 lg:w-40 min-w-0">
            <div @click="toggleDropdown('area')" class="w-full h-9 flex items-center justify-between bg-gray-50 border border-gray-200 text-gray-700 text-[11px] md:text-sm font-semibold rounded-full focus:ring-2 focus:ring-main/50 px-2.5 md:px-3 transition-colors cursor-pointer shadow-sm hover:bg-gray-100">
              <span class="truncate">{{ selectedArea === 'ALL' ? 'Áreas' : selectedArea }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </div>
            <div v-show="openDropdown === 'area'" class="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-60 overflow-y-auto">
              <div v-for="a in availableAreas" :key="a" @click="selectedArea = a; closeDropdowns()" class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-sm text-gray-700">
                <span :class="{'font-bold text-main': selectedArea === a}" class="truncate">{{ a === 'ALL' ? 'Todas las Áreas' : a }}</span>
                <Check v-if="selectedArea === a" class="w-4 h-4 text-main shrink-0 ml-2" />
              </div>
            </div>
          </div>

          <!-- Estado -->
          <div class="relative flex-1 lg:w-40 min-w-0">
             <div @click="toggleDropdown('estatus')" class="w-full h-9 flex items-center justify-between bg-gray-50 border border-gray-200 text-gray-700 text-[11px] md:text-sm font-semibold rounded-full focus:ring-2 focus:ring-main/50 px-2.5 md:px-3 transition-colors cursor-pointer shadow-sm hover:bg-gray-100">
              <span class="truncate">{{ selectedEstatus === 'ALL' ? 'Estados' : selectedEstatus }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </div>
            <div v-show="openDropdown === 'estatus'" class="absolute right-0 lg:left-0 lg:right-auto top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-60 overflow-y-auto">
              <div v-for="e in availableEstatus" :key="e" @click="selectedEstatus = e; closeDropdowns()" class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-sm text-gray-700">
                <span :class="{'font-bold text-main': selectedEstatus === e}" class="truncate">{{ e === 'ALL' ? 'Todos los Estados' : e }}</span>
                <Check v-if="selectedEstatus === e" class="w-4 h-4 text-main shrink-0 ml-2" />
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2 Mobile / Flex end Desktop -->
        <div class="flex gap-2 flex-grow lg:flex-1 items-center min-w-0">
          <div class="relative flex-1 min-w-0">
            <input 
              type="text" 
              v-model="searchQueryInput" 
              @input="handleSearchInput"
              placeholder="Buscar equipo..." 
              class="w-full h-9 bg-white border border-gray-200 text-gray-700 text-[11px] md:text-sm font-semibold rounded-full focus:ring-2 focus:ring-main/50 block px-3 md:px-4 shadow-sm transition-colors truncate placeholder:text-gray-400"
            />
          </div>
          <button @click="clearFilters" class="shrink-0 h-9 w-9 flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-500 hover:border-red-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 shadow-sm" title="Limpiar Filtros">
             <FilterX class="w-4 h-4" />
          </button>
        </div>

      </div>
    </div> <!-- END STICKY -->

    <!-- KPIs Horas por Estado (NOW NON-STICKY) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center items-center">
            <span class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Retrasada</span>
            <span class="text-2xl font-bold text-gray-900">{{ kpiData.retrasada }}<span class="text-sm font-medium text-gray-500 ml-1">hrs</span></span>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center items-center">
            <span class="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-1">En Proceso</span>
            <span class="text-2xl font-bold text-gray-900">{{ kpiData.proceso }}<span class="text-sm font-medium text-gray-500 ml-1">hrs</span></span>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center items-center">
            <span class="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Concluida</span>
            <span class="text-2xl font-bold text-gray-900">{{ kpiData.concluida }}<span class="text-sm font-medium text-gray-500 ml-1">hrs</span></span>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center items-center">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ausencia</span>
            <span class="text-2xl font-bold text-gray-900">{{ kpiData.ausencia }}<span class="text-sm font-medium text-gray-500 ml-1">hrs</span></span>
        </div>
      </div>

    <!-- MAIN CHARTS ROW 1 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- 1) Stacked Bar -->
      <div class="bg-white py-6 px-0 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-gray-200/50 shadow-sm flex flex-col min-h-[400px]">
        <h3 class="px-4 lg:px-0 text-xs font-black text-gray-400 mb-6 lg:mb-10 flex items-center gap-2 uppercase tracking-[0.2em]">
          <div class="w-2 h-2 rounded-full bg-main"></div>
          Horas por Semana (Estado)
        </h3>
        <div class="flex-1 w-full h-[320px] lg:h-auto overflow-hidden">
          <EChart :option="stackedBarOption" class="w-full h-full" />
        </div>
      </div>

      <!-- 2) Horizontal Bar (Top Equipo) -->
      <div class="bg-white py-6 px-0 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-gray-200/50 shadow-sm flex flex-col min-h-[400px]">
        <h3 class="px-4 lg:px-0 text-xs font-black text-gray-400 mb-6 lg:mb-10 flex items-center gap-2 uppercase tracking-[0.2em]">
          <div class="w-2 h-2 rounded-full bg-red-400"></div>
          Equipos más Críticos (Top 10)
        </h3>
        <div class="flex-1 w-full h-[320px] lg:h-auto overflow-hidden">
          <EChart :option="equipoOption" class="w-full h-full" />
        </div>
      </div>

    </div>

    <!-- MAIN CHARTS ROW 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- 3) Horizontal Bar (Area) -->
      <div class="bg-white py-6 px-0 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-gray-200/50 shadow-sm flex flex-col min-h-[400px] lg:col-span-2">
        <h3 class="px-4 lg:px-0 text-xs font-black text-gray-400 mb-6 lg:mb-10 flex items-center gap-2 uppercase tracking-[0.2em]">
          <div class="w-2 h-2 rounded-full bg-warning"></div>
          Impacto por Área
        </h3>
        <div class="flex-1 w-full h-[320px] lg:h-auto overflow-hidden">
          <EChart :option="areaOption" class="w-full h-full" />
        </div>
      </div>

    </div>

    <!-- 5) SMART TABLE -->
    <div class="bg-white py-6 px-0 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-gray-200/50 shadow-sm overflow-hidden flex flex-col mb-8">
      <div class="px-4 lg:px-0 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h3 class="text-xs font-black text-gray-400 flex items-center gap-2 uppercase tracking-[0.2em]">
          <div class="w-2 h-2 rounded-full bg-[#1e293b]"></div>
          Detalle Operativo (Solo Retrasadas)
        </h3>
        <div class="text-[10px] font-black uppercase tracking-widest text-[#1e293b] bg-gray-100/80 px-4 py-2 rounded-full border border-gray-200/60 shadow-inner">
           {{ retrasadasData.length }} registros
        </div>
      </div>

      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" class="px-6 py-4 font-semibold">Semana</th>
              <th scope="col" class="px-6 py-4 font-semibold">Área</th>
              <th scope="col" class="px-6 py-4 font-semibold">Equipo</th>
              <th scope="col" class="px-6 py-4 font-semibold">Orden</th>
              <th scope="col" class="px-6 py-4 font-semibold">Estado</th>
              <th scope="col" class="px-6 py-4 font-semibold text-right">Hrs Calc.</th>
              <th scope="col" class="px-6 py-4 font-semibold">Causa Retraso</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading" class="bg-white border-b hover:bg-gray-50/50">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                 Cargando datos...
              </td>
            </tr>
            <tr v-else-if="retrasadasData.length === 0" class="bg-white border-b hover:bg-gray-50/50">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                 No se encontraron registros para los filtros seleccionados.
              </td>
            </tr>
            <tr v-else v-for="row in retrasadasData.slice(0, 100)" :key="row.id_registro" class="bg-white border-b hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-3 whitespace-nowrap text-gray-600">{{ row.semana_inicio }}</td>
              <td class="px-6 py-3 text-gray-900 font-medium">{{ row.area }}</td>
              <td class="px-6 py-3 text-gray-700">{{ row.equipo }}</td>
              <td class="px-6 py-3 text-gray-500 text-xs">{{ row.descripcion_orden }}</td>
              <td class="px-6 py-3">
                 <span class="px-2.5 py-1 text-xs font-semibold rounded-full border"
                       :style="{
                         backgroundColor: getOrderStatusColor(row.estatus).background,
                         color: getOrderStatusColor(row.estatus).text,
                         borderColor: getOrderStatusColor(row.estatus).text + '40'
                       }">
                    {{ row.estatus }}
                 </span>
              </td>
              <td class="px-6 py-3 text-right font-medium text-gray-900">{{ row.horas_calculadas }}</td>
              <td class="px-6 py-3 text-gray-500 text-xs max-w-xs truncate" :title="row.causa_retraso || ''">
                 {{ row.causa_retraso || '-' }}
              </td>
            </tr>
            <tr v-if="retrasadasData.length > 100">
               <td colspan="7" class="px-6 py-3 text-center text-xs text-gray-400 bg-gray-50">
                  Mostrando primeros 100 resultados de {{ retrasadasData.length }}. Use los filtros para afinar la búsqueda.
               </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MOBILE CARDS -->
      <div class="px-4 lg:px-0 md:hidden flex flex-col gap-4 mt-4">
        <div v-if="store.loading" class="text-center text-gray-500 py-8">Cargando datos...</div>
        <div v-else-if="retrasadasData.length === 0" class="text-center text-gray-500 py-8">No se encontraron registros.</div>
        <div v-else v-for="row in retrasadasData.slice(0, 100)" :key="row.id_registro" class="bg-gray-50/50 border text-sm border-gray-200 p-5 rounded-[1.5rem] shadow-[inset_0_1px_3px_rgb(255_255_255_/_50%)]">
           <div class="flex justify-between items-start mb-3 gap-2">
             <div class="overflow-hidden">
                <div class="font-bold text-gray-900 truncate">{{ row.equipo || 'Sin Equipo' }}</div>
                <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">{{ formatAreaLabel(row.area) }} • Sem {{ row.semana_inicio }}</div>
             </div>
             <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border flex-shrink-0"
                   :style="{
                     backgroundColor: getOrderStatusColor(row.estatus).background,
                     color: getOrderStatusColor(row.estatus).text,
                     borderColor: getOrderStatusColor(row.estatus).text + '40'
                   }">
                {{ row.estatus }}
             </span>
           </div>
           
           <div class="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 text-xs bg-white rounded-xl p-3 border border-gray-100">
             <div class="flex flex-col overflow-hidden">
               <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orden</span>
               <span class="font-semibold text-gray-900 truncate">{{ row.descripcion_orden || '-' }}</span>
             </div>
             <div class="flex flex-col text-right overflow-hidden">
               <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hrs Calc.</span>
               <span class="font-black text-gray-900">{{ row.horas_calculadas }}</span>
             </div>
           </div>
           
           <div class="mt-3 text-xs pt-2" v-if="row.causa_retraso">
              <span class="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">Causa Retraso</span>
              <p class="text-gray-600 leading-relaxed">{{ row.causa_retraso }}</p>
           </div>
        </div>
        <div v-if="retrasadasData.length > 100" class="text-center text-xs font-semibold tracking-wide text-gray-400 bg-gray-50/50 border border-gray-200 py-3 rounded-full mt-2">
            Mostrando primeros 100 de {{ retrasadasData.length }}
        </div>
      </div>
    </div>

  </div>
</template>
