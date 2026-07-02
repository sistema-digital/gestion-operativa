<script setup lang="ts">
import { LoaderCircle, Search, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';

import CrearSolicitudEquipoChip from './CrearSolicitudEquipoChip.vue';
import type { CatalogoContextoDestinoOption } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.types';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import type { DestinoSeleccionado } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

type NormalizedServiceSourceRow =
  | {
    key: string;
    source: 'contexto';
    item: CatalogoContextoDestinoOption;
    label: string;
    tipoOrigen: CatalogoContextoDestinoOption['tipoOrigen'];
    selected: boolean;
    conflict: boolean;
  }
  | {
    key: string;
    source: 'equipo';
    item: EquipoOption;
    label: string;
    tipoOrigen: 'equipo';
    selected: boolean;
    conflict: boolean;
  };

const props = defineProps<{
  selectedItems: DestinoSeleccionado[];
  contextOptions: CatalogoContextoDestinoOption[];
  equipmentSearchResults: EquipoOption[];
  isLoading: boolean;
  isSearchingEquipment: boolean;
  loadError: string | null;
  searchError: string | null;
  fieldError?: string;
}>();

const emit = defineEmits<{
  (e: 'add', item: CatalogoContextoDestinoOption): void;
  (e: 'add:equipo', item: EquipoOption): void;
  (e: 'remove', payload: { codigo: string; tipoOrigen?: string }): void;
  (e: 'search:equipos', value: string): void;
}>();

const query = shallowRef('');
const isFocused = shallowRef(false);
let blurTimer: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const selectedCodes = computed(() => new Set(props.selectedItems.map((item) => `${item.tipoOrigen}:${item.codigo}`)));
const selectedTipoOrigen = computed(() => props.selectedItems[0]?.tipoOrigen ?? null);
const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase());
const hasEquipmentSearchTerm = computed(() => normalizedQuery.value.length >= 3);

watch(query, (value) => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  const normalizedValue = value.trim();

  debounceTimer = setTimeout(() => {
    emit('search:equipos', normalizedValue.length >= 3 ? normalizedValue : '');
  }, 300);
});

const contextRows = computed<NormalizedServiceSourceRow[]>(() => {
  return props.contextOptions
    .filter((item) => (
      !normalizedQuery.value
      || item.nombre.toLocaleLowerCase().includes(normalizedQuery.value)
    ))
    .map((item) => ({
      key: `contexto-${item.codigo}`,
      source: 'contexto' as const,
      item,
      label: item.nombre,
      tipoOrigen: item.tipoOrigen,
      selected: selectedCodes.value.has(`${item.tipoOrigen}:${item.codigo}`),
      conflict: selectedTipoOrigen.value !== null && selectedTipoOrigen.value !== item.tipoOrigen,
    }));
});

const equipmentRows = computed<NormalizedServiceSourceRow[]>(() => props.equipmentSearchResults
  .map((item) => ({
    key: `equipo-${item.codEquipo}`,
    source: 'equipo' as const,
    item,
    label: item.label,
    tipoOrigen: 'equipo',
    selected: selectedCodes.value.has(`equipo:${item.codEquipo}`),
    conflict: selectedTipoOrigen.value !== null && selectedTipoOrigen.value !== 'equipo',
  })));

const rows = computed<NormalizedServiceSourceRow[]>(() => {
  if (!hasEquipmentSearchTerm.value) {
    return contextRows.value;
  }

  return [
    ...contextRows.value,
    ...equipmentRows.value,
  ];
});

const shouldShowResults = computed(() =>
  isFocused.value && (!props.isLoading || contextRows.value.length > 0 || hasEquipmentSearchTerm.value)
);

const clearQuery = (): void => {
  query.value = '';
  emit('search:equipos', '');
};

const handleFocus = (): void => {
  if (blurTimer !== null) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }

  isFocused.value = true;
};

const handleBlur = (): void => {
  blurTimer = setTimeout(() => {
    isFocused.value = false;
  }, 150);
};

const handleSelectRow = (row: NormalizedServiceSourceRow): void => {
  if (row.selected) {
    return;
  }

  if (row.source === 'contexto') {
    emit('add', row.item);
    return;
  }

  emit('add:equipo', row.item);
};

onBeforeUnmount(() => {
  if (blurTimer !== null) {
    clearTimeout(blurTimer);
  }

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
});

const searchStateMessage = computed(() => {
  if (props.isLoading) {
    return 'Cargando contextos...';
  }

  if (hasEquipmentSearchTerm.value) {
    return 'No hay resultados para la búsqueda actual.';
  }

  return 'No hay destinos disponibles para este tipo de solicitud.';
});

const getRowClassName = (row: NormalizedServiceSourceRow): string => {
  if (row.conflict) {
    return 'bg-danger/8 text-danger hover:bg-danger/10';
  }

  if (row.selected) {
    return 'bg-main/8 text-main hover:bg-main/10';
  }

  return 'bg-white hover:bg-white';
};

