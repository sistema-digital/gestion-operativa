<script setup lang="ts">
const props = withDefaults(defineProps<{
  observacion: string | null;
  compact?: boolean;
}>(), {
  compact: false,
});
</script>

<template>
  <div class="flex min-h-full flex-col justify-center">
    <p
      class="line-clamp-3 text-stone-800"
      :class="compact ? 'text-xs leading-4' : 'text-[13px] leading-5'"
    >
      {{ props.observacion || 'Sin observación registrada.' }}
    </p>
  </div>
</template>
