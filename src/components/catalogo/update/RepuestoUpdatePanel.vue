<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Loader2, Save, X } from 'lucide-vue-next';

import { useRepuestosStore } from '@/stores/dbequipos/repuestos/repuestos.store';
import {
  getCurrentUserIdentity,
  resolveCreatedByDisplay,
  type CurrentUserIdentity
} from '@/utils/createdBy';
import type {
  CatalogTableName,
  RepuestoCaptura
} from '@/stores/dbequipos/repuestos/repuestos.types';

import UpdateFormSection from '@/components/catalogo/update/UpdateFormSection.vue';
import UpdateSelectField from '@/components/catalogo/update/UpdateSelectField.vue';
import UpdateTextField from '@/components/catalogo/update/UpdateTextField.vue';
import UpdateSuggestionField from '@/components/catalogo/update/UpdateSuggestionField.vue';
import UpdateImageUpload from '@/components/catalogo/update/UpdateImageUpload.vue';

const props = defineProps<{
  isOpen: boolean;
  repuesto: RepuestoCaptura | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', value: RepuestoCaptura): void;
}>();

const repuestosStore = useRepuestosStore();

const {
  opcionesSistemas,
  opcionesCategorias,
  opcionesCriticidades,
  opcionesUnidades,
  opcionesProveedores,
  opcionesTiposCodigo
} = storeToRefs(repuestosStore);

type UpdateForm = {
  id: string;
  tipo_equipo: string;
  modelo: string;
  sistema: string;
  nombre_repuesto: string;
  categoria: string;
  criticidad: string;
  estado: string;
  codigo_original: string;
  codigo_proveedor: string;
  tipo_codigo_proveedor: string;
  nombre_proveedor: string;
  unidad: string;
  descripcion_detallada: string;
  imagen_1: string | null;
  imagen_2: string | null;
  observacion: string;
  creado_por: string;
};

const createEmptyForm = (): UpdateForm => ({
  id: '',
  tipo_equipo: '',
  modelo: '',
  sistema: '',
  nombre_repuesto: '',
  categoria: '',
  criticidad: '',
  estado: 'Activo',
  codigo_original: '',
  codigo_proveedor: '',
  tipo_codigo_proveedor: 'Original',
  nombre_proveedor: '',
  unidad: '',
  descripcion_detallada: '',
  imagen_1: null,
  imagen_2: null,
  observacion: '',
  creado_por: ''
});

const form = reactive<UpdateForm>(createEmptyForm());

const cantidadText = ref('');
const isSaving = ref(false);
const errors = reactive<Record<string, string>>({});
const createdByDisplay = ref('Sistema');
const currentUserIdentity = ref<CurrentUserIdentity>({
  email: '',
  nombre: ''
});

const criticidadOptions = computed(() => {
  return opcionesCriticidades.value;
});

const tipoCodigoProveedorOptions = computed(() => {
  const base = opcionesTiposCodigo.value.length > 0
    ? opcionesTiposCodigo.value
    : ['Original', 'Generico'];

  const uniqueOptions = Array.from(new Set(base.map((item) => item.trim()).filter(Boolean)));

  return uniqueOptions.includes('Original')
    ? uniqueOptions
    : ['Original', ...uniqueOptions];
});

const isGenericProviderCode = computed(() => {
  return form.tipo_codigo_proveedor.trim().toLowerCase() === 'generico';
});

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    delete errors[key];
  });
};

const nullableText = (value: string | null | undefined) => {
  const cleanValue = value?.trim();

  return cleanValue ? cleanValue : null;
};

const fillForm = (repuesto: RepuestoCaptura | null) => {
  clearErrors();

  if (!repuesto) {
    Object.assign(form, createEmptyForm());
    cantidadText.value = '';
    createdByDisplay.value = 'Sistema';
    return;
  }

  form.id = repuesto.id ?? '';
  form.tipo_equipo = repuesto.tipo_equipo ?? '';
  form.modelo = repuesto.modelo ?? '';
  form.sistema = repuesto.sistema ?? '';
  form.nombre_repuesto = repuesto.nombre_repuesto ?? '';
  form.categoria = repuesto.categoria ?? '';
  form.criticidad = repuesto.criticidad ?? '';
  form.estado = repuesto.estado ?? 'Activo';
  form.codigo_original = repuesto.codigo_original ?? '';
  form.codigo_proveedor = repuesto.codigo_proveedor ?? '';
  form.tipo_codigo_proveedor = repuesto.tipo_codigo_proveedor ?? 'Original';
  form.nombre_proveedor = repuesto.nombre_proveedor ?? '';
  form.unidad = repuesto.unidad ?? '';
  form.descripcion_detallada = repuesto.descripcion_detallada ?? '';
  form.imagen_1 = repuesto.imagen_1 ?? null;
  form.imagen_2 = repuesto.imagen_2 ?? null;
  form.observacion = repuesto.observacion ?? '';
  form.creado_por = repuesto.creado_por ?? '';

  cantidadText.value = repuesto.cantidad_requerida !== null && repuesto.cantidad_requerida !== undefined
    ? String(repuesto.cantidad_requerida)
    : '';
};

