<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { shallowRef } from 'vue';
import { useRouter } from 'vue-router';

import { useCrearSolicitudCompraWizard } from '@/composables/compras/useCrearSolicitudCompraWizard';
import type { CatalogoServicioContextoOption } from '@/stores/db_compras/catalogo_servicio_contexto/catalogoServicioContexto.types';
import { useSolicitudesCompraCrearStore } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store';
import type {
  ProductoSolicitudTemporalItem,
  ProductoTemporalDraft,
  ServicioSolicitudDraft,
  ServicioSolicitudItem,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

import CrearSolicitudCompraServicioBottomSheet from '@/components/compras/crear/CrearSolicitudCompraServicioBottomSheet.vue';
import CrearSolicitudCompraServicioDrawer from '@/components/compras/crear/CrearSolicitudCompraServicioDrawer.vue';
import CrearSolicitudCompraFooterActions from '@/components/compras/crear/CrearSolicitudCompraFooterActions.vue';
import CrearSolicitudCompraHeader from '@/components/compras/crear/CrearSolicitudCompraHeader.vue';
import CrearSolicitudCompraProductoTemporalOverlay from '@/components/compras/crear/CrearSolicitudCompraProductoTemporalOverlay.vue';
import CrearSolicitudCompraStepDatosBase from '@/components/compras/crear/CrearSolicitudCompraStepDatosBase.vue';
import CrearSolicitudCompraStepObservaciones from '@/components/compras/crear/CrearSolicitudCompraStepObservaciones.vue';
import CrearSolicitudCompraStepProductos from '@/components/compras/crear/CrearSolicitudCompraStepProductos.vue';
import CrearSolicitudCompraStepResumen from '@/components/compras/crear/CrearSolicitudCompraStepResumen.vue';
import CrearSolicitudCompraStepServicios from '@/components/compras/crear/CrearSolicitudCompraStepServicios.vue';
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
  productSearchQuery,
  productSearchResults,
  productSearchLoading,
  productSearchError,
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
  setProductSearchQuery,
  buscarEquipos,
  buscarProductos,
  agregarEquipo,
  agregarContextoServicio,
  removerEquipo,
  agregarProductoExistente,
  agregarProductoTemporal,
  actualizarProductoTemporal,
  agregarServicio,
  actualizarServicio,
  removerProducto,
  removerServicio,
} = useCrearSolicitudCompraWizard();

const createEmptyTemporalDraft = (descripcion = ''): ProductoTemporalDraft => ({
  descripcion,
  unidadCodigo: '',
  unidadLabel: '',
});

const createEmptyServicioDraft = (): ServicioSolicitudDraft => ({
  cantidad: 1,
  descripcion: '',
  unidadCodigo: '',
  unidadLabel: '',
});

const isProductoTemporalOverlayOpen = shallowRef(false);
const productoTemporalOverlayMode = shallowRef<'create' | 'edit'>('create');
const editingTemporalLocalId = shallowRef<string | null>(null);
const productoTemporalDraft = ref<ProductoTemporalDraft>(createEmptyTemporalDraft());
const isServicioOverlayOpen = shallowRef(false);
const servicioOverlayMode = shallowRef<'create' | 'edit'>('create');
const editingServicioLocalId = shallowRef<string | null>(null);
const servicioDraft = ref<ServicioSolicitudDraft>(createEmptyServicioDraft());
const viewportWidth = shallowRef(typeof window === 'undefined' ? 1280 : window.innerWidth);
const isDesktop = computed(() => viewportWidth.value >= 1024);

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

const closeProductoTemporalOverlay = (): void => {
  isProductoTemporalOverlayOpen.value = false;
  productoTemporalOverlayMode.value = 'create';
  editingTemporalLocalId.value = null;
  productoTemporalDraft.value = createEmptyTemporalDraft();
};

const closeServicioOverlay = (): void => {
  isServicioOverlayOpen.value = false;
  servicioOverlayMode.value = 'create';
  editingServicioLocalId.value = null;
  servicioDraft.value = createEmptyServicioDraft();
};

const handleManualRequest = (initialDescripcion: string): void => {
  productoTemporalOverlayMode.value = 'create';
  editingTemporalLocalId.value = null;
  productoTemporalDraft.value = createEmptyTemporalDraft(initialDescripcion);
  isProductoTemporalOverlayOpen.value = true;
};

