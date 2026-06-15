<script setup lang="ts">
import type { SolicitudCompraIndicadores } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  bloqueado: SolicitudCompraIndicadores['bloqueado'];
  compact?: boolean;
}>(), {
  compact: false,
});
</script>

<template>
  <span
    v-if="props.bloqueado.visible"
    class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 font-semibold text-amber-700"
    :class="compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'"
  >
    Bloqueado
  </span>
</template>