const validateForm = () => {
  clearErrors();

  if (!form.id) {
    errors.general = 'No se encontró el ID del repuesto.';
  }

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

  if (!form.estado.trim()) {
    errors.estado = 'El estado es obligatorio.';
  }

  if (!form.codigo_original.trim()) {
    errors.codigo_original = 'El código original es obligatorio.';
  }

  if (!form.tipo_codigo_proveedor.trim()) {
    errors.tipo_codigo_proveedor = 'El tipo de código proveedor es obligatorio.';
  }

  if (isGenericProviderCode.value && !form.codigo_proveedor.trim()) {
    errors.codigo_proveedor = 'El código de proveedor es obligatorio.';
  }

  const cantidadValue = cantidadText.value;

  if (cantidadValue !== '') {
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

  clearErrors();
  emit('close');
};

const handleImageError = (field: 'imagen_1' | 'imagen_2', message: string) => {
  errors[field] = message;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  const parsedCantidad = cantidadText.value !== ''
    ? Number(cantidadText.value)
    : null;

  try {
    isSaving.value = true;
    clearErrors();

    const codigoOriginal = form.codigo_original.trim();
    const codigoProveedor = isGenericProviderCode.value
      ? form.codigo_proveedor.trim()
      : codigoOriginal;

    const sistema = await repuestosStore.asegurarValorCatalogo(
      'repuesto_sistema',
      form.sistema.trim()
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

    const payload: Partial<RepuestoCaptura> = {
      tipo_equipo: form.tipo_equipo.trim(),
      modelo: form.modelo.trim(),
      sistema,
      nombre_repuesto: form.nombre_repuesto.trim(),
      categoria,
      criticidad,
      estado: form.estado.trim() || 'Activo',
      codigo_original: codigoOriginal,
      codigo_proveedor: codigoProveedor,
      tipo_codigo_proveedor: tipoCodigoProveedor,
      nombre_proveedor: nombreProveedor,
      unidad,
      cantidad_requerida: parsedCantidad,
      descripcion_detallada: nullableText(form.descripcion_detallada),
      imagen_1: form.imagen_1 || null,
      imagen_2: form.imagen_2 || null,
      observacion: nullableText(form.observacion)
    };

    const updated = await repuestosStore.actualizarRepuestoCaptura(
      form.id,
      payload
    );

    emit('updated', updated);
    emit('close');
  } catch (error) {
    console.error('Error actualizando repuesto:', error);
    errors.general = 'No se pudo actualizar el repuesto. Intenta nuevamente.';
  } finally {
    isSaving.value = false;
  }
};

watch(
  () => [props.isOpen, props.repuesto] as const,
  async ([open, repuesto]) => {
    if (!open) return;

    await repuestosStore.cargarCatalogos();
    currentUserIdentity.value = await getCurrentUserIdentity();
    fillForm(repuesto);
    createdByDisplay.value = await resolveCreatedByDisplay(
      repuesto?.creado_por,
      currentUserIdentity.value
    );
  },
  { immediate: true }
);

watch(
  () => [form.tipo_codigo_proveedor, form.codigo_original] as const,
  ([tipoCodigoProveedor, codigoOriginal]) => {
    if (tipoCodigoProveedor.trim().toLowerCase() !== 'generico') {
      form.codigo_proveedor = codigoOriginal;
    }
  },
  { immediate: true }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[75] flex justify-end bg-black/45 backdrop-blur-[1px]"
        @click.self="closePanel"
      >
        <aside
          class="drawer-panel flex h-full w-full flex-col bg-white shadow-2xl lg:w-[760px] lg:max-w-[760px]"
        >
          <!-- Header -->
          <header class="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 md:px-7 lg:px-8">
            <div>
              <h2 class="text-xl font-bold tracking-tight text-gray-900">
                Actualizar repuesto
              </h2>

              <p class="mt-1 text-xs text-gray-500">
                Modifica la información del repuesto seleccionado.
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

              <UpdateFormSection title="Información general">
                <UpdateTextField
                  v-model="form.tipo_equipo"
                  label="Tipo de equipo"
                  placeholder="Ej. Tractor, cosechadora..."
                  required
                  :error="errors.tipo_equipo"
                />

                <UpdateTextField
                  v-model="form.modelo"
                  label="Modelo"
                  placeholder="Ej. JD 6403"
                  required
                  :error="errors.modelo"
                />

                <UpdateSuggestionField
                  v-model="form.sistema"
                  label="Sistema"
                  placeholder="Escribe o selecciona sistema"
                  required
                  :suggestions="opcionesSistemas"
                  :error="errors.sistema"
                />

                <UpdateTextField
                  v-model="form.nombre_repuesto"
                  label="Nombre del repuesto"
                  placeholder="Ej. Filtro hidráulico"
                  required
                  :error="errors.nombre_repuesto"
                />

                <UpdateSuggestionField
                  v-model="form.categoria"
                  label="Categoría"
                  placeholder="Escribe o selecciona categoría"
                  :suggestions="opcionesCategorias"
                  :error="errors.categoria"
                />

                <UpdateTextField
                  v-model="form.estado"
                  label="Estado"
                  disabled
                  required
                  :error="errors.estado"
                />

                <UpdateSelectField
                  v-model="form.criticidad"
                  label="Criticidad"
                  placeholder="Selecciona criticidad"
                  :options="criticidadOptions"
                  :error="errors.criticidad"
                />
              </UpdateFormSection>

              <UpdateFormSection title="Códigos">
                <UpdateTextField
                  v-model="form.codigo_original"
                  label="Código original"
                  placeholder="Ej. CAT-1R-1808"
                  required
                  :error="errors.codigo_original"
                />

                <UpdateSelectField
                  v-model="form.tipo_codigo_proveedor"
                  label="Tipo de código proveedor"
                  placeholder="Selecciona tipo"
                  required
                  :options="tipoCodigoProveedorOptions"
                  :error="errors.tipo_codigo_proveedor"
                />

                <UpdateTextField
                  v-if="isGenericProviderCode"
                  v-model="form.codigo_proveedor"
                  label="Código de proveedor"
                  placeholder="Ej. PROV-45678"
                  required
                  :error="errors.codigo_proveedor"
                />
              </UpdateFormSection>

              <UpdateFormSection title="Proveedor y unidad">
                <UpdateSuggestionField
                  v-model="form.nombre_proveedor"
                  label="Proveedor"
                  placeholder="Escribe o selecciona proveedor"
                  :suggestions="opcionesProveedores"
                  :error="errors.nombre_proveedor"
                />

                <UpdateSuggestionField
                  v-model="form.unidad"
                  label="Unidad"
                  placeholder="Escribe o selecciona unidad"
                  :suggestions="opcionesUnidades"
                  :error="errors.unidad"
                />

                <UpdateTextField
                  v-model="cantidadText"
                  label="Cantidad requerida"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  :error="errors.cantidad_requerida"
                />
              </UpdateFormSection>

              <UpdateFormSection title="Detalles">
                <UpdateTextField
                  v-model="form.descripcion_detallada"
                  class="md:col-span-2"
                  label="Descripción detallada"
                  placeholder="Detalles técnicos, compatibilidad, uso..."
                  textarea
                  :rows="4"
                  :error="errors.descripcion_detallada"
                />

                <UpdateImageUpload
                  v-model="form.imagen_1"
                  label="Imagen 1"
                  :error="errors.imagen_1"
                  @error="(message) => handleImageError('imagen_1', message)"
                />

                <UpdateImageUpload
                  v-model="form.imagen_2"
                  label="Imagen 2"
                  :error="errors.imagen_2"
                  @error="(message) => handleImageError('imagen_2', message)"
                />

                <UpdateTextField
                  v-model="form.observacion"
                  class="md:col-span-2"
                  label="Observación"
                  placeholder="Observaciones internas..."
                  textarea
                  :rows="3"
                  :error="errors.observacion"
                />

                <UpdateTextField
                  :model-value="createdByDisplay"
                  class="md:col-span-2"
                  label="Creado por"
                  disabled
                />
              </UpdateFormSection>
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

                Actualizar
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
