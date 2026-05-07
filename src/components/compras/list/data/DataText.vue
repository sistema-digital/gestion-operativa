<script setup lang="ts">
interface Props {
  text?: string | null;
  fallback?: string;
}

withDefaults(defineProps<Props>(), {
  fallback: 'Sin información',
});
</script>

<template>
  <div class="text-sm text-gray-600 line-clamp-2">
    {{ text || fallback }}
  </div>
</template>
