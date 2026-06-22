<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  fullWidthMobile?: boolean;
}>();

defineEmits<{
  (e: 'remove'): void;
}>();

const chipClassName = computed(() =>
  props.fullWidthMobile
    ? 'grid w-full min-w-0 max-w-full grid-cols-5 items-center rounded-lg border border-main/25 bg-main/6 px-3 py-1.5 text-xs font-medium text-main sm:w-auto'
    : 'grid min-w-0 max-w-full grid-cols-5 items-center rounded-lg border border-main/25 bg-main/6 px-3 py-1.5 text-xs font-medium text-main'
);
</script>

<template>
  <span :class="chipClassName">
    <span class="col-span-4 truncate">{{ label }}</span>
    <button
      type="button"
      class="col-start-5 flex justify-end rounded-full p-0.5 text-main transition hover:bg-main/10"
      @click="$emit('remove')"
    >
      <X class="h-4 w-4" />
    </button>
  </span>
</template>
