<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  searchActive: boolean;
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
  </section>
</template>
