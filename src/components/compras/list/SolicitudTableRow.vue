<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import SolicitudTableCell from './SolicitudTableCell.vue';
import type { SolicitudColumn, SolicitudDisplayConfig } from './types';

interface Props {
  item: SolicitudCompra;
  columns: SolicitudColumn[];
  display: SolicitudDisplayConfig;
  gridClass: string;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'row-click'): void;
}>();
</script>

<template>
  <div
    @click="emit('row-click')"
    class="grid grid-cols-1 gap-3 p-4 border-b border-gray-100 last:border-b-0 hover:bg-accent/5 cursor-pointer transition-colors"
    :class="gridClass"
  >
    <SolicitudTableCell
      v-for="column in columns"
      :key="column.key"
      :item="item"
      :column="column"
      :display="display"
    />
  </div>
</template>
