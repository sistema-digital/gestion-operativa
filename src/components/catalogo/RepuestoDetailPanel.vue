<script setup lang="ts">
import { computed } from 'vue';
import { 
  X, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Info,
  Tag,
  Hash,
  Box,
  Truck,
  Calendar,
  AlertCircle
} from 'lucide-vue-next';
import type { RepuestoCaptura } from '@/stores/dbequipos/repuestos/repuestos.types';

const props = defineProps<{
  isOpen: boolean;
  repuesto: RepuestoCaptura | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

// Helpers de formateo
const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getCriticidadClass = (criticidad: string | null | undefined) => {
  if (!criticidad) return 'bg-gray-100 text-gray-700';
  const val = criticidad.toLowerCase();
  if (val.includes('alta') || val.includes('crítica')) return 'bg-red-100 text-red-800';
  if (val.includes('media')) return 'bg-amber-100 text-amber-800';
  if (val.includes('baja')) return 'bg-emerald-100 text-emerald-800';
  return 'bg-gray-100 text-gray-700';
};
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop superpuesto -->
    <transition name="fade">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] transition-opacity"
        @click="emit('close')"
      ></div>
    </transition>

    <!-- Panel lateral (Slide-over) -->
    <transition name="slide">
      <div 
        v-if="isOpen && repuesto" 
        class="fixed inset-y-0 right-0 z-[110] w-full md:w-[600px] lg:w-[800px] bg-gray-50 flex flex-col shadow-2xl border-l border-gray-200"
      >
        <!-- Header -->
        <header class="bg-white px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-main/10 rounded-xl flex items-center justify-center text-main border border-main/20">
              <Box class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 leading-tight">{{ repuesto.nombre_repuesto }}</h2>
              <div class="flex items-center gap-3 mt-1 text-sm">
                <span class="text-gray-500 font-mono">{{ repuesto.codigo_original || 'S/N' }}</span>
                <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {{ repuesto.estado || 'Activo' }}
                </span>
              </div>
            </div>
          </div>
          <button 
            @click="emit('close')"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </header>

        <!-- Body (Scrollable content) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Grid Principal de Datos -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Bloque: Información Principal -->
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <Info class="w-4 h-4 text-gray-500" />
                <h3 class="font-semibold text-gray-800 text-sm">Información Principal</h3>
              </div>
              <div class="p-4 space-y-4">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tipo de Equipo / Modelo</p>
                  <p class="text-sm font-medium text-gray-900">{{ repuesto.tipo_equipo }} <span v-if="repuesto.modelo" class="text-gray-400 font-normal">| {{ repuesto.modelo }}</span></p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Categoría</p>
                  <p class="text-sm font-medium text-gray-900">{{ repuesto.categoria || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Sistema</p>
                  <p class="text-sm font-medium text-gray-900">{{ repuesto.sistema || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Bloque: Códigos y Proveedor -->
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <Hash class="w-4 h-4 text-gray-500" />
                <h3 class="font-semibold text-gray-800 text-sm">Códigos y Proveedor</h3>
              </div>
              <div class="p-4 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cód. Original</p>
                    <p class="text-sm font-mono font-medium text-gray-900">{{ repuesto.codigo_original || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cód. Proveedor</p>
                    <p class="text-sm font-mono font-medium text-gray-900">{{ repuesto.codigo_proveedor || '-' }}</p>
                  </div>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Proveedor / Marca</p>
                  <div class="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Truck class="w-4 h-4 text-gray-400" />
                    {{ repuesto.nombre_proveedor || '-' }}
                  </div>
                </div>
                <div v-if="repuesto.tipo_codigo_proveedor">
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tipo de Código</p>
                  <p class="text-sm text-gray-700">{{ repuesto.tipo_codigo_proveedor }}</p>
                </div>
              </div>
            </div>

            <!-- Bloque: Especificaciones Técnicas -->
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <AlertCircle class="w-4 h-4 text-gray-500" />
                <h3 class="font-semibold text-gray-800 text-sm">Especificaciones Operativas</h3>
              </div>
              <div class="p-4 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Criticidad</p>
                    <span 
                      class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"
                      :class="getCriticidadClass(repuesto.criticidad)"
                    >
                      {{ repuesto.criticidad || 'No def.' }}
                    </span>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cant. Requerida</p>
                    <p class="text-lg font-bold text-gray-900">
                      {{ repuesto.cantidad_requerida || '-' }} 
                      <span class="text-sm font-medium text-gray-500">{{ repuesto.unidad || '' }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bloque: Auditoría -->
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <Calendar class="w-4 h-4 text-gray-500" />
                <h3 class="font-semibold text-gray-800 text-sm">Registro y Auditoría</h3>
              </div>
              <div class="p-4 space-y-4">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Creado Por</p>
                  <p class="text-sm font-medium text-gray-900">{{ repuesto.creado_por || 'Sistema' }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fecha Creación</p>
                    <p class="text-xs text-gray-700">{{ formatDate(repuesto.created_at) }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Últ. Actualización</p>
                    <p class="text-xs text-gray-700">{{ formatDate(repuesto.updated_at) }}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Bloque: Descripciones y Observaciones (Ancho completo) -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <Tag class="w-4 h-4 text-gray-500" />
              <h3 class="font-semibold text-gray-800 text-sm">Descripciones</h3>
            </div>
            <div class="p-4 space-y-5">
              <div v-if="repuesto.descripcion_corta">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Descripción Corta</p>
                <p class="text-sm text-gray-800">{{ repuesto.descripcion_corta }}</p>
              </div>
              <div v-if="repuesto.descripcion_detallada">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Descripción Detallada</p>
                <div class="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {{ repuesto.descripcion_detallada }}
                </div>
              </div>
              <div v-if="repuesto.observacion">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Observaciones</p>
                <p class="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  {{ repuesto.observacion }}
                </p>
              </div>
              <div v-if="!repuesto.descripcion_corta && !repuesto.descripcion_detallada && !repuesto.observacion" class="text-center py-4 text-gray-400 text-sm italic">
                No hay descripciones registradas para este repuesto.
              </div>
            </div>
          </div>

          <!-- Bloque: Imágenes -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <ImageIcon class="w-4 h-4 text-gray-500" />
              <h3 class="font-semibold text-gray-800 text-sm">Imágenes Adjuntas</h3>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <!-- Imagen 1 -->
              <div class="flex flex-col gap-2">
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen Principal</span>
                <div class="aspect-video bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center relative group">
                  <img 
                    v-if="repuesto.imagen_1" 
                    :src="repuesto.imagen_1" 
                    alt="Imagen Principal" 
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div v-else class="text-center flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon class="w-8 h-8 mb-2 opacity-50" />
                    <span class="text-xs font-medium">Sin imagen</span>
                  </div>
                </div>
              </div>

              <!-- Imagen 2 -->
              <div class="flex flex-col gap-2">
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen Secundaria</span>
                <div class="aspect-video bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center relative group">
                  <img 
                    v-if="repuesto.imagen_2" 
                    :src="repuesto.imagen_2" 
                    alt="Imagen Secundaria" 
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div v-else class="text-center flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon class="w-8 h-8 mb-2 opacity-50" />
                    <span class="text-xs font-medium">Sin imagen</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- Footer / Actions -->
        <div class="bg-white border-t border-gray-200 p-4 px-6 flex items-center justify-end gap-3 shrink-0">
          <button 
            @click="emit('delete', repuesto.id!)"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            Eliminar
          </button>
          <button 
            @click="emit('edit', repuesto.id!)"
            class="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-main text-white hover:bg-main-light rounded-lg transition-colors shadow-sm"
          >
            <Edit class="w-4 h-4" />
            Editar Repuesto
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>