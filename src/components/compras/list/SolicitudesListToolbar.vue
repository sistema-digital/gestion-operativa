<script setup lang="ts">
import { computed } from 'vue';
import {
  ListFilter,
  Plus,
  Search,
} from 'lucide-vue-next';

import type { SolicitudCompraListFilters } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

interface EstadoOption {
  value: string | null;
  label: string;
}

interface PrioridadOption {
  value: string | null;
  label: string;
}

const props = defineProps<{
  filters: SolicitudCompraListFilters;
  loading: boolean;
  searching: boolean;
  isMobile: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:estado', value: string | null): void;
  (e: 'update:prioridad', value: string | null): void;
  (e: 'update:fechaDesde', value: string | null): void;
  (e: 'update:fechaHasta', value: string | null): void;
  (e: 'update:soloBloqueadas', value: boolean): void;
  (e: 'update:soloDiferenciaOc', value: boolean): void;
  (e: 'create'): void;
  (e: 'openMobileFilters'): void;
}>();

const estadoOptions: EstadoOption[] = [
  { value: null, label: 'Todos estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'para_revision_almacen', label: 'Para revisión almacén' },
  { value: 'en_revision_almacen', label: 'En revisión almacén' },
  { value: 'para_revision_supervisor', label: 'Para revisión supervisor' },
  { value: 'en_revision_supervisor', label: 'En revisión supervisor' },
  { value: 'para_revision_gerencia', label: 'Para revisión gerencia' },
  { value: 'en_revision_gerencia', label: 'En revisión gerencia' },
  { value: 'aprobado_gerencia', label: 'Aprobado gerencia' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'subido_sistema_compra', label: 'Subido a sistema' },
  { value: 'orden_compra', label: 'Orden de compra' },
];

const prioridadOptions: PrioridadOption[] = [
  { value: null, label: 'Todas prioridades' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'baja', label: 'Baja' },
];

const desktopSearchPlaceholder = 'Buscar por folio, observación, equipo u orden de compra';
const mobileSearchPlaceholder = 'Buscar folio, observación o equipo';

const normalizedEstadoValue = computed(() => props.filters.estadoCodigo ?? '');
const normalizedPrioridadValue = computed(() => props.filters.prioridadCodigo ?? '');
const onSearchInput = (event: Event): void => {
  emit('update:search', (event.target as HTMLInputElement).value);
};

const onEstadoChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:estado', value || null);
};

const onPrioridadChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:prioridad', value || null);
};

const onFechaDesdeChange = (event: Event): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:fechaDesde', value || null);
};

const onFechaHastaChange = (event: Event): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:fechaHasta', value || null);
};

const onSoloBloqueadasChange = (event: Event): void => {
  emit('update:soloBloqueadas', (event.target as HTMLInputElement).checked);
};

const onSoloDiferenciaOcChange = (event: Event): void => {
  emit('update:soloDiferenciaOc', (event.target as HTMLInputElement).checked);
};
</script>

<template>
  <section
    class="rounded-2xl border border-stone-300 bg-white/90 shadow-sm backdrop-blur"
    :class="isMobile ? 'p-3' : 'p-4'"
  >
    <div v-if="isMobile" class="flex items-center gap-3">
      <label
        class="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 transition focus-within:border-stone-400 focus-within:bg-white"
      >
        <Search class="h-4 w-4 shrink-0 text-stone-400" />
        <input
          :value="filters.busqueda"
          type="search"
          :placeholder="mobileSearchPlaceholder"
          class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          @input="onSearchInput"
        >
      </label>

      <button
        type="button"
        class="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        @click="emit('openMobileFilters')"
      >
        <ListFilter class="h-4 w-4" />
        <span>Filtros</span>
      </button>
    </div>

    <div v-else class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div class="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.15fr)] xl:grid-cols-[minmax(0,1.8fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <label class="flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
          <Search class="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <input
            :value="filters.busqueda"
            type="search"
            :placeholder="desktopSearchPlaceholder"
            class="w-full bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400"
            @input="onSearchInput"
          >
        </label>

        <label class="flex h-9 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
          <select
            :value="normalizedEstadoValue"
            class="w-full cursor-pointer bg-transparent text-xs text-stone-900 outline-none"
            @change="onEstadoChange"
          >
            <option
              v-for="option in estadoOptions"
              :key="option.value ?? 'all-estados'"
              :value="option.value ?? ''"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="flex h-9 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
          <select
            :value="normalizedPrioridadValue"
            class="w-full cursor-pointer bg-transparent text-xs text-stone-900 outline-none"
            @change="onPrioridadChange"
          >
            <option
              v-for="option in prioridadOptions"
              :key="option.value ?? 'all-prioridades'"
              :value="option.value ?? ''"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <div class="grid grid-cols-2 gap-2">
          <label class="flex h-9 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
            <input
              :value="filters.fechaDesde ?? ''"
              type="date"
              class="w-full bg-transparent text-xs text-stone-900 outline-none"
              @input="onFechaDesdeChange"
            >
          </label>

          <label class="flex h-9 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
            <input
              :value="filters.fechaHasta ?? ''"
              type="date"
              class="w-full bg-transparent text-xs text-stone-900 outline-none"
              @input="onFechaHastaChange"
            >
          </label>
        </div>
      </div>

      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between xl:shrink-0">
        <div class="flex flex-col gap-2 xl:max-w-[17rem]">
          <label class="inline-flex items-center gap-2 text-xs text-stone-700">
            <input
              :checked="filters.soloBloqueadas"
              type="checkbox"
              class="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
              @change="onSoloBloqueadasChange"
            >
            <span>Bloqueadas</span>
          </label>

          <label class="inline-flex items-center gap-2 text-xs text-stone-700">
            <input
              :checked="filters.soloDiferenciaOc"
              type="checkbox"
              class="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
              @change="onSoloDiferenciaOcChange"
            >
            <span>Diferencia OC</span>
          </label>
        </div>

        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-main bg-main px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-main-light"
          @click="emit('create')"
        >
          <Plus class="h-3.5 w-3.5" />
          <span>Crear</span>
        </button>
      </div>
    </div>
  </section>
</template>
