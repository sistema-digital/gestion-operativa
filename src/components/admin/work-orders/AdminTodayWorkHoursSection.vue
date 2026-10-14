<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import Multiselect from "vue-multiselect";
import { es } from "date-fns/locale";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";
import Toast from "primevue/toast";
import WorkOrderPanel from "./WorkOrderPanel.vue";
import WorkOrderTable from "./WorkOrderTable.vue";
import { PANEL_ADMIN_FEATURES } from "@/constants/panelAdminPermissions";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { useHorasTrabajoStore } from "@/stores/horasTrabajoStore";
import {
  getLocalDateInputValue,
  getWorkOrderReference,
  validateWorkOrderUpdate,
} from "@/stores/horasTrabajo.helpers";
import type {
  WorkOrderFormErrors,
  WorkOrderPanelMode,
  WorkOrderTodayRow,
  WorkOrderUpdatePayload,
} from "@/stores/horasTrabajo.types";

const horasTrabajoStore = useHorasTrabajoStore();
const featureAccessStore = useFeatureAccessStore();
const {
  todayWorkOrders,
  todayWorkOrdersLoading,
  todayWorkOrdersError,
  todayWorkOrdersDate,
} = storeToRefs(horasTrabajoStore);
const confirm = useConfirm();
const toast = useToast();

const search = ref("");
const statusFilter = ref<string | null>(null);
const areaFilter = ref<string | null>(null);
const selectedDate = ref(todayWorkOrdersDate.value || getLocalDateInputValue());
const selectedRow = ref<WorkOrderTodayRow | null>(null);
const panelMode = ref<WorkOrderPanelMode>("view");
const isPanelVisible = ref(false);
const isSaving = ref(false);
const formErrors = ref<WorkOrderFormErrors>({});

const canEditWorkHours = computed(() =>
  featureAccessStore.tieneFuncionalidad(PANEL_ADMIN_FEATURES.editWorkHours),
);
const canDeleteWorkHours = computed(() =>
  featureAccessStore.tieneFuncionalidad(PANEL_ADMIN_FEATURES.deleteWorkHours),
);

