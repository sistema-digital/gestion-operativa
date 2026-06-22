<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useCrearSolicitudCompraWizard } from '@/composables/compras/useCrearSolicitudCompraWizard';
import { useSolicitudesCompraCrearStore } from '@/stores/db_compras/solicitudes_compra/solicitudesCompraCrear.store';

import CrearSolicitudCompraFooterActions from '@/components/compras/crear/CrearSolicitudCompraFooterActions.vue';
import CrearSolicitudCompraHeader from '@/components/compras/crear/CrearSolicitudCompraHeader.vue';
import CrearSolicitudCompraStepDatosBase from '@/components/compras/crear/CrearSolicitudCompraStepDatosBase.vue';
import CrearSolicitudCompraStepObservaciones from '@/components/compras/crear/CrearSolicitudCompraStepObservaciones.vue';
import CrearSolicitudCompraStepProductos from '@/components/compras/crear/CrearSolicitudCompraStepProductos.vue';
import CrearSolicitudCompraStepResumen from '@/components/compras/crear/CrearSolicitudCompraStepResumen.vue';
import CrearSolicitudCompraStepper from '@/components/compras/crear/CrearSolicitudCompraStepper.vue';

const router = useRouter();
const createStore = useSolicitudesCompraCrearStore();

const {
  currentStep,
  tipoSolicitud,
  fechaEntrega,
  equipos,
  productos,
  servicios,
  observacion,
  solicitarUrgente,
  motivoUrgencia,
  loading,
  createError,
  validationErrors,
  searchResults,
  isSearching,
  equiposSearchError,
  headerContext,
  isCurrentStepValid,
  onNext,
  onBack,
  onSubmit,
  setTipoSolicitud,
  setFechaEntrega,
  setObservacion,
  setSolicitarUrgente,
  setMotivoUrgencia,
  buscarEquipos,
  agregarEquipo,
  removerEquipo,
  addTemporaryProduct,
  agregarServicio,
  removerProducto,
  removerServicio,
} = useCrearSolicitudCompraWizard();

const shouldDisableNext = computed(() =>
  currentStep.value === 1 ? !isCurrentStepValid.value : false
);

const creationContextSnapshot = computed(() => ({
  currentStep: currentStep.value,
  tipoSolicitud: tipoSolicitud.value,
  fechaEntrega: fechaEntrega.value,
  equipos: [...equipos.value],
  productos: [...productos.value],
  servicios: [...servicios.value],
  observacion: observacion.value,
  solicitarUrgente: solicitarUrgente.value,
  motivoUrgencia: motivoUrgencia.value,
  validationErrors: { ...validationErrors.value },
}));

const closeView = (): void => {
  void router.push({ name: 'Compras' });
};

const handleNext = (): void => {
  console.log('Solicitud compra contexto actual', creationContextSnapshot.value);
  onNext();
};

const handleSubmit = async (mode: 'draft' | 'send'): Promise<void> => {
  await onSubmit(mode);
  void router.push({ name: 'Compras' });
};

onMounted(() => {
  createStore.reset();
  void createStore.initialize();
});

onBeforeUnmount(() => {
  createStore.reset();
});
</script>

<template>
  <section class="min-h-screen overflow-y-auto bg-[#EEECE4] lg:h-screen lg:overflow-hidden">
    <div class="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-4 grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] gap-1 px-3 py-1 lg:h-full lg:min-h-0 lg:px-4 lg:py-1">
      <div class="col-span-4 row-start-1">
        <CrearSolicitudCompraHeader
          :solicitante-nombre="headerContext.solicitanteNombre"
          :area-nombre="headerContext.areaNombre"
          :fecha-creacion-local="headerContext.fechaCreacionLocal"
        />
      </div>

      <div class="col-span-4 row-start-2">
        <CrearSolicitudCompraStepper :current-step="currentStep" />
      </div>

      <p
        v-if="createError"
        class="col-span-4 row-start-3 rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger lg:text-sm"
      >
        {{ createError }}
      </p>

      <div
        class="col-span-4 row-start-4 flex min-h-0 flex-col overflow-visible lg:overflow-hidden"
      >
        <CrearSolicitudCompraStepDatosBase
          v-if="currentStep === 1"
          :tipo-solicitud="tipoSolicitud"
          :fecha-entrega="fechaEntrega"
          :equipos="equipos"
          :validation-errors="validationErrors"
          :search-results="searchResults"
          :is-searching="isSearching"
          :search-error="equiposSearchError"
          @update:tipo-solicitud="setTipoSolicitud"
          @update:fecha-entrega="setFechaEntrega"
          @search:equipos="buscarEquipos"
          @add:equipo="agregarEquipo"
          @remove:equipo="removerEquipo"
        />

        <CrearSolicitudCompraStepProductos
          v-else-if="currentStep === 2"
          :tipo-solicitud="tipoSolicitud"
          :productos="productos"
          :servicios="servicios"
          :productos-error="validationErrors.productos"
          :servicios-error="validationErrors.servicios"
          @add-producto-temporal="addTemporaryProduct"
          @remove-producto="removerProducto"
          @add-servicio="agregarServicio"
          @remove-servicio="removerServicio"
        />

        <CrearSolicitudCompraStepObservaciones
          v-else-if="currentStep === 3"
          :observacion="observacion"
          :solicitar-urgente="solicitarUrgente"
          :motivo-urgencia="motivoUrgencia"
          :observacion-error="validationErrors.observacion"
          :motivo-urgencia-error="validationErrors.motivoUrgencia"
          @update:observacion="setObservacion"
          @update:solicitar-urgente="setSolicitarUrgente"
          @update:motivo-urgencia="setMotivoUrgencia"
        />

        <CrearSolicitudCompraStepResumen
          v-else
          :tipo-solicitud="tipoSolicitud"
          :fecha-entrega="fechaEntrega"
          :equipos="equipos"
          :productos="productos"
          :servicios="servicios"
          :observacion="observacion"
          :solicitar-urgente="solicitarUrgente"
          :motivo-urgencia="motivoUrgencia"
        />
      </div>

      <div class="col-span-4 row-start-5 shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
        <CrearSolicitudCompraFooterActions
          :current-step="currentStep"
          :loading="loading"
          :disable-next="shouldDisableNext"
          @cancel="closeView"
          @back="onBack"
          @next="handleNext"
          @draft="handleSubmit('draft')"
          @send="handleSubmit('send')"
        />
      </div>
    </div>
  </section>
</template>
