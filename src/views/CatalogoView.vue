<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepuestosStore } from '@/stores/dbequipos/repuestos/repuestos.store';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Settings
} from 'lucide-vue-next';

// ==========================================
// STORE & ESTADO
// ==========================================
const repuestosStore = useRepuestosStore();
const { repuestosCaptura, isLoading } = storeToRefs(repuestosStore);

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

// Cargar datos al montar la vista
onMounted(async () => {
  await repuestosStore.cargarRepuestosCaptura();
});

// ==========================================
// FILTROS Y PAGINACIÓN
// ==========================================
const filteredRepuestos = computed(() => {
  if (!searchQuery.value) return repuestosCaptura.value;
  
  const query = searchQuery.value.toLowerCase();
  return repuestosCaptura.value.filter(item => {
    return (
      item.nombre_repuesto?.toLowerCase().includes(query) ||
      item.codigo_original?.toLowerCase().includes(query) ||
      item.codigo_proveedor?.toLowerCase().includes(query) ||
      item.categoria?.toLowerCase().includes(query) ||
      item.sistema?.toLowerCase().includes(query)
    );
  });
});

const totalItems = computed(() => filteredRepuestos.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage) || 1);

const paginatedRepuestos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredRepuestos.value.slice(start, end);
});

// Resetear a página 1 cuando se busca
const handleSearch = () => {
  currentPage.value = 1;
};