const getRowActionLabel = (row: NormalizedServiceSourceRow): string => {
  if (row.conflict) {
    return 'Otro origen';
  }

  if (row.selected) {
    return 'Seleccionado';
  }

  return 'Agregar';
};
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3 overflow-y-auto lg:overflow-hidden">
    <label class="block text-xs font-semibold text-stone-800">
      Destino <span class="text-danger">*</span>
    </label>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 lg:overflow-hidden">
      <div class="flex min-h-0 flex-col gap-3">
        <div
          class="rounded-lg border bg-white px-3 py-2"
          :class="fieldError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
        >
          <div class="flex items-center gap-3">
            <Search class="h-5 w-5 text-stone-400" />
            <input
              v-model="query"
              type="text"
              placeholder="Buscar destino o equipo"
              class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              @focus="handleFocus"
              @blur="handleBlur"
            >
            <button
              v-if="query.trim().length > 0"
              type="button"
              class="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              @mousedown.prevent
              @click="clearQuery"
            >
              <X class="h-4 w-4" />
            </button>
            <LoaderCircle
              v-if="isSearchingEquipment || isLoading"
              class="h-4 w-4 animate-spin text-main"
            />
          </div>
          <p
            v-if="query.trim().length > 0 && query.trim().length < 3"
            class="mt-2 text-xs text-stone-500"
          >
            Puedes filtrar destinos desde el primer carácter. Para equipos, ingresa al menos 3 caracteres.
          </p>
        </div>

        <div
          v-if="selectedItems.length > 0"
          class="sticky top-0 z-40 -mt-1 rounded-lg border border-stone-200 bg-stone-50/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden"
        >
          <div class="flex flex-wrap items-start gap-2">
            <CrearSolicitudEquipoChip
              v-for="item in selectedItems"
              :key="`${item.tipoOrigen}-${item.codigo}`"
              :label="item.label"
              full-width-mobile
              @remove="emit('remove', { codigo: item.codigo, tipoOrigen: item.tipoOrigen })"
            />
          </div>
        </div>

        <div
          v-else
          class="sticky top-0 z-40 -mt-1 rounded-lg border border-dashed border-stone-300 bg-white/95 px-3 py-2 text-xs text-stone-500 shadow-sm backdrop-blur md:text-sm lg:hidden"
        >
          Aún no has seleccionado destinos.
        </div>

        <div
          id="result_search_servicios_fuentes"
          class="flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50"
          :class="shouldShowResults || isSearchingEquipment || isLoading ? 'min-h-[12rem] lg:min-h-0' : 'hidden lg:block lg:min-h-0'"
        >
          <div
            v-if="isLoading && rows.length === 0"
            class="flex h-full min-h-[12rem] items-center justify-center gap-2 px-4 text-center text-sm text-stone-500"
          >
            <LoaderCircle class="h-4 w-4 animate-spin text-main" />
            Cargando contextos...
          </div>

          <template v-else-if="shouldShowResults && rows.length > 0">
            <button
              v-for="row in rows"
              :key="row.key"
              type="button"
              class="flex w-full items-center justify-between border-b border-stone-200 px-3 py-2 text-left text-xs transition last:border-b-0"
              :class="getRowClassName(row)"
              @mousedown.prevent
              @click="handleSelectRow(row)"
            >
              <div class="min-w-0">
                <span class="block min-w-0 truncate">{{ row.label }}</span>
                <span
                  v-if="row.conflict"
                  class="mt-1 block text-[11px] font-medium text-danger/80"
                >
                  Si deseas elegir este origen, elimina primero el destino seleccionado.
                </span>
              </div>
              <span
                class="shrink-0 font-semibold"
                :class="row.conflict ? 'text-danger/80' : row.selected ? 'text-main/80' : 'text-main'"
              >
                {{ getRowActionLabel(row) }}
              </span>
            </button>
          </template>

          <div
            v-else
            class="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-stone-500"
          >
            {{ searchStateMessage }}
          </div>
        </div>
      </div>

      <div class="hidden min-h-[12rem] overflow-hidden rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 lg:block lg:min-h-0">
        <div
          v-if="selectedItems.length > 0"
          class="grid max-h-full grid-cols-2 items-start content-start gap-3 overflow-y-auto lg:grid-cols-3"
        >
          <CrearSolicitudEquipoChip
            v-for="item in selectedItems"
            :key="`${item.tipoOrigen}-${item.codigo}`"
            :label="item.label"
            @remove="emit('remove', { codigo: item.codigo, tipoOrigen: item.tipoOrigen })"
          />
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-xs text-stone-500 md:text-sm"
        >
          Aún no has seleccionado destinos.
        </div>
      </div>
    </div>

    <p
      v-if="loadError"
      class="text-sm font-medium text-danger"
    >
      {{ loadError }}
    </p>

    <p
      v-if="searchError"
      class="text-sm font-medium text-danger"
    >
      {{ searchError }}
    </p>

    <p
      v-if="fieldError"
      class="text-sm font-medium text-danger"
    >
      {{ fieldError }}
    </p>
  </div>
</template>
