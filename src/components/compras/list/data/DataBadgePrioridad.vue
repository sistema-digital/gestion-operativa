<script setup lang="ts">
interface Props {
  label: string;
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: '',
});
</script>

<template>
  <span class="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-lg border whitespace-normal break-words inline-block text-left w-fit" :class="className">
    {{ label }}
  </span>
</template>
