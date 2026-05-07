<script setup lang="ts">
interface Props {
  label?: string;
  value: string;
}

defineProps<Props>();
</script>

<template>
  <div class="text-xs text-gray-500 whitespace-normal break-words">
    <span v-if="label" class="font-bold text-gray-600">{{ label }}:</span>
    <span class="font-semibold text-gray-700">{{ value }}</span>
  </div>
</template>
