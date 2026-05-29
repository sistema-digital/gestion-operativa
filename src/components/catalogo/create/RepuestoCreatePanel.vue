<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Loader2, Save, X } from 'lucide-vue-next';

import { useRepuestosStore } from '@/stores/dbequipos/repuestos/repuestos.store';
import type {
  CatalogTableName,
  RepuestoCaptura
} from '@/stores/dbequipos/repuestos/repuestos.types';

import CatalogFormSection from '@/components/catalogo/create/CatalogFormSection.vue';
import CatalogTextField from '@/components/catalogo/create/CatalogTextField.vue';
import CatalogSuggestionField from '@/components/catalogo/create/CatalogSuggestionField.vue';
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
  repuestosCaptura,
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

const uniqueValues = (values: Array<string | null | undefined>) => {
  return values
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim())
    .filter((value, index, array) => {
      return array.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index;
    })
    .sort((a, b) => a.localeCompare(b));
};

const opcionesTipoEquipo = computed(() => {
  return uniqueValues(repuestosCaptura.value.map((item) => item.tipo_equipo));
});

const opcionesModelo = computed(() => {
  return uniqueValues(repuestosCaptura.value.map((item) => item.modelo));
});

const opcionesNombreRepuesto = computed(() => {
  return uniqueValues(repuestosCaptura.value.map((item) => item.nombre_repuesto));
});

const estadoOptions = computed(() => {
  const base = opcionesEstados.value.length > 0
    ? opcionesEstados.value
    : ['Activo', 'Bajo stock', 'Sin stock', 'Inactivo'];

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

const ensureCatalogValue = async (
  tableName: CatalogTableName,
  value: string | null | undefined
) => {
  const cleanValue = nullableText(value);

  if (!cleanValue) return null;

  return await repuestosStore.asegurarValorCatalogo(tableName, cleanValue);
};

const closePanel = () => {
  if (isSaving.value) return;

  resetForm();
  emit('close');
};

const handleImageError = (field: 'imagen_1' | 'imagen_2', message: string) => {
  errors[field] = message;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    isSaving.value = true;
    clearErrors();

    const parsedCantidad = cantidadText.value.trim()
      ? Number(cantidadText.value)
      : null;

    const sistema = await repuestosStore.asegurarValorCatalogo(
      'repuesto_sistema',
      form.sistema.trim()
    );

    const estado = await repuestosStore.asegurarValorCatalogo(
      'repuesto_estado',
      form.estado?.trim() || 'Activo'
    );

    const categoria = await ensureCatalogValue(
      'repuesto_categoria',
      form.categoria
    );

    const criticidad = await ensureCatalogValue(
      'repuesto_criticidad',
      form.criticidad
    );

    const unidad = await ensureCatalogValue(
      'repuesto_unidad',
      form.unidad
    );

    const nombreProveedor = await ensureCatalogValue(
      'repuesto_proveedor',
      form.nombre_proveedor
    );

    const tipoCodigoProveedor = await ensureCatalogValue(
      'repuesto_tipo_codigo_proveedor',
      form.tipo_codigo_proveedor
    );

    const payload: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'> = {
      tipo_equipo: form.tipo_equipo.trim(),
      modelo: form.modelo.trim(),
      sistema,
      nombre_repuesto: form.nombre_repuesto.trim(),
      categoria,
      criticidad,
      estado,
      codigo_original: form.codigo_original.trim(),
      codigo_proveedor: form.codigo_proveedor.trim(),
      tipo_codigo_proveedor: tipoCodigoProveedor,
      nombre_proveedor: nombreProveedor,
      unidad,
      cantidad_requerida: parsedCantidad,
      descripcion_corta: nullableText(form.descripcion_corta),
      descripcion_detallada: nullableText(form.descripcion_detallada),
      imagen_1: form.imagen_1 || null,
      imagen_2: form.imagen_2 || null,
      observacion: nullableText(form.observacion),
      creado_por: nullableText(form.creado_por)
    };

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
      await Promise.all([
        repuestosStore.cargarCatalogos(),
        repuestosStore.cargarRepuestosCaptura()
      ]);
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

          <form
            class="flex min-h-0 flex-1 flex-col"
            @submit.prevent="handleSubmit"
          >
            <!-- Body -->
            <main class="flex-1 space-y-7 overflow-y-auto px-5 py-5 md:px-7 lg:px-8">
              <div
                v-if="errors.general"
                class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {{ errors.general }}
              </div>

              <CatalogFormSection title="Información general">
                <CatalogSuggestionField
                  v-model="form.tipo_equipo"
                  label="Tipo de equipo"
                  placeholder="Escribe o selecciona tipo de equipo"
                  required
                  :suggestions="opcionesTipoEquipo"
                  :error="errors.tipo_equipo"
                />

                <CatalogSuggestionField
                  v-model="form.modelo"
                  label="Modelo"
                  placeholder="Escribe o selecciona modelo"
                  required
                  :suggestions="opcionesModelo"
                  :error="errors.modelo"
                />

                <CatalogSuggestionField
                  v-model="form.sistema"
                  label="Sistema"
                  placeholder="Escribe o selecciona sistema"
                  required
                  :suggestions="opcionesSistemas"
                  :error="errors.sistema"
                />

                <CatalogSuggestionField
                  v-model="form.nombre_repuesto"
                  label="Nombre del repuesto"
                  placeholder="Escribe el nombre del repuesto"
                  required
                  :suggestions="opcionesNombreRepuesto"
                  :error="errors.nombre_repuesto"
                />

                <CatalogSuggestionField
                  v-model="form.categoria"
                  label="Categoría"
                  placeholder="Escribe o selecciona categoría"
                  :suggestions="opcionesCategorias"
                  :error="errors.categoria"
                />

                <CatalogSuggestionField
                  v-model="form.estado"
                  label="Estado"
                  placeholder="Escribe o selecciona estado"
                  required
                  :suggestions="estadoOptions"
                  :error="errors.estado"
                />

                <CatalogSuggestionField
                  v-model="form.criticidad"
                  label="Criticidad"
                  placeholder="Escribe o selecciona criticidad"
                  :suggestions="opcionesCriticidades"
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

                <CatalogSuggestionField
                  v-model="form.tipo_codigo_proveedor"
                  label="Tipo de código proveedor"
                  placeholder="Escribe o selecciona tipo"
                  :suggestions="opcionesTiposCodigo"
                  :error="errors.tipo_codigo_proveedor"
                />
              </CatalogFormSection>

              <CatalogFormSection title="Proveedor y unidad">
                <CatalogSuggestionField
                  v-model="form.nombre_proveedor"
                  label="Proveedor"
                  placeholder="Escribe o selecciona proveedor"
                  :suggestions="opcionesProveedores"
                  :error="errors.nombre_proveedor"
                />

                <CatalogSuggestionField
                  v-model="form.unidad"
                  label="Unidad"
                  placeholder="Escribe o selecciona unidad"
                  :suggestions="opcionesUnidades"
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
                  :error="errors.imagen_1"
                  @error="(message) => handleImageError('imagen_1', message)"
                />

                <CatalogImageUpload
                  v-model="form.imagen_2"
                  label="Imagen 2"
                  :error="errors.imagen_2"
                  @error="(message) => handleImageError('imagen_2', message)"
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

                <CatalogTextField
                  v-model="form.creado_por"
                  class="md:col-span-2"
                  label="Creado por"
                  placeholder="Usuario responsable..."
                  :error="errors.creado_por"
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
                <Loader2
                  v-if="isSaving"
                  class="h-4 w-4 animate-spin"
                />

                <Save
                  v-else
                  class="h-4 w-4"
                />

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