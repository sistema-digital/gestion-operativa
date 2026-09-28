<script setup lang="ts">
import { computed } from "vue";
import { Eraser, Plus, Search, SlidersHorizontal, X } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import type {
  CatalogoAceiteEstado,
  CatalogoAceiteUso,
  CatalogoSistemaRelacionado,
} from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.types";
type Option<T extends string | number | null> = { label: string; value: T };
const props = defineProps<{
  busqueda: string;
  sistemaId: number | null;
  estado: CatalogoAceiteEstado;
  uso: CatalogoAceiteUso;
  sistemas: readonly CatalogoSistemaRelacionado[];
  canClear: boolean;
  canCreate: boolean;
}>();
const emit = defineEmits<{
  updateBusqueda: [string];
  updateSistema: [number | null];
  updateEstado: [CatalogoAceiteEstado];
  updateUso: [CatalogoAceiteUso];
  openFilters: [];
  clear: [];
  create: [];
}>();
const systems = computed<Option<number | null>[]>(() => [
  { label: "Todos los sistemas raíz", value: null },
  ...props.sistemas.map((item) => ({ label: item.nombre, value: item.id })),
]);
const states: readonly Option<CatalogoAceiteEstado>[] = [
  { label: "Activos", value: "activos" },
  { label: "Desactivados", value: "desactivados" },
  { label: "Todos", value: "todos" },
];
const usages: readonly Option<CatalogoAceiteUso>[] = [
  { label: "Todos", value: "todos" },
  { label: "En uso", value: "en-uso" },
  { label: "Sin uso", value: "sin-uso" },
];
const selectedSystem = computed<Option<number | null> | null>({
  get: () =>
    systems.value.find((item) => item.value === props.sistemaId) ?? null,
  set: (item) => emit("updateSistema", item?.value ?? null),
});
const selectedState = computed<Option<CatalogoAceiteEstado> | null>({
  get: () => states.find((item) => item.value === props.estado) ?? null,
  set: (item) => emit("updateEstado", item?.value ?? "activos"),
});
const selectedUsage = computed<Option<CatalogoAceiteUso> | null>({
  get: () => usages.find((item) => item.value === props.uso) ?? null,
  set: (item) => emit("updateUso", item?.value ?? "todos"),
});
const filterCount = computed(
  () =>
    Number(props.sistemaId !== null) +
    Number(props.estado !== "activos") +
    Number(props.uso !== "todos"),
);
</script>
<template>
  <div
    class="grid min-w-0 grid-cols-[1fr_44px] gap-2 sm:grid-cols-[minmax(230px,1fr)_auto_auto] lg:flex lg:flex-wrap"
  >
    <div class="relative min-w-0 lg:min-w-[230px] lg:max-w-[380px] lg:flex-1">
      <label for="aceites-search" class="sr-only"
        >Buscar aceite por nombre</label
      ><Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
      /><input
        id="aceites-search"
        :value="busqueda"
        type="search"
        autocomplete="off"
        placeholder="Buscar por nombre de aceite"
        class="min-h-11 w-full rounded-md border border-gray-300 bg-white pl-9 pr-11 text-base outline-none focus:border-main focus:ring-2 focus:ring-main/15 md:min-h-9 md:text-sm"
        @input="
          emit('updateBusqueda', ($event.target as HTMLInputElement).value)
        "
      /><button
        v-if="busqueda"
        type="button"
        class="absolute right-0 top-0 grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-r-md text-gray-500 hover:bg-gray-100 md:min-h-9 md:min-w-9"
        aria-label="Limpiar búsqueda"
        @click="emit('updateBusqueda', '')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
    <button
      type="button"
      class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold lg:hidden"
      :aria-label="`Abrir filtros, ${filterCount} activos`"
      @click="emit('openFilters')"
    >
      <SlidersHorizontal class="h-4 w-4" /><span class="hidden sm:inline"
        >Filtros</span
      ><span
        v-if="filterCount"
        class="rounded-full bg-main px-1.5 text-xs text-white"
        >{{ filterCount }}</span
      ></button
    ><VueMultiselect
      v-model="selectedSystem"
      class="hidden lg:block lg:w-[175px]"
      :options="systems"
      track-by="value"
      label="label"
      :searchable="true"
      :allow-empty="false"
      :show-labels="false"
      placeholder="Sistema raíz"
    /><VueMultiselect
      v-model="selectedState"
      class="hidden lg:block lg:w-[145px]"
      :options="states"
      track-by="value"
      label="label"
      :searchable="false"
      :allow-empty="false"
      :show-labels="false"
      placeholder="Estado"
    /><VueMultiselect
      v-model="selectedUsage"
      class="hidden lg:block lg:w-[140px]"
      :options="usages"
      track-by="value"
      label="label"
      :searchable="false"
      :allow-empty="false"
      :show-labels="false"
      placeholder="En uso"
    /><button
      v-if="canCreate"
      type="button"
      class="col-span-2 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-main px-3 text-sm font-semibold text-white hover:bg-main-light sm:col-span-1 lg:h-9 lg:min-h-0 lg:text-xs"
      @click="emit('create')"
    >
      <Plus class="h-4 w-4" />Nuevo aceite</button
    ><button
      type="button"
      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-600 sm:col-start-3 sm:row-start-1 lg:h-9 lg:min-h-0 lg:text-xs"
      :class="
        canClear
          ? 'cursor-pointer hover:bg-main/5 hover:text-main'
          : 'cursor-not-allowed opacity-50'
      "
      :disabled="!canClear"
      aria-label="Limpiar filtros"
      @click="emit('clear')"
    >
      <Eraser class="h-4 w-4" /><span class="hidden lg:inline"
        >Limpiar filtros</span
      >
    </button>
  </div>
</template>
