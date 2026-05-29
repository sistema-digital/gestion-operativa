<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="space-y-4">
    <div>
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-bold text-main">
          {{ title }}
        </h3>

        <div class="h-px flex-1 bg-gray-200"></div>
      </div>

      <p
        v-if="description"
        class="mt-1 text-xs text-gray-500"
      >
        {{ description }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <slot />
    </div>
  </section>
</template>