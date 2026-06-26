<script setup lang="ts">
import { computed } from 'vue';

import CrearSolicitudObservacionChip from './CrearSolicitudObservacionChip.vue';
import type { EquipoSeleccionado } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';
import { OBSERVACION_MAX_LENGTH } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

interface EquipoObservacionChip {
  codEquipo: string;
  present: boolean;
}

const props = defineProps<{
  observacion: string;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
  equipos: EquipoSeleccionado[];
  observacionError?: string;
  motivoUrgenciaError?: string;
}>();

const emit = defineEmits<{
  (e: 'update:observacion', value: string): void;
  (e: 'update:solicitarUrgente', value: boolean): void;
  (e: 'update:motivoUrgencia', value: string): void;
}>();

const equipmentChips = computed<EquipoObservacionChip[]>(() => props.equipos
  .filter((item) => item.source === 'equipo')
  .map((item) => ({
    codEquipo: item.codEquipo,
    present: props.observacion.includes(item.codEquipo),
  })));

const serviceContextChips = computed(() => props.equipos
  .filter((item) => item.source === 'contexto')
  .map((item) => ({
    codigo: item.codEquipo,
    nombre: item.label,
  })));

const characterCount = computed(() => props.observacion.length);

const handleObservacionInput = (event: Event): void => {
  const textarea = event.target as HTMLTextAreaElement;
  emit('update:observacion', textarea.value.slice(0, OBSERVACION_MAX_LENGTH));
};
</script>

<template>
  <section class="flex h-full min-h-0 flex-col rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
    <div class="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-stone-800">
          Observación <span class="text-danger">*</span>
        </label>

        <div
          v-if="equipmentChips.length > 0 || serviceContextChips.length > 0"
          class=""
        >
          
          <div class="flex flex-wrap gap-2">
            <CrearSolicitudObservacionChip
              v-for="chip in equipmentChips"
              :key="chip.codEquipo"
              :label="chip.codEquipo"
              :tone="chip.present ? 'success' : 'danger'"
            />
            <CrearSolicitudObservacionChip
              v-for="chip in serviceContextChips"
              :key="chip.codigo"
              :label="chip.nombre"
              tone="muted"
            />
          </div>
          
        </div>

        <textarea
          :value="observacion"
          :maxlength="OBSERVACION_MAX_LENGTH"
          rows="5"
          class="w-full rounded-lg border px-3 py-2 text-sm text-stone-900 outline-none"
          :class="observacionError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
          placeholder="Describe el contexto de la solicitud"
          @input="handleObservacionInput"
        />

        <div class="flex items-center justify-between gap-3 text-xs text-stone-500">
          <p class="font-semibold text-stone-600">
            {{ characterCount }}/{{ OBSERVACION_MAX_LENGTH }}
          </p>
        </div>

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
        <p class="rounded-lg border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning lg:text-sm">
          La solicitud se creará con prioridad normal. La urgencia quedará pendiente de aprobación de administrador solo al enviar.
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
