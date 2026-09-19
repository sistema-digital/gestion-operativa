<script setup lang="ts">
import { Check, Save } from "lucide-vue-next";

defineProps<{
  valido: boolean;
  guardando: boolean;
  guardarDisponible?: boolean;
  finalizarDisponible?: boolean;
}>();

const emit = defineEmits<{
  guardar: [];
  finalizar: [];
}>();
</script>

<template>
  <footer
    class="flex flex-col gap-2 sm:flex-row sm:justify-end"
    aria-label="Acciones de la jornada"
  >
    <button
      type="button"
      class="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#d8d2c8] bg-white px-4 text-xs font-semibold text-main-dark shadow-sm transition-colors hover:bg-[#faf9f6] disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="guardando || !guardarDisponible"
      :title="
        guardarDisponible
          ? undefined
          : 'El guardado de borradores está pendiente de integración.'
      "
      @click="emit('guardar')"
    >
      <Save class="size-3.5" aria-hidden="true" />
      {{ guardarDisponible ? "Guardar borrador" : "Borrador pendiente" }}
    </button>

    <button
      type="button"
      class="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-main px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-main-dark disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="!valido || guardando || !finalizarDisponible"
      @click="emit('finalizar')"
    >
      <Check class="size-3.5" aria-hidden="true" />
      Finalizar y registrar
    </button>
  </footer>
</template>
