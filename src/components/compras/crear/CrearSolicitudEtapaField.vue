<script setup lang="ts">
import { computed } from "vue";
import { Shapes, Sprout, Wheat } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";

import type {
  SolicitudCompraEtapaCodigo,
  SolicitudCompraEtapaOption,
} from "@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types";

const model = defineModel<SolicitudCompraEtapaCodigo | null>();

const props = defineProps<{
  options: SolicitudCompraEtapaOption[];
  loading: boolean;
  error?: string;
}>();

const selectedOption = computed<SolicitudCompraEtapaOption | null>({
  get: () =>
    props.options.find((option) => option.codigo === model.value) ?? null,
  set: (option) => {
    model.value = option?.codigo ?? null;
  },
});
</script>

<template>
  <div class="space-y-1">
    <p class="text-xs font-semibold text-stone-800">
      Etapa <span class="text-danger">*</span>
    </p>

    <VueMultiselect
      v-model="selectedOption"
      :options="options"
      track-by="codigo"
      label="nombre"
      :loading="loading"
      :searchable="false"
      :allow-empty="false"
      :show-labels="false"
      :class="{
        'crear-solicitud-multiselect': true,
        'multiselect-invalid': Boolean(error),
      }"
      placeholder="Selecciona la etapa"
      no-options="No hay etapas disponibles"
    >
      <template #singleLabel="{ option }">
        <span class="flex items-center gap-2">
          <Sprout
            v-if="option.codigo === 'cultivo'"
            class="etapa-option-icon h-4 w-4 shrink-0 text-main"
            aria-hidden="true"
          />
          <Wheat
            v-else-if="option.codigo === 'zafra'"
            class="etapa-option-icon h-4 w-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <Shapes
            v-else
            class="etapa-option-icon h-4 w-4 shrink-0 text-stone-500"
            aria-hidden="true"
          />
          <span class="truncate">{{ option.nombre }}</span>
        </span>
      </template>

      <template #option="{ option }">
        <span class="flex items-center gap-2">
          <Sprout
            v-if="option.codigo === 'cultivo'"
            class="etapa-option-icon h-4 w-4 shrink-0 text-main"
            aria-hidden="true"
          />
          <Wheat
            v-else-if="option.codigo === 'zafra'"
            class="etapa-option-icon h-4 w-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <Shapes
            v-else
            class="etapa-option-icon h-4 w-4 shrink-0 text-stone-500"
            aria-hidden="true"
          />
          <span>{{ option.nombre }}</span>
        </span>
      </template>
    </VueMultiselect>

    <p v-if="error" class="text-sm font-medium text-danger">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.crear-solicitud-multiselect :deep(.multiselect__select) {
  cursor: pointer;
}

.crear-solicitud-multiselect
  :deep(.multiselect__option--highlight .etapa-option-icon) {
  color: var(--color-white);
}
</style>
