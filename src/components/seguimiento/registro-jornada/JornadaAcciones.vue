<script setup lang="ts">
import { Check, Save } from "lucide-vue-next";

defineProps<{
  valido: boolean;
  guardando: boolean;
}>();

const emit = defineEmits<{
  guardar: [];
  finalizar: [];
}>();
</script>

<template>
  <footer
    class="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_18px_-16px_rgba(15,23,42,0.45)] backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:mt-5 md:rounded-lg md:border md:border-gray-200 md:bg-gray-50 md:px-3 md:shadow-none"
    aria-label="Acciones de la jornada"
  >
    <div
      class="mx-auto flex w-full max-w-5xl flex-col gap-2 md:max-w-none md:flex-row md:justify-end"
    >
      <button
        type="button"
        class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-main-dark transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="guardando"
        @click="emit('guardar')"
      >
        <Save class="size-3.5" aria-hidden="true" />
        Guardar borrador
      </button>

      <button
        type="button"
        class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-main px-3 text-xs font-semibold text-white transition-colors hover:bg-main-dark disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="!valido || guardando"
        @click="emit('finalizar')"
      >
        <Check class="size-3.5" aria-hidden="true" />
        Finalizar y registrar
      </button>
    </div>
  </footer>
</template>
