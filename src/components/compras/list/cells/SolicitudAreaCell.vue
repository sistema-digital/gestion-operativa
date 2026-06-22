<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraListItem } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  area: SolicitudCompraListItem['area'];
  compact?: boolean;
}>(), {
  compact: false,
});

const displayArea = computed(() => props.area.nombre || props.area.codigo || '');
</script>

<template>
  <div class="flex min-h-full flex-col justify-center">
    <span
      v-if="displayArea"
      class="text-stone-800"
      :class="compact ? 'text-xs font-medium' : 'text-[12px] font-medium'"
    >
      {{ displayArea }}
    </span>
  </div>
</template>
