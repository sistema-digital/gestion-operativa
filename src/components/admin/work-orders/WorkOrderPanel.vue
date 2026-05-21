<script setup lang="ts">
import { computed } from 'vue';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { Trash2 } from 'lucide-vue-next';
import WorkOrderEditorForm from './WorkOrderEditorForm.vue';
import {
  emptyText,
  formatWorkOrderDate,
  getWorkOrderReference,
  getWorkOrderStatusSeverity,
} from '@/stores/horasTrabajo.helpers';
import type {
  WorkOrderFormErrors,
  WorkOrderPanelMode,
  WorkOrderTodayRow,
  WorkOrderUpdatePayload,
} from '@/stores/horasTrabajo.types';

const props = defineProps<{
  visible: boolean;
  mode: WorkOrderPanelMode;
  row: WorkOrderTodayRow | null;
  saving: boolean;
  errors: WorkOrderFormErrors;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'change-mode': [mode: WorkOrderPanelMode];
  delete: [row: WorkOrderTodayRow];
  save: [payload: WorkOrderUpdatePayload];
}>();

const title = computed(() => (
  props.mode === 'edit' ? 'Editar orden de trabajo' : 'Detalle de orden de trabajo'
));

const details = computed(() => {
  if (!props.row) return [];

  return [
    ['Referencia', getWorkOrderReference(props.row)],
    ['Mecánico', emptyText(props.row.mecanicoNombre)],
    ['Área', emptyText(props.row.area)],
    ['Equipo de trabajo', emptyText(props.row.equipoTrabajo)],
    ['Fecha', formatWorkOrderDate(props.row.fecha)],
    ['Duración', `${props.row.duracionHoras} h`],
    ['Retraso', props.row.retrasoHoras ? `${props.row.retrasoHoras} h` : '—'],
    ['Causa', emptyText(props.row.causa)],
    ['Comentario', emptyText(props.row.comentario)],
    ['Observaciones', emptyText(props.row.observaciones)],
    ['Semana', emptyText(props.row.semana)],
    ['Fecha de creación', formatWorkOrderDate(props.row.created)],
  ];
});

const close = () => {
  emit('update:visible', false);
};
</script>

<template>
  <Drawer
    :visible="visible"
    position="right"
    class="admin-work-order-drawer w-full sm:!w-[28rem]"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <div class="flex w-full items-start justify-between gap-3">
        <div>
        <h3 class="text-base font-bold text-gray-800">{{ title }}</h3>
        <p v-if="row" class="text-xs text-gray-400">{{ getWorkOrderReference(row) }}</p>
        </div>
        <Button v-if="row" aria-label="Eliminar" text rounded severity="danger" @click="emit('delete', row)">
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </template>

    <div v-if="row" class="space-y-5">
      <div class="flex border-b border-gray-100">
        <button
          class="border-b-2 px-4 py-2 text-xs font-bold transition-colors"
          :class="mode === 'view' ? 'border-main text-main' : 'border-transparent text-gray-400 hover:text-gray-700'"
          type="button"
          @click="emit('change-mode', 'view')"
        >
          Ver
        </button>
        <button
          class="border-b-2 px-4 py-2 text-xs font-bold transition-colors"
          :class="mode === 'edit' ? 'border-main text-main' : 'border-transparent text-gray-400 hover:text-gray-700'"
          type="button"
          @click="emit('change-mode', 'edit')"
        >
          Editar
        </button>
      </div>

      <div v-if="mode === 'view'" class="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <span class="text-xs font-bold uppercase text-gray-400">Estatus</span>
          <Tag :value="row.estatus || 'Sin estatus'" :severity="getWorkOrderStatusSeverity(row.estatus)" />
        </div>
        <dl class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div v-for="[label, value] in details" :key="label">
            <dt class="text-[10px] font-bold uppercase text-gray-400">{{ label }}</dt>
            <dd class="text-sm font-medium text-gray-700">{{ value }}</dd>
          </div>
        </dl>
      </div>

      <WorkOrderEditorForm
        v-if="mode === 'edit'"
        :row="row"
        :saving="saving"
        :errors="errors"
        @cancel="close"
        @save="emit('save', $event)"
      />
    </div>
  </Drawer>
</template>

<style scoped>
:global(.admin-work-order-drawer.p-drawer) {
  border-left: 1px solid var(--color-gray-100);
  background: var(--color-white);
  box-shadow: -16px 0 40px rgba(0, 0, 0, 0.12);
}

:global(.admin-work-order-drawer .p-drawer-header) {
  align-items: flex-start;
  border-bottom: 1px solid var(--color-gray-100);
  padding: 0.8rem 1rem;
}

:global(.admin-work-order-drawer .p-drawer-content) {
  overflow-y: auto;
  padding: 0 1rem 1rem;
}

:global(.admin-work-order-drawer .p-drawer-close-button) {
  align-items: center;
  border-radius: 8px;
  color: var(--color-gray-400);
  display: inline-flex;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

:global(.admin-work-order-drawer .p-drawer-close-button:hover) {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

:global(.admin-work-order-drawer .p-tag) {
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
}

@media (max-width: 640px) {
  :global(.admin-work-order-drawer.p-drawer) {
    height: 100dvh !important;
    left: 0 !important;
    max-width: 100vw;
    top: 0 !important;
    width: 100vw !important;
  }

  :global(.admin-work-order-drawer .p-drawer-header),
  :global(.admin-work-order-drawer .p-drawer-content) {
    width: 100%;
  }

  :global(.admin-work-order-drawer .p-drawer-header) {
    padding: 0.75rem;
  }

  :global(.admin-work-order-drawer .p-drawer-content) {
    padding: 0 0.75rem 0.75rem;
  }
}
</style>
