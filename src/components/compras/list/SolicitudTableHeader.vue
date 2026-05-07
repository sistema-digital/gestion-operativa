<script setup lang="ts">
import type { SolicitudColumn } from './types';

interface Props {
  columns: SolicitudColumn[];
  gridClass: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="hidden lg:grid gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider"
    :class="gridClass"
  >
    <div v-for="column in columns" :key="column.key" class="whitespace-normal break-words">
      {{ column.label }}
    </div>
  </div>
</template>
