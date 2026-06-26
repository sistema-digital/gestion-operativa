<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
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
import type {
  RepuestoCaptura,
  RepuestoImagenesFirmadas
} from '@/stores/dbequipos/repuestos/repuestos.types';
import { formatArrayValue } from '@/stores/dbequipos/repuestos/repuestos.helpers';
import { useRepuestosStore } from '@/stores/dbequipos/repuestos/repuestos.store';
import {
  getCurrentUserIdentity,
  resolveCreatedByDisplay,
  type CurrentUserIdentity
} from '@/utils/createdBy';

const props = defineProps<{
  isOpen: boolean;
  repuesto: RepuestoCaptura | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const repuestosStore = useRepuestosStore();
const createdByDisplay = ref('Sistema');
const currentUserIdentity = ref<CurrentUserIdentity>({
  email: '',
  nombre: ''
});
const signedImages = reactive<RepuestoImagenesFirmadas>({
  miniaturaUrl: null,
  frenteUrl: null,
  ladoUrl: null,
  puestaUrl: null,
  extraUrl: null,
  originales: []
});
const imageReadError = ref('');

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

watch(
  () => [props.isOpen, props.repuesto] as const,
  async ([open, repuesto]) => {
    if (!open || !repuesto) return;

    currentUserIdentity.value = await getCurrentUserIdentity();
    createdByDisplay.value = await resolveCreatedByDisplay(
      repuesto.creado_por,
      currentUserIdentity.value
    );

    const { images: resolvedImages, errors } = await repuestosStore.resolverImagenesFirmadas(repuesto);
    Object.assign(signedImages, resolvedImages);
    imageReadError.value = errors.join(' ');
  },
  { immediate: true }
);
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm transition-opacity"
        @click="emit('close')"
      ></div>
    </transition>

    <transition name="slide">
      <div
        v-if="isOpen && repuesto"
        class="fixed inset-y-0 right-0 z-[110] flex w-full flex-col border-l border-gray-200 bg-gray-50 shadow-2xl md:w-[600px] lg:w-[800px]"
      >
        <header class="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl border border-main/20 bg-main/10 text-main">
              <Box class="h-6 w-6" />
            </div>
            <div>
              <h2 class="text-xl font-bold leading-tight text-gray-900">
                {{ repuesto.nombre_repuesto }}
              </h2>
              <div class="mt-1 flex items-center gap-3 text-sm">
                <span class="font-mono text-gray-500">{{ repuesto.codigo_original || 'S/N' }}</span>
                <span class="h-1 w-1 rounded-full bg-gray-300"></span>
                <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  {{ repuesto.estado || 'Activo' }}
                </span>
              </div>
            </div>
          </div>
          <button
            class="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            @click="emit('close')"
          >
            <X class="h-6 w-6" />
          </button>
        </header>

        <div class="flex-1 space-y-6 overflow-y-auto p-6">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
                <Info class="h-4 w-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-800">Información Principal</h3>
              </div>
              <div class="space-y-4 p-4">
                <div>
                  <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Tipo de Equipo / Modelo</p>
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatArrayValue(repuesto.tipo_equipo) || '-' }}
                    <span
                      v-if="formatArrayValue(repuesto.modelo)"
                      class="font-normal text-gray-400"
                    >
                      | {{ formatArrayValue(repuesto.modelo) }}
                    </span>
                  </p>
                </div>
                <div>
                  <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Categoría</p>
                  <p class="text-sm font-medium text-gray-900">{{ repuesto.categoria || '-' }}</p>
                </div>
                <div>
                  <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Sistema</p>
                  <p class="text-sm font-medium text-gray-900">{{ repuesto.sistema || '-' }}</p>
                </div>
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
                <Hash class="h-4 w-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-800">Códigos y Proveedor</h3>
              </div>
              <div class="space-y-4 p-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Cód. Original</p>
                    <p class="text-sm font-mono font-medium text-gray-900">{{ repuesto.codigo_original || '-' }}</p>
                  </div>
                  <div>
                    <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Cód. Almacén</p>
                    <p class="text-sm font-mono font-medium text-gray-900">{{ repuesto.codigo_almacen || '-' }}</p>
                  </div>
                </div>
                <div>
                  <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Cód. Proveedor</p>
                  <p class="text-sm font-mono font-medium text-gray-900">{{ repuesto.codigo_proveedor || '-' }}</p>
                </div>
                <div>
                  <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Proveedor / Marca</p>
                  <div class="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Truck class="h-4 w-4 text-gray-400" />
                    {{ repuesto.nombre_proveedor || '-' }}
                  </div>
                </div>
                <div v-if="repuesto.tipo_codigo_proveedor">
                  <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Tipo de Código</p>
                  <p class="text-sm text-gray-700">{{ repuesto.tipo_codigo_proveedor }}</p>
                </div>
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
                <AlertCircle class="h-4 w-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-800">Especificaciones Operativas</h3>
              </div>
              <div class="space-y-4 p-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Criticidad</p>
                    <span
                      class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                      :class="getCriticidadClass(repuesto.criticidad)"
                    >
                      {{ repuesto.criticidad || 'No def.' }}
                    </span>
                  </div>
                  <div>
                    <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Cant. Requerida</p>
                    <p class="text-lg font-bold text-gray-900">
                      {{ repuesto.cantidad_requerida || '-' }}
                      <span class="text-sm font-medium text-gray-500">{{ repuesto.unidad || '' }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
                <Calendar class="h-4 w-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-800">Registro y Auditoría</h3>
              </div>
              <div class="space-y-4 p-4">
                <div>
                  <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Creado Por</p>
                  <p class="text-sm font-medium text-gray-900">{{ createdByDisplay }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Fecha Creación</p>
                    <p class="text-xs text-gray-700">{{ formatDate(repuesto.created_at) }}</p>
                  </div>
                  <div>
                    <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Últ. Actualización</p>
                    <p class="text-xs text-gray-700">{{ formatDate(repuesto.updated_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
              <Tag class="h-4 w-4 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-800">Descripciones</h3>
            </div>
            <div class="space-y-5 p-4">
              <div v-if="repuesto.descripcion_detallada">
                <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Descripción Detallada</p>
                <div class="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {{ repuesto.descripcion_detallada }}
                </div>
              </div>
              <div v-if="repuesto.observacion">
                <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Observaciones</p>
                <p class="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                  {{ repuesto.observacion }}
                </p>
              </div>
              <div
                v-if="!repuesto.descripcion_detallada && !repuesto.observacion"
                class="py-4 text-center text-sm italic text-gray-400"
              >
                No hay descripciones registradas para este repuesto.
              </div>
            </div>
          </div>

          <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3">
              <ImageIcon class="h-4 w-4 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-800">Imágenes Adjuntas</h3>
            </div>

            <div class="space-y-5 p-4">
              <div
                v-if="imageReadError"
                class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
              >
                {{ imageReadError }}
              </div>

              <div>
                <span class="text-xs font-medium uppercase tracking-wider text-gray-500">Miniatura principal</span>
                <div class="mt-2 flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <img
                    v-if="signedImages.miniaturaUrl"
                    :src="signedImages.miniaturaUrl"
                    alt="Miniatura del repuesto"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex flex-col items-center justify-center text-center text-gray-400"
                  >
                    <ImageIcon class="mb-2 h-8 w-8 opacity-50" />
                    <span class="text-xs font-medium">Sin miniatura</span>
                  </div>
                </div>
              </div>

              <div>
                <span class="text-xs font-medium uppercase tracking-wider text-gray-500">Galería original</span>
                <div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    v-for="image in signedImages.originales"
                    :key="image.slot"
                    class="flex flex-col gap-2"
                  >
                    <span class="text-xs font-semibold capitalize text-gray-600">{{ image.slot }}</span>
                    <div class="group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      <img
                        v-if="image.url"
                        :src="image.url"
                        :alt="`Imagen ${image.slot}`"
                        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div
                        v-else
                        class="flex flex-col items-center justify-center text-center text-gray-400"
                      >
                        <ImageIcon class="mb-2 h-8 w-8 opacity-50" />
                        <span class="text-xs font-medium">Imagen no disponible</span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="signedImages.originales.length === 0"
                    class="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No hay imágenes originales registradas para este repuesto.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white p-4 px-6">
          <button
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            @click="emit('delete', repuesto.id!)"
          >
            <Trash2 class="h-4 w-4" />
            Eliminar
          </button>

          <button
            class="flex items-center gap-2 rounded-lg bg-main px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-main-light"
            @click="emit('edit', repuesto.id!)"
          >
            <Edit class="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 220ms ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
