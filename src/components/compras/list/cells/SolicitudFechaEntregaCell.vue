<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraFechaEntregaUi } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  fechaEntrega: SolicitudCompraFechaEntregaUi;
  compact?: boolean;
  showLabel?: boolean;
}>(), {
  compact: false,
  showLabel: true,
});

const formattedDate = computed(() => {
  const rawDate = props.fechaEntrega.fecha;

  if (!rawDate) {
    return '';
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
});
</script>

<template>
  <div class="flex min-h-full flex-col justify-center">
    <span
      class="font-medium text-stone-800"
      :class="compact ? 'text-xs' : 'text-[12px]'"
    >
      {{ formattedDate || 'Sin fecha' }}
    </span>

    <span
      v-if="showLabel && formattedDate"
      class="mt-1 text-stone-500"
      :class="compact ? 'text-[10px]' : 'text-[11px]'"
    >
      Entrega
    </span>
  </div>
</template>
