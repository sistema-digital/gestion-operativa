<script setup lang="ts">
defineProps<{
  observacion: string;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
  observacionError?: string;
  motivoUrgenciaError?: string;
}>();

defineEmits<{
  (e: 'update:observacion', value: string): void;
  (e: 'update:solicitarUrgente', value: boolean): void;
  (e: 'update:motivoUrgencia', value: string): void;
}>();
</script>

<template>
  <section class="flex h-full flex-col rounded-lg border border-stone-200 bg-white px-3 py-4 shadow-sm md:px-4">
    <h3 class="text-base font-bold text-main">
      Paso 3 · Observaciones y urgencia
    </h3>
    <p class="mt-1 text-sm text-stone-500">
      Este paso ya usa la validación final del wizard.
    </p>

    <div class="mt-4 space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-stone-800">
          Observación <span class="text-danger">*</span>
        </label>
        <textarea
          :value="observacion"
          rows="5"
          class="w-full rounded-lg border px-3 py-2 text-sm text-stone-900 outline-none"
          :class="observacionError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
          placeholder="Describe el contexto de la solicitud"
          @input="$emit('update:observacion', ($event.target as HTMLTextAreaElement).value)"
        />
        <p
          v-if="observacionError"
          class="text-sm font-medium text-danger"
        >
          {{ observacionError }}
        </p>
      </div>

      <label class="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
        <div>
          <p class="font-semibold text-stone-800">
            Solicitar prioridad urgente
          </p>
          <p class="text-sm text-stone-500">
            La urgencia solo aplica cuando se envía la solicitud.
          </p>
        </div>

        <input
          :checked="solicitarUrgente"
          type="checkbox"
          class="h-5 w-5 rounded border-stone-300 text-main focus:ring-main"
          @change="$emit('update:solicitarUrgente', ($event.target as HTMLInputElement).checked)"
        >
      </label>

      <div
        v-if="solicitarUrgente"
        class="space-y-2"
      >
        <p class="rounded-lg border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning md:text-sm">
          La solicitud se creará con prioridad normal. La urgencia quedará pendiente de aprobación solo al enviar.
        </p>

        <label class="block text-sm font-semibold text-stone-800">
          Motivo de urgencia
        </label>
        <textarea
          :value="motivoUrgencia"
          rows="3"
          class="w-full rounded-lg border px-3 py-2 text-sm text-stone-900 outline-none"
          :class="motivoUrgenciaError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
          placeholder="Describe el riesgo operativo o la razón de urgencia"
          @input="$emit('update:motivoUrgencia', ($event.target as HTMLTextAreaElement).value)"
        />
        <p
          v-if="motivoUrgenciaError"
          class="text-sm font-medium text-danger"
        >
          {{ motivoUrgenciaError }}
        </p>
      </div>
    </div>
  </section>
</template>
