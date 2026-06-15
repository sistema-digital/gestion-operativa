<script setup lang="ts">
import type { SolicitudCompraListItem } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

withDefaults(defineProps<{
  solicitante: SolicitudCompraListItem['solicitante'];
  compact?: boolean;
}>(), {
  compact: false,
});
</script>

<template>
  <div class="flex min-h-full items-center">
    <span
      v-if="solicitante.nombre"
      class="text-stone-800"
      :class="compact ? 'text-xs' : 'text-[12px]'"
    >
      {{ solicitante.nombre }}
    </span>
  </div>
</template>
