<script setup lang="ts">
interface Props {
  title: string | null;
  subtitle?: string | null;
}

defineProps<Props>();
</script>

<template>
  <div>
    <div class="font-bold text-gray-900">{{ title || 'Sin Folio' }}</div>
    <div v-if="subtitle" class="text-[10px] text-gray-400 uppercase font-bold truncate">{{ subtitle }}</div>
  </div>
</template>