const selectedDateValue = computed<Date | null>({
  get: () => {
    const date = new Date(`${selectedDate.value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  },
  set: (date) => {
    if (!date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    selectedDate.value = `${year}-${month}-${day}`;
  },
});

const statusOptions = computed(() => {
  return [
    ...new Set(todayWorkOrders.value.map((row) => row.estatus).filter(Boolean)),
  ].sort();
});

const areaOptions = computed(() => {
  return [
    ...new Set(todayWorkOrders.value.map((row) => row.area).filter(Boolean)),
  ].sort();
});

const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase();

  return todayWorkOrders.value.filter((row) => {
    const matchesStatus =
      !statusFilter.value || row.estatus === statusFilter.value;
    const matchesArea = !areaFilter.value || row.area === areaFilter.value;
    const haystack = [
      getWorkOrderReference(row),
      row.mecanicoNombre,
      row.area,
      row.equipoTrabajo,
      row.causa,
      row.estatus,
    ]
      .join(" ")
      .toLowerCase();

    return matchesStatus && matchesArea && (!term || haystack.includes(term));
  });
});

const loadOrders = async () => {
  try {
    await horasTrabajoStore.fetchTodayWorkOrders(selectedDate.value);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "No se pudo cargar",
      detail:
        error instanceof Error
          ? error.message
          : "Error al cargar las órdenes de trabajo.",
      life: 3500,
    });
  }
};

const openPanel = (row: WorkOrderTodayRow, mode: WorkOrderPanelMode) => {
  selectedRow.value = row;
  panelMode.value = mode === "edit" && !canEditWorkHours.value ? "view" : mode;
  formErrors.value = {};
  isPanelVisible.value = true;
};

const saveWorkOrder = async (payload: WorkOrderUpdatePayload) => {
  if (!canEditWorkHours.value) {
    toast.add({
      severity: "warn",
      summary: "Acción no autorizada",
      detail: "No tienes permiso para editar órdenes de trabajo.",
      life: 3500,
    });
    return;
  }

  formErrors.value = validateWorkOrderUpdate(payload);
  if (Object.keys(formErrors.value).length || !selectedRow.value) return;

  isSaving.value = true;
  try {
    await horasTrabajoStore.updateWorkOrder(selectedRow.value.idOt, payload);
    toast.add({
      severity: "success",
      summary: "Orden actualizada",
      life: 2500,
    });
    isPanelVisible.value = false;
    await loadOrders();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "No se pudo guardar",
      detail:
        error instanceof Error
          ? error.message
          : "Error al actualizar la orden.",
      life: 3500,
    });
  } finally {
    isSaving.value = false;
  }
};

const deleteWorkOrder = async (row: WorkOrderTodayRow) => {
  if (!canDeleteWorkHours.value) {
    toast.add({
      severity: "warn",
      summary: "Acción no autorizada",
      detail: "No tienes permiso para eliminar órdenes de trabajo.",
      life: 3500,
    });
    return;
  }

  try {
    await horasTrabajoStore.deleteWorkOrder(row.idOt);
    toast.add({ severity: "success", summary: "Orden eliminada", life: 2500 });
    if (selectedRow.value?.idOt === row.idOt) isPanelVisible.value = false;
    await loadOrders();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "No se pudo eliminar",
      detail:
        error instanceof Error ? error.message : "Error al eliminar la orden.",
      life: 3500,
    });
  }
};

const confirmDelete = (row: WorkOrderTodayRow) => {
  if (!canDeleteWorkHours.value) {
    void deleteWorkOrder(row);
    return;
  }

  confirm.require({
    message:
      "¿Deseas eliminar esta orden de trabajo? Esta acción no se puede deshacer.",
    header: "Eliminar orden de trabajo",
    rejectLabel: "Cancelar",
    acceptLabel: "Eliminar",
    acceptClass: "p-button-danger",
    accept: () => deleteWorkOrder(row),
  });
};

const setPanelMode = (mode: WorkOrderPanelMode) => {
  if (mode === "edit" && !canEditWorkHours.value) return;

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
        <h1 class="text-2xl font-bold text-gray-800">
          Horas de trabajo por fecha
        </h1>
        <p class="text-sm text-gray-500">
          Consulta, edita o elimina las órdenes registradas para la fecha
          seleccionada.
        </p>
      </div>
    </div>

    <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div
        class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_11rem_12rem_12rem_auto]"
      >
        <InputText
          v-model="search"
          placeholder="Buscar orden, mecánico o referencia"
          class="w-full"
        />
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-gray-500"> Fecha </span>
          <VueDatePicker
            v-model="selectedDateValue"
            :enable-time-picker="false"
            :locale="es"
            auto-apply
            class="admin-work-hours-datepicker"
            input-class-name="admin-work-hours-datepicker-input"
            placeholder="Selecciona una fecha"
            @update:model-value="loadOrders"
          />
        </div>
        <Multiselect
          v-model="areaFilter"
          :options="areaOptions"
          placeholder="Área"
          :show-labels="false"
          :allow-empty="true"
          class="admin-work-hours-multiselect"
        />
        <Multiselect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Estatus"
          :show-labels="false"
          :allow-empty="true"
          class="admin-work-hours-multiselect"
        />
        <Button
          label="Recargar"
          :loading="todayWorkOrdersLoading"
          class="cursor-pointer"
          @click="loadOrders"
        />
      </div>

      <p
        v-if="todayWorkOrdersError"
        class="mb-3 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger"
      >
        {{ todayWorkOrdersError }}
      </p>

      <WorkOrderTable
        :rows="filteredRows"
        :loading="todayWorkOrdersLoading"
        :can-edit="canEditWorkHours"
        :can-delete="canDeleteWorkHours"
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
      :can-edit="canEditWorkHours"
      :can-delete="canDeleteWorkHours"
      @change-mode="setPanelMode"
      @delete="confirmDelete"
      @save="saveWorkOrder"
    />
  </section>
</template>

<style scoped>
.admin-work-hours :deep(.p-inputtext),
.admin-work-hours :deep(.multiselect),
.admin-work-hours :deep(.p-button) {
  border-radius: 8px;
}

.admin-work-hours :deep(.p-inputtext),
.admin-work-hours :deep(.multiselect) {
  border-color: var(--color-gray-200);
  background: var(--color-white);
  color: var(--color-gray-700);
  font-size: 0.875rem;
  min-height: 2.35rem;
}

.admin-work-hours :deep(.multiselect__select) {
  align-items: center;
  display: flex;
  height: 2.35rem;
}

.admin-work-hours :deep(.multiselect__tags) {
  border: 0;
  border-radius: 8px;
  min-height: 2.25rem;
  padding: 0.42rem 2.1rem 0.42rem 0.75rem;
}

.admin-work-hours :deep(.multiselect__single),
.admin-work-hours :deep(.multiselect__input),
.admin-work-hours :deep(.multiselect__placeholder) {
  margin: 0;
  padding: 0;
}

.admin-work-hours :deep(.multiselect__select) {
  color: var(--color-gray-400);
  width: 2rem;
}

.admin-work-hours :deep(.p-inputtext:enabled:focus),
.admin-work-hours :deep(.multiselect--active) {
  border-color: var(--color-main);
  box-shadow: 0 0 0 2px rgba(0, 70, 67, 0.12);
}

.admin-work-hours :deep(.multiselect__content-wrapper) {
  border-color: var(--color-gray-200);
  border-radius: 8px;
}

.admin-work-hours :deep(.multiselect__option--highlight),
.admin-work-hours :deep(.multiselect__option--highlight::after) {
  background: var(--color-main);
}

.admin-work-hours :deep(.admin-work-hours-datepicker-input) {
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  color: var(--color-gray-700);
  font-size: 0.875rem;
  min-height: 2.35rem;
}

.admin-work-hours :deep(.admin-work-hours-datepicker-input:focus) {
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
