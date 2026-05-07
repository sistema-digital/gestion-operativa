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
  <div class="text-xs text-gray-500" :class="compact ? 'flex items-center justify-between gap-3' : 'space-y-1'">
    <div>
      <span class="font-bold text-gray-600">Fecha creación:</span>
      {{ createdAt }}
    </div>
    <div>
      <span class="font-bold text-gray-600">Fecha entrega:</span>
      <span class="font-medium text-gray-700">{{ deliveryAt }}</span>
    </div>
  </div>
</template>
