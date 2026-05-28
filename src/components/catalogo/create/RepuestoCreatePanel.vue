<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Loader2, Save, X } from 'lucide-vue-next';

import { useRepuestosStore } from '@/stores/dbequipos/repuestos/repuestos.store';
import type { RepuestoCaptura } from '@/stores/dbequipos/repuestos/repuestos.types';

import CatalogFormSection from '@/components/catalogo/create/CatalogFormSection.vue';
import CatalogTextField from '@/components/catalogo/create/CatalogTextField.vue';
import CatalogSelectField from '@/components/catalogo/create/CatalogSelectField.vue';
import CatalogImageUpload from '@/components/catalogo/create/CatalogImageUpload.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', value: RepuestoCaptura): void;
}>();

const repuestosStore = useRepuestosStore();

const {
  opcionesSistemas,
  opcionesCategorias,
  opcionesCriticidades,
  opcionesEstados,
  opcionesUnidades,
  opcionesProveedores,
  opcionesTiposCodigo
} = storeToRefs(repuestosStore);

type RepuestoForm = Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'>;

const createEmptyForm = (): RepuestoForm => ({
  tipo_equipo: '',
  modelo: '',
  sistema: '',
  nombre_repuesto: '',
  categoria: null,
  criticidad: null,
  estado: 'Activo',
  codigo_original: '',
  codigo_proveedor: '',
  tipo_codigo_proveedor: null,
  nombre_proveedor: null,
  unidad: null,
  cantidad_requerida: null,
  descripcion_corta: null,
  descripcion_detallada: null,
  imagen_1: null,
  imagen_2: null,
  observacion: null,
  creado_por: null
});

const form = reactive<RepuestoForm>(createEmptyForm());
const cantidadText = ref('');
const isSaving = ref(false);
const errors = reactive<Record<string, string>>({});

const estadoOptions = computed(() => {
  const base = opcionesEstados.value.length > 0
    ? opcionesEstados.value
    : ['Activo', 'Bajo stock', 'Sin stock'];

  return base.includes('Activo') ? base : ['Activo', ...base];
});

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    delete errors[key];
  });
};

const resetForm = () => {
  Object.assign(form, createEmptyForm());
  cantidadText.value = '';
  clearErrors();
};

const nullableText = (value: string | null | undefined) => {
  const cleanValue = value?.trim();

  return cleanValue ? cleanValue : null;
};

const validateForm = () => {
  clearErrors();

  if (!form.tipo_equipo.trim()) {
    errors.tipo_equipo = 'El tipo de equipo es obligatorio.';
  }

  if (!form.modelo.trim()) {
    errors.modelo = 'El modelo es obligatorio.';
  }

  if (!form.sistema.trim()) {
    errors.sistema = 'El sistema es obligatorio.';
  }

  if (!form.nombre_repuesto.trim()) {
    errors.nombre_repuesto = 'El nombre del repuesto es obligatorio.';
  }

  if (!form.estado?.trim()) {
    errors.estado = 'El estado es obligatorio.';
  }

  if (!form.codigo_original.trim()) {
    errors.codigo_original = 'El código original es obligatorio.';
  }

  if (!form.codigo_proveedor.trim()) {
    errors.codigo_proveedor = 'El código de proveedor es obligatorio.';
  }

  const cantidadValue = cantidadText.value.trim();

  if (cantidadValue) {
    const parsedCantidad = Number(cantidadValue);

    if (Number.isNaN(parsedCantidad) || parsedCantidad < 0) {
      errors.cantidad_requerida = 'La cantidad debe ser un número válido.';
    }
  }

  return Object.keys(errors).length === 0;
};

const closePanel = () => {
  if (isSaving.value) return;

  resetForm();
  emit('close');
};

