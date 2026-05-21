<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';
import {
  emptyText,
  formatWorkOrderDate,
  getWorkOrderStatusSeverity,
} from '@/stores/horasTrabajo.helpers';
import type { WorkOrderTodayRow } from '@/stores/horasTrabajo.types';

defineProps<{
  rows: WorkOrderTodayRow[];
  loading: boolean;
}>();

const emit = defineEmits<{
  view: [row: WorkOrderTodayRow];
  edit: [row: WorkOrderTodayRow];
  delete: [row: WorkOrderTodayRow];
}>();

const getReferenceId = (row: WorkOrderTodayRow): string => {
  if (row.idOm) return row.idOm;
  if (row.idSg) return row.idSg.slice(0, 8);
  return '—';
};
</script>

<template>
  <div class="admin-work-order-table overflow-hidden rounded-lg border border-gray-100 bg-white">
    <div v-if="loading" class="space-y-3 p-4">
      <Skeleton v-for="item in 6" :key="item" height="2.5rem" />
    </div>

    <DataTable
      v-else
      :value="rows"
      data-key="idOt"
      size="small"
      striped-rows
      paginator
      :rows="10"
      :rows-per-page-options="[10, 20, 50]"
      current-page-report-template="Mostrando {first} a {last} de {totalRecords} órdenes"
      paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      scrollable
      scroll-height="flex"
      table-style="min-width: 860px"
    >
      <template #empty>
        <div class="py-10 text-center text-sm text-gray-400">
          No hay órdenes registradas para la jornada actual.
        </div>
      </template>

      <Column header="Referencia">
        <template #body="{ data }">
          <span class="font-mono text-xs font-semibold text-main">
            {{ getReferenceId(data) }}
          </span>
        </template>
      </Column>

      <Column header="Mecánico" frozen style="min-width: 12rem" class="font-bold">
        <template #body="{ data }">
          {{ emptyText(data.mecanicoNombre) }}
        </template>
      </Column>

      <Column header="Área">
        <template #body="{ data }">
          {{ emptyText(data.area) }}
        </template>
      </Column>

      <Column header="Fecha">
        <template #body="{ data }">
          {{ formatWorkOrderDate(data.fecha) }}
        </template>
      </Column>

      <Column header="Duración">
        <template #body="{ data }">
          {{ data.duracionHoras }} h
        </template>
      </Column>

      <Column header="Estatus">
        <template #body="{ data }">
          <Tag :value="data.estatus || 'Sin estatus'" :severity="getWorkOrderStatusSeverity(data.estatus)" />
        </template>
      </Column>

      <Column header="Retraso">
        <template #body="{ data }">
          {{ data.retrasoHoras ? `${data.retrasoHoras} h` : '—' }}
        </template>
      </Column>

      <Column header="Causa">
        <template #body="{ data }">
          <span class="line-clamp-2">{{ emptyText(data.causa) }}</span>
        </template>
      </Column>

      <Column header="Acciones" frozen align-frozen="right">
        <template #body="{ data }">
          <div class="flex items-center justify-end gap-1">
            <Button icon="pi pi-eye" variant="text" rounded aria-label="Ver" @click="emit('view', data)" />
            <Button icon="pi pi-pencil" variant="text" rounded aria-label="Editar" @click="emit('edit', data)" />
            <Button
              icon="pi pi-trash"
              variant="text"
              rounded
              severity="danger"
              aria-label="Eliminar"
              @click="emit('delete', data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.admin-work-order-table :deep(.p-datatable-wrapper) {
  border-radius: 8px;
  overflow-x: auto;
}

.admin-work-order-table :deep(.p-datatable-table) {
  border-collapse: collapse;
  font-size: 0.76rem;
  width: 100%;
}

.admin-work-order-table :deep(.p-datatable-thead > tr > th) {
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-white);
  color: var(--color-gray-700);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  padding: 0.78rem 0.75rem;
  white-space: nowrap;
}

.admin-work-order-table :deep(.p-datatable-tbody > tr > td) {
  border-bottom: 1px solid var(--color-gray-100);
  color: var(--color-gray-700);
  padding: 0.68rem 0.75rem;
  vertical-align: middle;
  white-space: nowrap;
}

.admin-work-order-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8fbfb;
}

.admin-work-order-table :deep(.p-tag) {
  border-radius: 999px;
  font-size: 0.64rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
}

.admin-work-order-table :deep(.p-button) {
  align-items: center;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.7rem;
  font-weight: 700;
  height: 1.8rem;
  justify-content: center;
  padding: 0;
  width: 1.8rem;
}

.admin-work-order-table :deep(.p-button-text),
.admin-work-order-table :deep(.p-button[variant="text"]) {
  background: transparent !important;
  border-color: transparent;
  color: var(--color-main) !important;
}

.admin-work-order-table :deep(.p-button-text:hover),
.admin-work-order-table :deep(.p-button[variant="text"]:hover) {
  background: transparent !important;
  color: var(--color-main-dark) !important;
}

.admin-work-order-table :deep(.p-button-danger.p-button-text) {
  background: transparent !important;
  color: var(--color-danger) !important;
}

.admin-work-order-table :deep(.p-button-danger.p-button-text:hover) {
  background: transparent !important;
  color: var(--color-danger) !important;
}

.admin-work-order-table :deep(.p-button-icon) {
  color: currentColor !important;
  font-size: 0.85rem;
}


.admin-work-order-table :deep(.p-paginator) {
  border: 0;
  background: var(--color-white);
  color: var(--color-gray-500);
  gap: 0.25rem;
  justify-content: space-between;
  padding: 0.9rem 0.75rem 0.2rem;
  font-size: 0.72rem;
}

.admin-work-order-table :deep(.p-paginator button),
.admin-work-order-table :deep(.p-paginator .p-select) {
  border-radius: 6px;
  min-width: 2rem;
}

.admin-work-order-table :deep(.p-paginator .p-highlight) {
  background: var(--color-main);
  color: var(--color-white);
}

@media (max-width: 640px) {
  .admin-work-order-table {
    border-radius: 8px;
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }

  .admin-work-order-table :deep(.p-datatable-table) {
    font-size: 0.72rem;
  }

  .admin-work-order-table :deep(.p-datatable-thead > tr > th),
  .admin-work-order-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.58rem 0.55rem;
  }

  .admin-work-order-table :deep(.p-paginator) {
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }

  .admin-work-order-table :deep(.p-paginator-current) {
    flex-basis: 100%;
    text-align: center;
  }
}
</style>