// ==========================================
// HELPERS UI
// ==========================================
const getCriticidadClass = (criticidad: string | null | undefined) => {
  if (!criticidad) return 'bg-gray-100 text-gray-700 border-gray-200';
  
  const val = criticidad.toLowerCase();
  if (val.includes('alta') || val.includes('crítica')) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (val.includes('media')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (val.includes('baja')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

// ==========================================
// ACCIONES
// ==========================================
const openAddModal = () => {
  // TODO: Implementar apertura de formulario/modal de agregar
  console.log('Abrir modal de agregar repuesto');
};

const editRepuesto = (id: string) => {
  // TODO: Implementar apertura de formulario/modal de edición
  console.log('Editar repuesto', id);
};

const deleteRepuesto = async (id: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar este repuesto? Esta acción no se puede deshacer.')) {
    try {
      await repuestosStore.eliminarRepuestoCaptura(id);
      
      if (paginatedRepuestos.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
      }
    } catch (error) {
      alert('Hubo un error al eliminar el repuesto.');
    }
  }
};
</script>

<template>
  <div class="h-full flex flex-col p-6 md:p-8 bg-second overflow-hidden">
    
    <!-- HEADER -->
    <header class="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Catálogo de Repuestos</h1>
        <p class="text-sm text-gray-500 mt-1">Gestión y visualización del inventario maestro de repuestos.</p>
      </div>
      
      <button 
        @click="openAddModal"
        class="flex items-center justify-center gap-2 bg-main text-white px-5 py-2.5 rounded-xl hover:bg-main-light transition-colors shadow-sm font-medium text-sm active:scale-95"
      >
        <Plus class="w-4 h-4" />
        Agregar Repuesto
      </button>
    </header>

    <!-- MAIN CONTENT CARD -->
    <div class="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden relative">
      
      <!-- TOOLBAR (Search) -->
      <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 bg-white z-10">
        <div class="relative w-full sm:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-4 w-4 text-gray-400" />
          </div>
          <input 
            v-model="searchQuery" 
            @input="handleSearch"
            type="text" 
            class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition-all" 
            placeholder="Buscar por nombre, código, sistema..." 
          />
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="flex-1 overflow-auto bg-white relative">
        
        <!-- Loading State Overlay -->
        <div v-if="isLoading && repuestosCaptura.length === 0" class="absolute inset-0 z-50 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 class="w-8 h-8 text-main animate-spin mb-4" />
          <p class="text-sm text-gray-500 font-medium">Cargando catálogo...</p>
        </div>

        <table class="w-full text-center border-collapse min-w-[1100px]">
          <thead class="bg-gray-50">
            <tr>
              <!-- FIXED COLUMNS HEADER (z-40 para estar sobre el scroll vertical y horizontal) -->
              <th scope="col" class="sticky top-0 left-0 z-40 w-[80px] min-w-[80px] px-2 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-gray-50 border-b border-gray-200">
                Img
              </th>
              <th scope="col" class="sticky top-0 left-[80px] z-40 min-w-[280px] max-w-[280px] px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-gray-50 border-b border-gray-200 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                Nombre del Repuesto
              </th>
              
              <!-- SCROLLABLE COLUMNS HEADER (z-30 para estar sobre el scroll vertical del cuerpo) -->
              <th scope="col" class="sticky top-0 z-30 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center bg-gray-50 border-b border-gray-200">Código (Orig. / Prov.)</th>
              <th scope="col" class="sticky top-0 z-30 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center bg-gray-50 border-b border-gray-200">Categoría / Sistema</th>
              <th scope="col" class="sticky top-0 z-30 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center bg-gray-50 border-b border-gray-200">Criticidad</th>
              <th scope="col" class="sticky top-0 z-30 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center bg-gray-50 border-b border-gray-200">Proveedor / Marca</th>
              <th scope="col" class="sticky top-0 z-30 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center bg-gray-50 border-b border-gray-200">Cant. Requerida</th>
              <th scope="col" class="sticky top-0 z-30 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center bg-gray-50 border-b border-gray-200">Opciones</th>
            </tr>
          </thead>
          <tbody class="bg-white text-center">
            
            <tr v-if="paginatedRepuestos.length === 0 && !isLoading">
              <td colspan="8" class="px-6 py-12 text-center text-gray-500 bg-white">
                <div class="flex flex-col items-center justify-center">
                  <div class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                    <Search class="w-6 h-6 text-gray-400" />
                  </div>
                  <p class="text-base font-medium text-gray-700">No se encontraron repuestos</p>
                  <p class="text-sm mt-1">Ajusta tu búsqueda o agrega un nuevo repuesto al catálogo.</p>
                </div>
              </td>
            </tr>

            <!-- Se cambió bg de hover a nivel de celda para que las columnas sticky mantengan el color -->
            <tr 
              v-for="item in paginatedRepuestos" 
              :key="item.id" 
              class="group bg-white hover:bg-gray-50 transition-colors"
            >
              <!-- 1. Imagen (FIXED) -->
              <td class="sticky left-0 z-20 w-[80px] min-w-[80px] px-2 py-3 text-center bg-white group-hover:bg-gray-50 border-b border-gray-100 transition-colors">
                <div class="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 mx-auto">
                  <img v-if="item.imagen_1" :src="item.imagen_1" alt="Repuesto" class="w-full h-full object-cover" />
                  <Settings v-else class="w-5 h-5 text-gray-300" />
                </div>
              </td>

              <!-- 2. Nombre y Equipo (FIXED con sombra derecha) -->
              <td class="sticky left-[80px] z-20 min-w-[280px] max-w-[280px] px-6 py-3 bg-white group-hover:bg-gray-50 border-b border-gray-100 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] transition-colors text-center">
                <div class="flex flex-col items-center">
                  <span class="text-sm font-semibold text-gray-900 group-hover:text-main transition-colors">{{ item.nombre_repuesto }}</span>
                  <span class="text-xs text-gray-500 mt-0.5 truncate" :title="`${item.tipo_equipo} - ${item.modelo}`">
                    {{ item.tipo_equipo }} <span v-if="item.modelo" class="mx-1">•</span> {{ item.modelo }}
                  </span>
                </div>
              </td>

              <!-- 3. Códigos (SCROLLABLE) -->
              <td class="px-6 py-3 border-b border-gray-100 text-center">
                <div class="flex flex-col items-center gap-1 text-xs">
                  <div class="flex items-center gap-1.5" title="Código Original">
                    <span class="font-medium text-gray-400 w-8">Orig:</span>
                    <span class="text-gray-700 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{{ item.codigo_original || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-1.5" title="Código Proveedor">
                    <span class="font-medium text-gray-400 w-8">Prov:</span>
                    <span class="text-gray-700 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{{ item.codigo_proveedor || '-' }}</span>
                  </div>
                </div>
              </td>

              <!-- 4. Categoría y Sistema -->
              <td class="px-6 py-3 border-b border-gray-100 text-center">
                <div class="flex flex-col items-center">
                  <span class="text-sm text-gray-700 font-medium whitespace-nowrap">{{ item.categoria || 'Sin categoría' }}</span>
                  <span class="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{{ item.sistema || 'Sin sistema' }}</span>
                </div>
              </td>

              <!-- 5. Criticidad -->
              <td class="px-6 py-3 text-center border-b border-gray-100">
                <span 
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap"
                  :class="getCriticidadClass(item.criticidad)"
                >
                  {{ item.criticidad || 'No def.' }}
                </span>
              </td>

              <!-- 6. Proveedor -->
              <td class="px-6 py-3 border-b border-gray-100 text-center">
                <span class="text-sm text-gray-700 whitespace-nowrap">{{ item.nombre_proveedor || '-' }}</span>
              </td>

              <!-- 7. Cantidad Requerida -->
              <td class="px-6 py-3 text-center border-b border-gray-100">
                <div class="flex flex-col items-center">
                  <span class="text-sm font-bold text-gray-800">{{ item.cantidad_requerida || '-' }}</span>
                  <span class="text-xs text-gray-500 font-medium uppercase tracking-wider">{{ item.unidad || '' }}</span>
                </div>
              </td>

              <!-- 8. Acciones -->
              <td class="px-6 py-3 text-center border-b border-gray-100">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="editRepuesto(item.id!)"
                    class="p-1.5 text-gray-400 hover:text-main hover:bg-main/10 rounded-lg transition-colors"
                    title="Editar repuesto"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteRepuesto(item.id!)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar repuesto"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION FOOTER -->
      <div class="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50 shrink-0 z-10">
        <p class="text-sm text-gray-500">
          Mostrando <span class="font-medium text-gray-800">{{ totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1 }}</span> a 
          <span class="font-medium text-gray-800">{{ Math.min(currentPage * itemsPerPage, totalItems) }}</span> de 
          <span class="font-medium text-gray-800">{{ totalItems }}</span> repuestos
        </p>
        
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-transparent"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          
          <div class="flex items-center gap-1">
            <button 
              v-for="page in totalPages" 
              :key="page"
              @click="currentPage = page"
              class="w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
              :class="currentPage === page ? 'bg-main text-white shadow-sm' : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-200'"
            >
              {{ page }}
            </button>
          </div>

          <button 
            @click="currentPage++" 
            :disabled="currentPage >= totalPages"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-transparent"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>