const handleImageError = (message: string) => {
  errors.imagen = message;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  const parsedCantidad = cantidadText.value.trim()
    ? Number(cantidadText.value)
    : null;

  const payload: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'> = {
    tipo_equipo: form.tipo_equipo.trim(),
    modelo: form.modelo.trim(),
    sistema: form.sistema.trim(),
    nombre_repuesto: form.nombre_repuesto.trim(),
    categoria: nullableText(form.categoria),
    criticidad: nullableText(form.criticidad),
    estado: form.estado?.trim() || 'Activo',
    codigo_original: form.codigo_original.trim(),
    codigo_proveedor: form.codigo_proveedor.trim(),
    tipo_codigo_proveedor: nullableText(form.tipo_codigo_proveedor),
    nombre_proveedor: nullableText(form.nombre_proveedor),
    unidad: nullableText(form.unidad),
    cantidad_requerida: parsedCantidad,
    descripcion_corta: nullableText(form.descripcion_corta),
    descripcion_detallada: nullableText(form.descripcion_detallada),
    imagen_1: form.imagen_1 || null,
    imagen_2: form.imagen_2 || null,
    observacion: nullableText(form.observacion),
    creado_por: nullableText(form.creado_por)
  };

  try {
    isSaving.value = true;

    const saved = await repuestosStore.guardarRepuestoCaptura(payload);

    emit('saved', saved);
    resetForm();
    emit('close');
  } catch (error) {
    console.error('Error guardando repuesto:', error);
    errors.general = 'No se pudo guardar el repuesto. Intenta nuevamente.';
  } finally {
    isSaving.value = false;
  }
};

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      await repuestosStore.cargarCatalogos();
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[70] flex justify-end bg-black/45 backdrop-blur-[1px]"
        @click.self="closePanel"
      >
        <aside
          class="drawer-panel flex h-full w-full flex-col bg-white shadow-2xl lg:w-[760px] lg:max-w-[760px]"
        >
          <!-- Header -->
          <header class="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 md:px-7 lg:px-8">
            <div>
              <h2 class="text-xl font-bold tracking-tight text-gray-900">
                Nuevo repuesto
              </h2>
              <p class="mt-1 text-xs text-gray-500">
                Completa la información para registrar el repuesto en el catálogo.
              </p>
            </div>

            <button
              type="button"
              class="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              @click="closePanel"
            >
              <X class="h-5 w-5" />
            </button>
          </header>

          <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSubmit">
            <!-- Body -->
            <main class="flex-1 space-y-7 overflow-y-auto px-5 py-5 md:px-7 lg:px-8">
              <div
                v-if="errors.general"
                class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {{ errors.general }}
              </div>

              <CatalogFormSection title="Información general">
                <CatalogTextField
                  v-model="form.tipo_equipo"
                  label="Tipo de equipo"
                  placeholder="Ej. Tractor, cosechadora..."
                  required
                  :error="errors.tipo_equipo"
                />

                <CatalogTextField
                  v-model="form.modelo"
                  label="Modelo"
                  placeholder="Ej. JD 6403"
                  required
                  :error="errors.modelo"
                />

                <CatalogSelectField
                  v-model="form.sistema"
                  label="Sistema"
                  placeholder="Seleccionar sistema"
                  required
                  :options="opcionesSistemas"
                  :error="errors.sistema"
                />

                <CatalogTextField
                  v-model="form.nombre_repuesto"
                  label="Nombre del repuesto"
                  placeholder="Ej. Filtro hidráulico"
                  required
                  :error="errors.nombre_repuesto"
                />

                <CatalogSelectField
                  v-model="form.categoria"
                  label="Categoría"
                  placeholder="Seleccionar categoría"
                  :options="opcionesCategorias"
                  :error="errors.categoria"
                />

                <CatalogSelectField
                  v-model="form.estado"
                  label="Estado"
                  placeholder="Seleccionar estado"
                  required
                  :options="estadoOptions"
                  :error="errors.estado"
                />

                <CatalogSelectField
                  v-model="form.criticidad"
                  label="Criticidad"
                  placeholder="Seleccionar criticidad"
                  :options="opcionesCriticidades"
                  :error="errors.criticidad"
                />
              </CatalogFormSection>

              <CatalogFormSection title="Códigos">
                <CatalogTextField
                  v-model="form.codigo_original"
                  label="Código original"
                  placeholder="Ej. CAT-1R-1808"
                  required
                  :error="errors.codigo_original"
                />

                <CatalogTextField
                  v-model="form.codigo_proveedor"
                  label="Código de proveedor"
                  placeholder="Ej. PROV-45678"
                  required
                  :error="errors.codigo_proveedor"
                />

                <CatalogSelectField
                  v-model="form.tipo_codigo_proveedor"
                  label="Tipo de código proveedor"
                  placeholder="Seleccionar tipo"
                  :options="opcionesTiposCodigo"
                  :error="errors.tipo_codigo_proveedor"
                />
              </CatalogFormSection>

              <CatalogFormSection title="Proveedor y unidad">
                <CatalogSelectField
                  v-model="form.nombre_proveedor"
                  label="Proveedor"
                  placeholder="Seleccionar proveedor"
                  :options="opcionesProveedores"
                  :error="errors.nombre_proveedor"
                />

                <CatalogSelectField
                  v-model="form.unidad"
                  label="Unidad"
                  placeholder="Seleccionar unidad"
                  :options="opcionesUnidades"
                  :error="errors.unidad"
                />

                <CatalogTextField
                  v-model="cantidadText"
                  label="Cantidad requerida"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  :error="errors.cantidad_requerida"
                />
              </CatalogFormSection>

              <CatalogFormSection title="Detalles">
                <CatalogTextField
                  v-model="form.descripcion_corta"
                  class="md:col-span-2"
                  label="Descripción corta"
                  placeholder="Descripción breve del repuesto..."
                  :error="errors.descripcion_corta"
                />

                <CatalogTextField
                  v-model="form.descripcion_detallada"
                  class="md:col-span-2"
                  label="Descripción detallada"
                  placeholder="Detalles técnicos, compatibilidad, uso..."
                  textarea
                  :rows="4"
                  :error="errors.descripcion_detallada"
                />

                <CatalogImageUpload
                  v-model="form.imagen_1"
                  label="Imagen 1"
                  :error="errors.imagen"
                  @error="handleImageError"
                />

                <CatalogImageUpload
                  v-model="form.imagen_2"
                  label="Imagen 2"
                  :error="errors.imagen"
                  @error="handleImageError"
                />

                <CatalogTextField
                  v-model="form.observacion"
                  class="md:col-span-2"
                  label="Observación"
                  placeholder="Observaciones internas..."
                  textarea
                  :rows="3"
                  :error="errors.observacion"
                />
              </CatalogFormSection>
            </main>

            <!-- Footer -->
            <footer
              class="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100
                     bg-white/95 px-5 py-4 backdrop-blur md:px-7 sm:flex-row sm:justify-end lg:px-8"
            >
              <button
                type="button"
                class="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700
                       transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSaving"
                @click="closePanel"
              >
                Cancelar
              </button>

              <button
                type="submit"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-main px-6 py-2.5
                       text-sm font-semibold text-white shadow-sm transition hover:bg-main-light
                       disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="isSaving"
              >
                <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
                <Save v-else class="h-4 w-4" />
                Guardar
              </button>
            </footer>
          </form>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 180ms ease;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 220ms ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>