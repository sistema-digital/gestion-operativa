<script setup lang="ts">
import type { SolicitudCompraCreateStep } from '@/stores/db_compras/solicitudes_compra/solicitudesCompraCrear.types';

defineProps<{
  currentStep: SolicitudCompraCreateStep;
  loading: boolean;
  disableNext: boolean;
}>();

defineEmits<{
  (e: 'cancel'): void;
  (e: 'back'): void;
  (e: 'next'): void;
  (e: 'draft'): void;
  (e: 'send'): void;
}>();
</script>

<template>
  <footer class="flex shrink-0 flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-1 items-center gap-3">
      <button
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5"
        @click="$emit('cancel')"
      >
        Cancelar
      </button>

      <button
        v-if="currentStep > 1"
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        @click="$emit('back')"
      >
        Anterior
      </button>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row">
      <template v-if="currentStep < 4">
        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-main-dark shadow-sm transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="disableNext || loading"
          @click="$emit('next')"
        >
          Siguiente
        </button>
      </template>

      <template v-else>
        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5 disabled:opacity-60"
          :disabled="loading"
          @click="$emit('draft')"
        >
          Guardar borrador
        </button>

        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-main-dark shadow-sm transition hover:bg-accent-light disabled:opacity-60"
          :disabled="loading"
          @click="$emit('send')"
        >
          Enviar solicitud
        </button>
      </template>
    </div>
  </footer>
</template>
