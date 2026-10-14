<script setup lang="ts">
import { computed } from "vue";
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
    />

    <p v-if="error" class="text-sm font-medium text-danger">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.crear-solicitud-multiselect :deep(.multiselect__select) {
  cursor: pointer;
}
</style>
