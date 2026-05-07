<script setup lang="ts">
interface Props {
  createdAt: string;
  deliveryAt: string;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  compact: false,
});
</script>

<template>
  <div class="text-xs text-gray-500 w-full" :class="compact ? 'flex flex-wrap items-center justify-between gap-3' : 'space-y-1'">
    <div class="whitespace-normal break-words">
      <span class="font-bold text-gray-600">Creación:</span>
      {{ createdAt }}
    </div>
    <div class="whitespace-normal break-words">
      <span class="font-bold text-gray-600">Entrega:</span>
      <span class="font-medium text-gray-700">{{ deliveryAt }}</span>
    </div>
  </div>
</template>