const handleEditProductoTemporal = (item: ProductoSolicitudTemporalItem): void => {
  productoTemporalOverlayMode.value = 'edit';
  editingTemporalLocalId.value = item.localId;
  productoTemporalDraft.value = {
    descripcion: item.descripcion,
    unidadCodigo: item.unidadCodigo,
    unidadLabel: item.unidadLabel,
  };
  isProductoTemporalOverlayOpen.value = true;
};

const handleSubmitProductoTemporal = (draft: ProductoTemporalDraft): void => {
  if (productoTemporalOverlayMode.value === 'edit' && editingTemporalLocalId.value) {
    actualizarProductoTemporal(editingTemporalLocalId.value, draft);
  } else {
    agregarProductoTemporal(draft);
  }

  closeProductoTemporalOverlay();
};

const handleAddServicio = (): void => {
  servicioOverlayMode.value = 'create';
  editingServicioLocalId.value = null;
  servicioDraft.value = createEmptyServicioDraft();
  isServicioOverlayOpen.value = true;
};

const handleEditServicio = (item: ServicioSolicitudItem): void => {
  servicioOverlayMode.value = 'edit';
  editingServicioLocalId.value = item.localId;
  servicioDraft.value = {
    cantidad: item.cantidad,
    descripcion: item.descripcion,
    unidadCodigo: item.unidadCodigo,
    unidadLabel: item.unidadLabel,
  };
  isServicioOverlayOpen.value = true;
};

const handleSubmitServicio = (draft: ServicioSolicitudDraft): void => {
  if (servicioOverlayMode.value === 'edit' && editingServicioLocalId.value) {
    actualizarServicio(editingServicioLocalId.value, draft);
  } else {
    agregarServicio(draft);
  }

  closeServicioOverlay();
};

const handleAddContextoServicio = (item: CatalogoServicioContextoOption): void => {
  agregarContextoServicio(item);
};

const syncViewportWidth = (): void => {
  viewportWidth.value = window.innerWidth;
};

onMounted(() => {
  createStore.reset();
  void createStore.initialize();
  window.addEventListener('resize', syncViewportWidth);
});

onBeforeUnmount(() => {
  createStore.reset();
  window.removeEventListener('resize', syncViewportWidth);
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
          @add:contexto-servicio="handleAddContextoServicio"
          @remove:equipo="removerEquipo"
        />

        <CrearSolicitudCompraStepProductos
          v-else-if="currentStep === 2 && tipoSolicitud !== 'servicio'"
          :tipo-solicitud="tipoSolicitud"
          :search-query="productSearchQuery"
          :search-results="productSearchResults"
          :is-searching="productSearchLoading"
          :search-error="productSearchError"
          :productos="productos"
          :servicios="servicios"
          :productos-error="validationErrors.productos"
          :servicios-error="validationErrors.servicios"
          @update:search-query="setProductSearchQuery"
          @search:productos="buscarProductos"
          @add-producto-existente="agregarProductoExistente"
          @remove-producto="removerProducto"
          @remove-servicio="removerServicio"
          @manual-request="handleManualRequest"
          @edit-producto-temporal="handleEditProductoTemporal"
        />

        <CrearSolicitudCompraStepServicios
          v-else-if="currentStep === 2"
          :servicios="servicios"
          :servicios-error="validationErrors.servicios"
          @add="handleAddServicio"
          @edit="handleEditServicio"
          @remove="removerServicio"
        />

        <CrearSolicitudCompraStepObservaciones
          v-else-if="currentStep === 3"
          :observacion="observacion"
          :equipos="equipos"
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

    <CrearSolicitudCompraProductoTemporalOverlay
      v-if="isProductoTemporalOverlayOpen"
      :mode="productoTemporalOverlayMode"
      :initial-draft="productoTemporalDraft"
      @cancel="closeProductoTemporalOverlay"
      @submit="handleSubmitProductoTemporal"
    />

    <CrearSolicitudCompraServicioDrawer
      v-if="isServicioOverlayOpen && isDesktop"
      :mode="servicioOverlayMode"
      :initial-draft="servicioDraft"
      @cancel="closeServicioOverlay"
      @submit="handleSubmitServicio"
    />

    <CrearSolicitudCompraServicioBottomSheet
      v-else-if="isServicioOverlayOpen"
      :mode="servicioOverlayMode"
      :initial-draft="servicioDraft"
      @cancel="closeServicioOverlay"
      @submit="handleSubmitServicio"
    />
  </section>
</template>
