<script setup lang="ts">
const props = defineProps<{
  message: string;
}>();

const emit = defineEmits<{
  (e: 'retry'): void;
}>();
</script>

<template>
  <section class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5 shadow-sm">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-rose-700">
          No se pudo cargar el listado
        </p>
        <p class="mt-1 text-sm text-rose-600">
          {{ props.message }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        @click="emit('retry')"
      >
        Reintentar
      </button>
    </div>
  </section>
</template>
