<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  searchActive: boolean;
  suggestDateRange?: boolean;
}>();

const message = computed(() =>
  props.searchActive
    ? 'No se encontraron solicitudes con esos filtros'
    : 'No hay solicitudes para mostrar'
);
</script>

<template>
  <section class="rounded-2xl border border-dashed border-stone-300 bg-white/75 px-5 py-10 text-center shadow-sm">
    <p class="text-sm font-medium text-stone-700">
      {{ message }}
    </p>

    <p
      v-if="suggestDateRange"
      class="mt-2 text-sm text-stone-500"
    >
      Prueba ampliar el rango de fechas para encontrar solicitudes.
    </p>
  </section>
</template>
