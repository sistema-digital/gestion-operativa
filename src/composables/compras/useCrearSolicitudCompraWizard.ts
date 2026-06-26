import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useEquiposStore } from '@/stores/dbequipos/equipos/equipos.store';
import { useSolicitudesCompraCrearStore } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store';
import type {
  ProductoTemporalDraft,
  ServicioSolicitudDraft,
  SolicitudCompraSubmitMode,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

export const useCrearSolicitudCompraWizard = () => {
  const store = useSolicitudesCompraCrearStore();
  const equiposStore = useEquiposStore();

  const storeRefs = storeToRefs(store);
  const equiposRefs = storeToRefs(equiposStore);

  const stepTitle = computed(() => {
    switch (storeRefs.currentStep.value) {
      case 1:
        return 'Datos base';
      case 2:
        return storeRefs.tipoSolicitud.value === 'servicio'
          ? 'Servicios'
          : 'Productos';
      case 3:
        return 'Observaciones';
      default:
        return 'Resumen';
    }
  });

  const headerContext = computed(() => ({
    solicitanteNombre: storeRefs.solicitanteNombre.value,
    solicitanteEmail: storeRefs.solicitanteEmail.value,
    areaNombre: storeRefs.areaNombre.value,
    fechaCreacionLocal: storeRefs.fechaCreacionLocal.value,
  }));

  const onNext = (): boolean => store.goToNextStep();
  const onBack = (): void => store.goToPreviousStep();

  const onSubmit = async (
    mode: Exclude<SolicitudCompraSubmitMode, null>
  ): Promise<void> => {
    await store.submit(mode);
  };

  return {
    currentStep: storeRefs.currentStep,
    tipoSolicitud: storeRefs.tipoSolicitud,
    fechaEntrega: storeRefs.fechaEntrega,
    equipos: storeRefs.equipos,
    productos: storeRefs.productos,
    servicios: storeRefs.servicios,
    observacion: storeRefs.observacion,
    solicitarUrgente: storeRefs.solicitarUrgente,
    motivoUrgencia: storeRefs.motivoUrgencia,
    productSearchQuery: storeRefs.productSearchQuery,
    productSearchResults: storeRefs.productSearchResults,
    productSearchLoading: storeRefs.productSearchLoading,
    productSearchError: storeRefs.productSearchError,
    validationErrors: storeRefs.validationErrors,
    loading: storeRefs.loading,
    createError: storeRefs.error,
    searchResults: equiposRefs.searchResults,
    isSearching: equiposRefs.isSearching,
    equiposSearchError: equiposRefs.error,
    stepTitle,
    headerContext,
    isCurrentStepValid: computed(() => store.isCurrentStepValid),
    onNext,
    onBack,
    onSubmit,
    setTipoSolicitud: store.setTipoSolicitud,
    setFechaEntrega: store.setFechaEntrega,
    setObservacion: store.setObservacion,
    setSolicitarUrgente: store.setSolicitarUrgente,
    setMotivoUrgencia: store.setMotivoUrgencia,
    setProductSearchQuery: store.setProductSearchQuery,
    buscarEquipos: store.buscarEquipos,
    agregarEquipo: store.agregarEquipo,
    agregarContextoServicio: store.agregarContextoServicio,
    removerEquipo: store.removerEquipo,
    buscarProductos: store.buscarProductos,
    agregarProductoExistente: store.agregarProductoExistente,
    agregarProductoTemporal: (item: ProductoTemporalDraft) => store.agregarProductoTemporal(item),
    actualizarProductoTemporal: (localId: string, item: ProductoTemporalDraft) =>
      store.actualizarProductoTemporal(localId, item),
    removerProducto: store.removerProducto,
    agregarServicio: (item: ServicioSolicitudDraft) => store.agregarServicio(item),
    actualizarServicio: (localId: string, item: ServicioSolicitudDraft) =>
      store.actualizarServicio(localId, item),
    removerServicio: store.removerServicio,
  };
};
