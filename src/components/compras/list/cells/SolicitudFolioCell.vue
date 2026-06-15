<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraFolioUi } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  folio: SolicitudCompraFolioUi;
  canSeeOc?: boolean;
  compact?: boolean;
}>(), {
  canSeeOc: false,
  compact: false,
});

const displayFolio = computed(() => {
  const rawFolio = props.folio.folioSol?.trim();

  if (rawFolio) {
    return rawFolio.startsWith('#') ? rawFolio : `#${rawFolio}`;
  }

  return props.folio.folioSolLabel?.trim() || '';
});

const displayOc = computed(() => {
  if (!props.canSeeOc) {
    return '';
  }

  return props.folio.folioOcPrincipal?.trim() || '';
});
</script>

<template>
  <div class="flex min-h-full flex-col justify-center">
    <span
      class="font-semibold text-stone-900"
      :class="compact ? 'text-xs' : 'text-[13px]'"
    >
      {{ displayFolio }}
    </span>

    <span
      v-if="displayOc"
      class="mt-1 text-stone-500"
      :class="compact ? 'text-[10px]' : 'text-[11px]'"
    >
      OC {{ displayOc }}
    </span>
  </div>
</template>
