<script setup lang="ts">
import RegistroJornadaPage from "@/components/seguimiento/registro-jornada/RegistroJornadaPage.vue";

defineProps<{
  jornadaId?: string;
}>();
</script>

<template>
  <RegistroJornadaPage :jornada-id="jornadaId" />
</template>
