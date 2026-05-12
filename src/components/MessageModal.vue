<script setup lang="ts">
import type { PropType } from 'vue';
import { Info } from 'lucide-vue-next';

defineProps({
  message: {
    type: String,
    required: true
  },
  ok: {
    type: Function as PropType<() => void>,
    default: null
  },
  cancel: {
    type: Function as PropType<() => void>,
    default: null
  }
});
</script>

<template>
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-main-dark/50 backdrop-blur-sm" @click="cancel?.()"></div>

    <div
      class="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white p-6 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Info class="h-8 w-8" />
      </div>

      <p class="mb-6 text-sm leading-6 text-gray-600">
        {{ message }}
      </p>

      <div class="flex flex-col gap-2">
        <button
          v-if="ok"
          type="button"
          class="w-full rounded-xl bg-accent py-3 font-bold text-main-dark transition-all hover:brightness-110"
          @click="ok"
        >
          OK
        </button>

        <button
          v-if="cancel"
          type="button"
          class="w-full rounded-xl bg-gray-50 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-100"
          @click="cancel"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>
