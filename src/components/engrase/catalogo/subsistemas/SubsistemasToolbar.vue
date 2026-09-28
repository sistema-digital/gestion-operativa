<script setup lang="ts">
import { computed } from "vue";
import { Eraser, Plus, Search, X } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import type {
  CatalogoSubsistemaEstado,
  CatalogoSubsistemaUso,
} from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.types";

interface Option<T extends string> {
  label: string;
  value: T;
}

const props = defineProps<{
  busqueda: string;
  estado: CatalogoSubsistemaEstado;
  uso: CatalogoSubsistemaUso;
  canClear: boolean;
  canCreate: boolean;
}>();
const emit = defineEmits<{
  updateBusqueda: [string];
  updateEstado: [CatalogoSubsistemaEstado];
  updateUso: [CatalogoSubsistemaUso];
  clear: [];
  create: [];
}>();
const estados: readonly Option<CatalogoSubsistemaEstado>[] = [
  { label: "Activos", value: "activos" },
  { label: "Desactivados", value: "desactivados" },
  { label: "Todos", value: "todos" },
];
const usos: readonly Option<CatalogoSubsistemaUso>[] = [
  { label: "Todos", value: "todos" },
  { label: "En uso", value: "en-uso" },
  { label: "Sin uso", value: "sin-uso" },
];
const estadoSeleccionado = computed<Option<CatalogoSubsistemaEstado> | null>({
  get: () => estados.find((item) => item.value === props.estado) ?? null,
  set: (item) => emit("updateEstado", item?.value ?? "activos"),
});
const usoSeleccionado = computed<Option<CatalogoSubsistemaUso> | null>({
  get: () => usos.find((item) => item.value === props.uso) ?? null,
  set: (item) => emit("updateUso", item?.value ?? "todos"),
});
</script>

<template>
  <div
    class="grid gap-2 lg:grid-cols-[minmax(230px,1fr)_170px_150px_auto_auto]"
  >
    <div class="relative min-w-0">
      <label for="subsistemas-search" class="sr-only"
        >Buscar subsistema por nombre</label
      >
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
      />
      <input
        id="subsistemas-search"
        :value="busqueda"
        type="search"
        autocomplete="off"
        placeholder="Buscar por nombre de subsistema"
        class="min-h-11 w-full rounded-md border border-gray-300 bg-white pl-9 pr-10 text-base outline-none focus:border-main focus:ring-2 focus:ring-main/15 md:min-h-9 md:text-sm"
        @input="
          emit('updateBusqueda', ($event.target as HTMLInputElement).value)
        "
      />
      <button
        v-if="busqueda"
        type="button"
        class="absolute right-0 top-0 grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-r-md text-gray-500 hover:bg-gray-100 md:min-h-9 md:min-w-9"
        aria-label="Limpiar búsqueda"
        @click="emit('updateBusqueda', '')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
    <VueMultiselect
      v-model="estadoSeleccionado"
      :options="estados"
      track-by="value"
      label="label"
      :searchable="false"
      :allow-empty="false"
      :show-labels="false"
      placeholder="Estado"
      class="erp-multiselect"
    />
    <VueMultiselect
      v-model="usoSeleccionado"
      :options="usos"
      track-by="value"
      label="label"
      :searchable="false"
      :allow-empty="false"
      :show-labels="false"
      placeholder="Uso"
      class="erp-multiselect"
    />
    <button
      v-if="canCreate"
      type="button"
      class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-main px-3 text-sm font-semibold text-white hover:bg-main-light md:min-h-9 md:text-xs"
      @click="emit('create')"
    >
      <Plus class="h-4 w-4" />Nuevo subsistema
    </button>
    <button
      type="button"
      :disabled="!canClear"
      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold md:min-h-9 md:text-xs"
      :class="
        canClear
          ? 'cursor-pointer hover:bg-main/5 hover:text-main'
          : 'cursor-not-allowed opacity-50'
      "
      @click="emit('clear')"
    >
      <Eraser class="h-4 w-4" />Limpiar filtros
    </button>
  </div>
</template>
