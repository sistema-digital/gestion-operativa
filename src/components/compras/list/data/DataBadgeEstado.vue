<script setup lang="ts">
interface Props {
  label: string;
}

defineProps<Props>();
</script>

<template>
  <span class="text-[10px] uppercase tracking-wide font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg whitespace-nowrap">
    {{ label }}
  </span>
</template>
