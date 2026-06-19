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
  <footer class="pt-1">
    <div
      v-if="currentStep < 4"
      class="flex shrink-0 flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="flex flex-col gap-3 lg:flex-row">
        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg border border-danger-light bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger-light"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
      </div>

      <div class="flex flex-col gap-3 lg:flex-row">
        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-main px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-55 lg:order-2"
          :disabled="disableNext || loading"
          @click="$emit('next')"
        >
          Siguiente
        </button>

        <button
          v-if="currentStep > 1"
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5 disabled:opacity-60 lg:order-1"
          :disabled="loading"
          @click="$emit('back')"
        >
          Atrás
        </button>
      </div>
    </div>

    <template v-else>
      <div class="flex shrink-0 flex-col gap-3 lg:hidden">
        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg bg-main px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-main-light disabled:opacity-60"
          :disabled="loading"
          @click="$emit('send')"
        >
          Enviar solicitud
        </button>

        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg border border-white bg-accent px-4 text-sm font-semibold text-main transition hover:bg-accent-light disabled:opacity-60"
          :disabled="loading"
          @click="$emit('draft')"
        >
          Guardar borrador
        </button>

        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5 disabled:opacity-60"
          :disabled="loading"
          @click="$emit('back')"
        >
          Atrás
        </button>

        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-lg border border-danger-light bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger-light"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
      </div>

      <div class="hidden shrink-0 lg:flex lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-col gap-3 lg:flex-row">
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-lg border border-danger-light bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger-light"
            @click="$emit('cancel')"
          >
            Cancelar
          </button>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row">
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5 disabled:opacity-60"
            :disabled="loading"
            @click="$emit('back')"
          >
            Atrás
          </button>

          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-lg bg-main px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-main-light disabled:opacity-60"
            :disabled="loading"
            @click="$emit('send')"
          >
            Enviar solicitud
          </button>

          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-lg border border-white bg-accent px-4 text-sm font-semibold text-main transition hover:bg-accent-light disabled:opacity-60"
            :disabled="loading"
            @click="$emit('draft')"
          >
            Guardar borrador
          </button>
        </div>
      </div>
    </template>
  </footer>
</template>
