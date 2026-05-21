<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import {
  WORK_ORDER_DELAYED_STATUSES,
  formatWorkOrderDate,
  getWorkOrderReference,
  isDelayedStatus,
} from '@/stores/horasTrabajo.helpers';
import type {
  WorkOrderFormErrors,
  WorkOrderTodayRow,
  WorkOrderUpdatePayload,
} from '@/stores/horasTrabajo.types';

const props = defineProps<{
  row: WorkOrderTodayRow;
  saving: boolean;
  errors: WorkOrderFormErrors;
}>();

const emit = defineEmits<{
  cancel: [];
  save: [payload: WorkOrderUpdatePayload];
}>();

const baseStatusOptions = ['En Proceso', 'En proceso', 'Concluida', 'Retrasa', 'Retrasada', 'Ausencia'];

const form = reactive<WorkOrderUpdatePayload>({
  duracionHoras: props.row.duracionHoras,
  estatus: props.row.estatus,
  retrasoHoras: props.row.retrasoHoras,
  causa: props.row.causa,
  comentario: props.row.comentario,
  observaciones: props.row.observaciones,
});

const showDelayFields = computed(() => isDelayedStatus(form.estatus));
const statusOptions = computed(() => {
  return form.estatus && !baseStatusOptions.includes(form.estatus)
    ? [form.estatus, ...baseStatusOptions]
    : baseStatusOptions;
});

const causeOptions = computed(() => {
  const base = ['Retraso por repuesto', 'Falta de personal', 'Espera de equipo', 'Condición climática'];
  return form.causa && !base.includes(form.causa) ? [form.causa, ...base] : base;
});

watch(
  () => props.row,
  (row) => {
    form.duracionHoras = row.duracionHoras;
    form.estatus = row.estatus;
    form.retrasoHoras = row.retrasoHoras;
    form.causa = row.causa;
    form.comentario = row.comentario;
    form.observaciones = row.observaciones;
  }
);

watch(
  () => form.estatus,
  (estatus) => {
    if (!WORK_ORDER_DELAYED_STATUSES.includes(estatus)) {
      form.retrasoHoras = null;
      form.causa = null;
    }
  }
);

const submit = () => {
  emit('save', { ...form });
};
</script>

<template>
  <form class="admin-work-order-form space-y-4" @submit.prevent="submit">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Referencia</label>
        <InputText :model-value="getWorkOrderReference(row)" disabled />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Mecánico</label>
        <InputText :model-value="row.mecanicoNombre || '—'" disabled />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Área</label>
        <InputText :model-value="row.area || '—'" disabled />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Equipo</label>
        <InputText :model-value="row.equipoTrabajo || '—'" disabled />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Fecha</label>
        <InputText :model-value="formatWorkOrderDate(row.fecha)" disabled />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Duración (horas)</label>
        <InputNumber
          v-model="form.duracionHoras"
          class="w-full"
          :min="0"
          :min-fraction-digits="0"
          :max-fraction-digits="2"
        />
        <p v-if="errors.duracionHoras" class="mt-1 text-xs text-danger">
          {{ errors.duracionHoras }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Estatus</label>
        <Select v-model="form.estatus" :options="statusOptions" class="w-full" />
        <p v-if="errors.estatus" class="mt-1 text-xs text-danger">
          {{ errors.estatus }}
        </p>
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Retraso (horas)</label>
        <InputNumber
          v-model="form.retrasoHoras"
          class="w-full"
          :disabled="!showDelayFields"
          :min="0"
          :min-fraction-digits="0"
          :max-fraction-digits="2"
        />
        <p v-if="errors.retrasoHoras" class="mt-1 text-xs text-danger">
          {{ errors.retrasoHoras }}
        </p>
      </div>
    </div>

    <div>
      <label class="mb-1 block text-[10px] font-bold text-gray-500">Causa</label>
      <Select
        v-model="form.causa"
        :disabled="!showDelayFields"
        :options="causeOptions"
        class="w-full"
      />
      <p v-if="errors.causa" class="mt-1 text-xs text-danger">
        {{ errors.causa }}
      </p>
    </div>

    <div>
      <label class="mb-1 block text-[10px] font-bold text-gray-500">Comentario</label>
      <Textarea v-model="form.comentario" class="w-full" rows="3" auto-resize />
    </div>

    <div>
      <label class="mb-1 block text-[10px] font-bold text-gray-500">Observaciones</label>
      <Textarea v-model="form.observaciones" class="w-full" rows="3" auto-resize />
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Semana</label>
        <InputText :model-value="row.semana || '—'" disabled />
      </div>
      <div>
        <label class="mb-1 block text-[10px] font-bold text-gray-500">Creado</label>
        <InputText :model-value="formatWorkOrderDate(row.created)" disabled />
      </div>
    </div>

    <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
      <Button
        type="button"
        label="Cancelar"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
      <Button type="submit" label="Guardar" :loading="saving" />
    </div>
  </form>
</template>

<style scoped>
.admin-work-order-form :deep(.p-inputtext),
.admin-work-order-form :deep(.p-inputnumber),
.admin-work-order-form :deep(.p-inputnumber-input),
.admin-work-order-form :deep(.p-select),
.admin-work-order-form :deep(.p-textarea) {
  width: 100%;
}

.admin-work-order-form :deep(.p-inputtext),
.admin-work-order-form :deep(.p-inputnumber-input),
.admin-work-order-form :deep(.p-select),
.admin-work-order-form :deep(.p-textarea) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-100);
  border-radius: 4px;
  color: var(--color-gray-700);
  font-size: 0.75rem;
  min-height: 2.15rem;
}

.admin-work-order-form :deep(.p-select-label) {
  align-items: center;
  display: flex;
  min-height: 2.15rem;
  padding: 0.4rem 0.65rem;
}

.admin-work-order-form :deep(.p-select-dropdown) {
  align-items: center;
  color: var(--color-gray-400);
  display: flex;
  justify-content: center;
  width: 2rem;
}

.admin-work-order-form :deep(.p-select:not(.p-disabled) .p-select-label) {
  color: var(--color-gray-700);
}

.admin-work-order-form :deep(.p-disabled),
.admin-work-order-form :deep(.p-inputtext:disabled),
.admin-work-order-form :deep(.p-inputnumber-input:disabled) {
  opacity: 1;
}

.admin-work-order-form :deep(.p-inputtext:enabled:focus),
.admin-work-order-form :deep(.p-inputnumber-input:enabled:focus),
.admin-work-order-form :deep(.p-select:not(.p-disabled).p-focus),
.admin-work-order-form :deep(.p-textarea:enabled:focus) {
  border-color: var(--color-main);
  box-shadow: 0 0 0 2px rgba(0, 70, 67, 0.12);
}

.admin-work-order-form :deep(.p-button) {
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.55rem 0.9rem;
}

.admin-work-order-form :deep(.p-button:not(.p-button-secondary)) {
  background: #155dfc;
  border-color: #155dfc;
}

@media (max-width: 640px) {
  .admin-work-order-form {
    padding-bottom: 1rem;
  }

  .admin-work-order-form :deep(.p-button) {
    flex: 1;
  }
}
</style>
