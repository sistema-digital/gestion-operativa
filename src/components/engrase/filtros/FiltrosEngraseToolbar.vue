<script setup lang="ts">
import { computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { Check, Eraser, Sprout, Wheat } from "lucide-vue-next";
import FiltroCodigoAutocomplete from "./FiltroCodigoAutocomplete.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import type {
  EtapaEngrase,
  FiltroCodigoSugerencia,
  FiltrosEngraseQuery,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";
const props = defineProps<{
  filters: FiltrosEngraseQuery;
  etapas: EtapaEngrase[];
  sugerenciasCodigo: FiltroCodigoSugerencia[];
  loading: boolean;
  loadingSugerencias: boolean;
  resetSignal: number;
}>();
const emit = defineEmits<{
  updateFilters: [Partial<FiltrosEngraseQuery>];
  searchCodeSuggestions: [string];
  selectCodeSuggestion: [FiltroCodigoSugerencia];
  clearCode: [];
  clearAll: [];
  closeDetail: [];
}>();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const canBuscarFiltros = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad("equipo_filtros"),
);

watch(canBuscarFiltros, (canSearchFilters) => {
  if (!isFeatureAccessLoaded.value || canSearchFilters) return;
  emit("clearCode");
});

function clearAllFilters() {
  emit("clearAll");
  emit("closeDetail");
}
const hayFiltrosAplicados = computed(
  () =>
    props.filters.estadoEquipo !== "activo" ||
    props.filters.tipoEquipoId !== null ||
    props.filters.tipoFiltroId !== null ||
    Boolean(props.filters.modelo) ||
    props.filters.etapaIds.length > 0 ||
    props.filters.codigoExactoSeleccionado !== null,
);
function toggleEtapa(etapaId: number) {
  const etapaIds = new Set(props.filters.etapaIds);
  etapaIds.has(etapaId) ? etapaIds.delete(etapaId) : etapaIds.add(etapaId);
  emit("updateFilters", { etapaIds: [...etapaIds] });
}
function etapaSeleccionada(etapaId: number): boolean {
  return props.filters.etapaIds.includes(etapaId);
}
function esCultivo(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "cultivo";
}
function esZafra(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "zafra";
}
</script>
<template>
  <section
    class="grid gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
    :class="canBuscarFiltros ? 'lg:grid-cols-4' : 'lg:grid-cols-2'"
    aria-label="Filtros de equipos"
  >
    <FiltroCodigoAutocomplete
      v-if="canBuscarFiltros"
      class="lg:col-span-2"
      :model-value="filters.codigoExactoSeleccionado ?? ''"
      :sugerencias="sugerenciasCodigo"
      :loading="loadingSugerencias"
      :reset-signal="resetSignal"
      @update:model-value="
        emit('updateFilters', { codigoExactoSeleccionado: null })
      "
      @search="emit('searchCodeSuggestions', $event)"
      @select="emit('selectCodeSuggestion', $event)"
      @clear="emit('clearCode')"
    />
    <fieldset
      class="flex min-w-0 flex-wrap items-stretch gap-2"
      aria-label="Etapas"
    >
      <legend class="sr-only">Etapas</legend>
      <label
        v-for="item in etapas"
        :key="item.id"
        class="relative flex h-9 min-w-[7.5rem] flex-1 cursor-pointer items-center"
      >
        <input
          :id="`etapa-${item.id}`"
          :checked="etapaSeleccionada(item.id)"
          :value="item.id"
          type="checkbox"
          name="etapas"
          class="peer sr-only"
          @change="toggleEtapa(item.id)"
        />
        <span
          class="flex h-full w-full items-center justify-start gap-1.5 whitespace-nowrap rounded-md border border-gray-200 px-3 text-xs text-gray-500 transition-colors peer-checked:border-main peer-checked:bg-main/10 peer-checked:text-main peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-main"
        >
          <span
            class="grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors"
            :class="
              etapaSeleccionada(item.id)
                ? 'border-main bg-main text-white'
                : 'border-gray-400 bg-white text-transparent'
            "
            aria-hidden="true"
          >
            <Check
              v-if="etapaSeleccionada(item.id)"
              class="h-3.5 w-3.5"
              stroke-width="3"
            />
          </span>
          <Sprout
            v-if="esCultivo(item.nombre)"
            class="h-3.5 w-3.5 shrink-0 text-main"
          />
          <Wheat
            v-else-if="esZafra(item.nombre)"
            class="h-3.5 w-3.5 shrink-0 text-accent"
          />
          {{ item.nombre }}
        </span>
      </label>
    </fieldset>
    <div class="flex gap-1 border-l border-gray-200 pl-2">
      <button
        class="h-9 flex-1 cursor-pointer rounded-md border text-xs"
        :class="
          filters.estadoEquipo === 'activo'
            ? 'border-success bg-success-bg text-success'
            : 'border-gray-200 text-gray-500'
        "
        @click="emit('updateFilters', { estadoEquipo: 'activo' })"
      >
        Activos</button
      ><button
        class="h-9 flex-1 cursor-pointer rounded-md border text-xs"
        :class="
          filters.estadoEquipo === 'descartado'
            ? 'border-danger bg-danger-bg text-danger'
            : 'border-gray-200 text-gray-500'
        "
        @click="emit('updateFilters', { estadoEquipo: 'descartado' })"
      >
        Descartados
      </button>
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border transition"
        :class="
          hayFiltrosAplicados
            ? 'border-accent/60 bg-accent-light/45 text-main-dark hover:border-accent hover:bg-accent-light/70'
            : 'border-gray-200 text-gray-500 hover:bg-main/5 hover:text-main'
        "
        aria-label="Limpiar todos los filtros"
        :title="
          hayFiltrosAplicados
            ? 'Limpiar todos los filtros aplicados'
            : 'Sin filtros para limpiar'
        "
        @click="clearAllFilters"
      >
        <Eraser class="h-4 w-4" />
      </button>
    </div>
  </section>
</template>
