<script setup lang="ts">
import { computed, reactive } from 'vue';

import type {
  ProductoSolicitudItem,
  ServicioSolicitudItem,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompraCrear.types';

const props = defineProps<{
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  productosError?: string;
  serviciosError?: string;
}>();

const emit = defineEmits<{
  (e: 'add-producto-temporal', value: {
    descripcion: string;
    unidadCodigo: string;
    unidadLabel: string;
    notas: string;
  }): void;
  (e: 'remove-producto', localId: string): void;
  (e: 'add-servicio', value: {
    descripcion: string;
    unidadCodigo: string;
    unidadLabel: string;
    notas: string;
  }): void;
  (e: 'remove-servicio', localId: string): void;
}>();

const lineForm = reactive({
  descripcion: '',
  unidadCodigo: '',
  unidadLabel: '',
  notas: '',
});

const isServicio = computed(() => props.tipoSolicitud === 'servicio');
const sectionTitle = computed(() => isServicio.value ? 'Paso 2 · Servicios' : 'Paso 2 · Productos');
const sectionDescription = computed(() => isServicio.value
  ? 'Agrega líneas de servicio para esta solicitud.'
  : 'Agrega líneas de producto para esta solicitud.'
);
const formLabel = computed(() => isServicio.value ? 'Descripción del servicio' : 'Descripción del producto');
const codeLabel = computed(() => isServicio.value ? 'Unidad del servicio' : 'Unidad del producto');
const countLabel = computed(() => isServicio.value
  ? `Servicios agregados actualmente: ${props.servicios.length}`
  : `Productos agregados actualmente: ${props.productos.length}`
);
const fieldError = computed(() => isServicio.value ? props.serviciosError : props.productosError);
const activeItems = computed(() => isServicio.value
  ? props.servicios.map((item) => ({
    localId: item.localId,
    title: item.descripcion,
    subtitle: `${item.unidadLabel} (${item.unidadCodigo})`,
    badge: 'Servicio',
  }))
  : props.productos.map((item) => ({
    localId: item.localId,
    title: item.tipo === 'existente' ? `${item.codProducto} · ${item.descripcion}` : item.descripcion,
    subtitle: `${item.unidadLabel} (${item.unidadCodigo})`,
    badge: item.tipo === 'existente' ? 'Existente' : 'Temporal',
  }))
);

const resetForm = (): void => {
  lineForm.descripcion = '';
  lineForm.unidadCodigo = '';
  lineForm.unidadLabel = '';
  lineForm.notas = '';
};

const onAddLine = (): void => {
  const descripcion = lineForm.descripcion.trim();
  const unidadCodigo = lineForm.unidadCodigo.trim();
  const unidadLabel = lineForm.unidadLabel.trim() || unidadCodigo;

  if (!descripcion || !unidadCodigo) {
    return;
  }

  const payload = {
    descripcion,
    unidadCodigo,
    unidadLabel,
    notas: lineForm.notas.trim(),
  };

  if (isServicio.value) {
    emit('add-servicio', payload);
  } else {
    emit('add-producto-temporal', payload);
  }

  resetForm();
};

const onRemoveLine = (localId: string): void => {
  if (isServicio.value) {
    emit('remove-servicio', localId);
    return;
  }

  emit('remove-producto', localId);
};
</script>

<template>
  <section class="flex h-full flex-col rounded-lg border border-stone-200 bg-white px-3 py-4 shadow-sm md:px-4">
    <h3 class="text-base font-bold text-main">
      {{ sectionTitle }}
    </h3>
    <p class="mt-1 text-sm text-stone-500">
      {{ sectionDescription }}
    </p>

    <div class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
      <label class="space-y-1">
        <span class="block text-xs font-semibold text-stone-800">{{ formLabel }}</span>
        <input
          v-model="lineForm.descripcion"
          type="text"
          class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none"
          :placeholder="isServicio ? 'Ej. Servicio de torno' : 'Ej. Empaque para tapa de válvula'"
        >
      </label>

      <label class="space-y-1">
        <span class="block text-xs font-semibold text-stone-800">{{ codeLabel }}</span>
        <input
          v-model="lineForm.unidadCodigo"
          type="text"
          class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none"
          :placeholder="isServicio ? 'servicio' : 'UND'"
        >
      </label>

      <label class="space-y-1">
        <span class="block text-xs font-semibold text-stone-800">Etiqueta unidad</span>
        <input
          v-model="lineForm.unidadLabel"
          type="text"
          class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none"
          :placeholder="isServicio ? 'Servicio' : 'Unidad'"
        >
      </label>
    </div>

    <label class="mt-3 block space-y-1">
      <span class="block text-xs font-semibold text-stone-800">Notas opcionales</span>
      <textarea
        v-model="lineForm.notas"
        rows="2"
        class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none"
        placeholder="Notas opcionales para esta línea"
      />
    </label>

    <div class="mt-3 flex justify-end">
      <button
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-main-dark shadow-sm transition hover:bg-accent-light"
        @click="onAddLine"
      >
        Agregar línea
      </button>
    </div>

    <div class="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4">
      <p class="text-sm font-medium text-stone-700">
        {{ countLabel }}
      </p>
      <p class="mt-2 text-sm text-stone-500">
        {{ isServicio
          ? 'Las solicitudes de servicio enviarán líneas en p_servicios.'
          : 'Las solicitudes de producto enviarán líneas en p_productos.' }}
      </p>

      <p
        v-if="fieldError"
        class="mt-2 text-sm font-medium text-danger"
      >
        {{ fieldError }}
      </p>
    </div>

    <div
      v-if="activeItems.length > 0"
      class="mt-4 space-y-2"
    >
      <div
        v-for="item in activeItems"
        :key="item.localId"
        class="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-3"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-stone-900">
            {{ item.title }}
          </p>
          <p class="mt-1 text-xs text-stone-500">
            {{ item.subtitle }}
          </p>
          <span class="mt-2 inline-flex rounded-md bg-main/8 px-2 py-1 text-[11px] font-semibold text-main">
            {{ item.badge }}
          </span>
        </div>

        <button
          type="button"
          class="rounded-md border border-stone-200 px-2 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          @click="onRemoveLine(item.localId)"
        >
          Eliminar
        </button>
      </div>
    </div>
  </section>
</template>
