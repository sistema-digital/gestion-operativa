<script setup lang="ts">
import { Check } from 'lucide-vue-next';

import type { SolicitudCompraCreateStep } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  currentStep: SolicitudCompraCreateStep;
}>();

const steps = [
  { id: 1, label: 'Datos base' },
  { id: 2, label: 'Productos' },
  { id: 3, label: 'Observaciones' },
  { id: 4, label: 'Resumen' },
] as const;
</script>

<template>
  <div class="rounded-md border border-stone-200 bg-white px-2 py-2 shadow-sm">
    <div class="hidden lg:grid lg:grid-cols-4 lg:gap-2">
      <div
        v-for="step in steps"
        :key="step.id"
        class="relative flex flex-col items-center gap-1 text-center"
      >
        <div
          v-if="step.id < steps.length"
          class="absolute left-[calc(50%+0.8rem)] top-3.5 h-0.5 w-[calc(100%-1.6rem)]"
          :class="step.id < currentStep ? 'bg-main' : 'bg-stone-200'"
        />

        <span
          class="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition"
          :class="step.id < currentStep
            ? 'border-success bg-success text-white'
            : step.id === currentStep
              ? 'border-main bg-main text-white'
              : 'border-stone-300 bg-white text-stone-500'"
        >
          <Check
            v-if="step.id < currentStep"
            class="h-3 w-3"
          />
          <template v-else>
            {{ step.id }}
          </template>
        </span>

        <span
          class="text-[10px] font-semibold"
          :class="step.id === currentStep ? 'text-main' : 'text-stone-500'"
        >
          {{ step.label }}
        </span>
      </div>
    </div>

    <div class="lg:hidden">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
        Paso {{ currentStep }} de 4
      </p>
      <p class="mt-0.5 text-xs font-semibold text-main">
        {{ steps[currentStep - 1]?.label }}
      </p>
    </div>
  </div>
</template>
