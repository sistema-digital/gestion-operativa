<script setup lang="ts">
import CrearSolicitudEquiposSelector from './CrearSolicitudEquiposSelector.vue';
import CrearSolicitudFechaField from './CrearSolicitudFechaField.vue';
import CrearSolicitudTipoField from './CrearSolicitudTipoField.vue';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import type {
  CrearSolicitudFieldErrors,
  EquipoSeleccionado,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

defineProps<{
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  fechaEntrega: string | null;
  equipos: EquipoSeleccionado[];
  validationErrors: CrearSolicitudFieldErrors;
  searchResults: EquipoOption[];
  isSearching: boolean;
  searchError: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:tipoSolicitud', value: SolicitudCompraTipoSolicitud | null): void;
  (e: 'update:fechaEntrega', value: string | null): void;
  (e: 'search:equipos', value: string): void;
  (e: 'add:equipo', item: EquipoOption): void;
  (e: 'remove:equipo', codEquipo: string): void;
}>();

const emitTipoSolicitud = (
  value: SolicitudCompraTipoSolicitud | null | undefined
): void => {
  emit('update:tipoSolicitud', value ?? null);
};

const emitFechaEntrega = (value: string | null | undefined): void => {
  emit('update:fechaEntrega', value ?? null);
};
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-stone-200 bg-white px-3 py-1 shadow-sm lg:overflow-hidden lg:px-4">
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="grid gap-4 lg:grid-cols-2">
        <CrearSolicitudTipoField
          :model-value="tipoSolicitud"
          :error="validationErrors.tipoSolicitud"
          @update:model-value="emitTipoSolicitud"
        />

        <CrearSolicitudFechaField
          :model-value="fechaEntrega"
          :error="validationErrors.fechaEntrega"
          @update:model-value="emitFechaEntrega"
        />
      </div>

      <CrearSolicitudEquiposSelector
        class="min-h-0 flex-1"
        :selected-items="equipos"
        :search-results="searchResults"
        :is-searching="isSearching"
        :search-error="searchError"
        :field-error="validationErrors.equipos"
        @search="emit('search:equipos', $event)"
        @add="emit('add:equipo', $event)"
        @remove="emit('remove:equipo', $event)"
      />
    </div>
  </section>
</template>
