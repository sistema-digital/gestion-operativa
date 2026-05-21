<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import WorkOrderPanel from './WorkOrderPanel.vue';
import WorkOrderTable from './WorkOrderTable.vue';
import { useHorasTrabajoStore } from '@/stores/horasTrabajoStore';
import {
  getWorkOrderReference,
  validateWorkOrderUpdate,
} from '@/stores/horasTrabajo.helpers';
import type {
  WorkOrderFormErrors,
  WorkOrderPanelMode,
  WorkOrderTodayRow,
  WorkOrderUpdatePayload,
} from '@/stores/horasTrabajo.types';

const horasTrabajoStore = useHorasTrabajoStore();
const { todayWorkOrders, todayWorkOrdersLoading, todayWorkOrdersError } = storeToRefs(horasTrabajoStore);
const confirm = useConfirm();
const toast = useToast();

const search = ref('');
const statusFilter = ref<string | null>(null);
const areaFilter = ref<string | null>(null);
const selectedRow = ref<WorkOrderTodayRow | null>(null);
const panelMode = ref<WorkOrderPanelMode>('view');
const isPanelVisible = ref(false);
const isSaving = ref(false);
const formErrors = ref<WorkOrderFormErrors>({});

const statusOptions = computed(() => {
  return [...new Set(todayWorkOrders.value.map((row) => row.estatus).filter(Boolean))].sort();
});

const areaOptions = computed(() => {
  return [...new Set(todayWorkOrders.value.map((row) => row.area).filter(Boolean))].sort();
});

const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase();

  return todayWorkOrders.value.filter((row) => {
    const matchesStatus = !statusFilter.value || row.estatus === statusFilter.value;
    const matchesArea = !areaFilter.value || row.area === areaFilter.value;
    const haystack = [
      getWorkOrderReference(row),
      row.mecanicoNombre,
      row.area,
      row.equipoTrabajo,
      row.causa,
      row.estatus,
    ].join(' ').toLowerCase();

    return matchesStatus && matchesArea && (!term || haystack.includes(term));
  });
});

const loadOrders = async () => {
  try {
    await horasTrabajoStore.fetchTodayWorkOrders();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo cargar',
      detail: error instanceof Error ? error.message : 'Error al cargar las órdenes de hoy.',
      life: 3500,
    });
  }
};

const openPanel = (row: WorkOrderTodayRow, mode: WorkOrderPanelMode) => {
  selectedRow.value = row;
  panelMode.value = mode;
  formErrors.value = {};
  isPanelVisible.value = true;
};

const saveWorkOrder = async (payload: WorkOrderUpdatePayload) => {
  formErrors.value = validateWorkOrderUpdate(payload);
  if (Object.keys(formErrors.value).length || !selectedRow.value) return;

  isSaving.value = true;
  try {
    await horasTrabajoStore.updateWorkOrder(selectedRow.value.idOt, payload);
    toast.add({ severity: 'success', summary: 'Orden actualizada', life: 2500 });
    isPanelVisible.value = false;
    await loadOrders();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo guardar',
      detail: error instanceof Error ? error.message : 'Error al actualizar la orden.',
      life: 3500,
    });
  } finally {
    isSaving.value = false;
  }
};

const deleteWorkOrder = async (row: WorkOrderTodayRow) => {
  try {
    await horasTrabajoStore.deleteWorkOrder(row.idOt);
    toast.add({ severity: 'success', summary: 'Orden eliminada', life: 2500 });
    if (selectedRow.value?.idOt === row.idOt) isPanelVisible.value = false;
    await loadOrders();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo eliminar',
      detail: error instanceof Error ? error.message : 'Error al eliminar la orden.',
      life: 3500,
    });
  }
};

const confirmDelete = (row: WorkOrderTodayRow) => {
  confirm.require({
    message: '¿Deseas eliminar esta orden de trabajo? Esta acción no se puede deshacer.',
    header: 'Eliminar orden de trabajo',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: () => deleteWorkOrder(row),
  });
};

const setPanelMode = (mode: WorkOrderPanelMode) => {
  panelMode.value = mode;
  formErrors.value = {};
};

onMounted(loadOrders);
</script>

<template>
  <section class="admin-work-hours mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
    <Toast />
    <ConfirmDialog />

    <div class="mb-5">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Horas de trabajo de hoy</h1>
        <p class="text-sm text-gray-500">
          Consulta, edita o elimina las órdenes registradas para la jornada actual.
        </p>
      </div>
    </div>

    <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto]">
        <InputText
          v-model="search"
          placeholder="Buscar orden, mecánico o referencia"
          class="w-full"
        />
        <Select
          v-model="areaFilter"
          :options="areaOptions"
          placeholder="Área"
          show-clear
          class="w-full"
        />
        <Select
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Estatus"
          show-clear
          class="w-full"
        />
        <Button label="Recargar" :loading="todayWorkOrdersLoading" @click="loadOrders" />
      </div>

      <p v-if="todayWorkOrdersError" class="mb-3 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">
        {{ todayWorkOrdersError }}
      </p>

      <WorkOrderTable
        :rows="filteredRows"
        :loading="todayWorkOrdersLoading"
        @view="openPanel($event, 'view')"
        @edit="openPanel($event, 'edit')"
        @delete="confirmDelete"
      />
    </div>

    <WorkOrderPanel
      v-model:visible="isPanelVisible"
      :mode="panelMode"
      :row="selectedRow"
      :saving="isSaving"
      :errors="formErrors"
      @change-mode="setPanelMode"
      @delete="confirmDelete"
      @save="saveWorkOrder"
    />
  </section>
</template>

<style scoped>
.admin-work-hours :deep(.p-inputtext),
.admin-work-hours :deep(.p-select),
.admin-work-hours :deep(.p-button) {
  border-radius: 8px;
}

.admin-work-hours :deep(.p-inputtext),
.admin-work-hours :deep(.p-select) {
  border-color: var(--color-gray-200);
  background: var(--color-white);
  color: var(--color-gray-700);
  font-size: 0.875rem;
  min-height: 2.35rem;
}

.admin-work-hours :deep(.p-select-label) {
  align-items: center;
  display: flex;
  min-height: 2.2rem;
  padding: 0.45rem 0.75rem;
}

.admin-work-hours :deep(.p-select-dropdown) {
  color: var(--color-gray-400);
  width: 2rem;
}

.admin-work-hours :deep(.p-inputtext:enabled:focus),
.admin-work-hours :deep(.p-select:not(.p-disabled).p-focus) {
  border-color: var(--color-main);
  box-shadow: 0 0 0 2px rgba(0, 70, 67, 0.12);
}

.admin-work-hours :deep(.p-button) {
  border-color: var(--color-main);
  background: var(--color-main);
  color: var(--color-white);
  font-weight: 700;
  font-size: 0.8125rem;
  padding: 0.55rem 0.9rem;
}

.admin-work-hours :deep(.p-button .p-button-label) {
  font-weight: 700;
}

@media (max-width: 640px) {
  .admin-work-hours {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .admin-work-hours > div.rounded-lg {
    padding: 0.75rem;
  }
}

.admin-work-hours :deep(.p-button:hover) {
  border-color: var(--color-main-light);
  background: var(--color-main-light);
}

.admin-work-hours :deep(.p-toast-message) {
  border-radius: 8px;
}

.admin-work-hours :deep(.p-confirmdialog) {
  border-radius: 8px;
}
</style>
