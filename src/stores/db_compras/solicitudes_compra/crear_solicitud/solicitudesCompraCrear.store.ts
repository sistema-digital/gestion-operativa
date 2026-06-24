import { defineStore } from 'pinia';

import { useUserStore } from '@/stores/userStore';
import { useEquiposStore } from '@/stores/dbequipos/equipos/equipos.store';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';

import { solicitudesCompraCrearService } from './solicitudesCompraCrear.service';
import {
  createSolicitudDraftSchema,
  createSolicitudSendSchema,
  getCreateSolicitudSchemaByMode,
  stepDatosBaseSchema,
  stepObservacionesSchema,
  stepProductosSchema,
} from './solicitudesCompraCrear.schemas';
import type {
  CrearSolicitudFieldErrors,
  EquipoSeleccionado,
  ProductoCatalogoOption,
  ProductoSolicitudItem,
  ProductoTemporalDraft,
  ProductoSolicitudTemporalItem,
  ServicioSolicitudItem,
  SolicitudCompraCreateStep,
  SolicitudCompraCrearPayload,
  SolicitudCompraCrearResponse,
  SolicitudCompraCrearState,
  SolicitudCompraSubmitMode,
  SolicitudCompraTipoSolicitud,
} from './solicitudesCompraCrear.types';

const createInitialState = (): SolicitudCompraCrearState => ({
  currentStep: 1,
  submitMode: null,
  solicitanteNombre: '',
  solicitanteEmail: '',
  areaNombre: '',
  fechaCreacionLocal: new Date(),
  tipoSolicitud: null,
  fechaEntrega: null,
  equipos: [],
  productos: [],
  servicios: [],
  observacion: '',
  solicitarUrgente: false,
  motivoUrgencia: '',
  adjuntosLocales: [],
  adjuntosSubidos: [],
  uploadSession: null,
  productSearchQuery: '',
  productSearchResults: [],
  productSearchLoading: false,
  productSearchError: null,
  loading: false,
  uploading: false,
  error: null,
  validationErrors: {},
  initialized: false,
  lastCreatedResponse: null,
});

const formatZodErrors = (issues: Array<{ path: PropertyKey[]; message: string }>): CrearSolicitudFieldErrors => {
  const nextErrors: CrearSolicitudFieldErrors = {};

  issues.forEach((issue) => {
    const fieldKey = issue.path[0];

    if (typeof fieldKey !== 'string' || nextErrors[fieldKey as keyof CrearSolicitudFieldErrors]) {
      return;
    }

    nextErrors[fieldKey as keyof CrearSolicitudFieldErrors] = issue.message;
  });

  return nextErrors;
};

const toEquipoSeleccionado = (item: EquipoOption): EquipoSeleccionado => ({
  id: item.id,
  codEquipo: item.codEquipo,
  label: item.label,
  modelo: item.modelo,
  marca: item.marca,
  tipo: item.tipo,
});

const createLocalId = (): string => crypto.randomUUID();

export const useSolicitudesCompraCrearStore = defineStore('solicitudesCompraCrear', {
  state: (): SolicitudCompraCrearState => createInitialState(),

  getters: {
    isCurrentStepValid(state): boolean {
      if (state.currentStep === 1) {
        return stepDatosBaseSchema.safeParse({
          tipoSolicitud: state.tipoSolicitud,
          fechaEntrega: state.fechaEntrega,
          equipos: state.equipos,
        }).success;
      }

      if (state.currentStep === 2) {
        return stepProductosSchema.safeParse({
          tipoSolicitud: state.tipoSolicitud,
          productos: state.productos,
          servicios: state.servicios,
        }).success;
      }

      if (state.currentStep === 3) {
        return stepObservacionesSchema.safeParse({
          observacion: state.observacion,
          solicitarUrgente: state.solicitarUrgente,
          motivoUrgencia: state.motivoUrgencia,
        }).success;
      }

      return true;
    },
  },

  actions: {
    async initialize(): Promise<void> {
      const userStore = useUserStore();

      if (!userStore.isLoaded) {
        await userStore.fetchCurrentUserProfile().catch(() => null);
      }

      this.solicitanteNombre = userStore.nombre || 'Usuario actual';
      this.solicitanteEmail = userStore.email || '';
      this.areaNombre = userStore.profile?.area || userStore.area || 'Sin área';
      this.fechaCreacionLocal = new Date();
      this.initialized = true;
      this.error = null;
    },

    reset(): void {
      const userSnapshot = {
        solicitanteNombre: this.solicitanteNombre,
        solicitanteEmail: this.solicitanteEmail,
        areaNombre: this.areaNombre,
      };

      Object.assign(this, createInitialState());
      this.solicitanteNombre = userSnapshot.solicitanteNombre;
      this.solicitanteEmail = userSnapshot.solicitanteEmail;
      this.areaNombre = userSnapshot.areaNombre;
      this.fechaCreacionLocal = new Date();
      this.initialized = Boolean(
        userSnapshot.solicitanteNombre
        || userSnapshot.solicitanteEmail
        || userSnapshot.areaNombre
      );
      useEquiposStore().reset();
    },

    setTipoSolicitud(value: SolicitudCompraTipoSolicitud | null): void {
      const previousValue = this.tipoSolicitud;
      this.tipoSolicitud = value;

      if (value === 'servicio' && previousValue !== 'servicio') {
        this.productos = [];
        this.productSearchResults = [];
        this.productSearchQuery = '';
        delete this.validationErrors.productos;
      }

      if (value !== 'servicio' && previousValue === 'servicio') {
        this.servicios = [];
        delete this.validationErrors.servicios;
      }

      delete this.validationErrors.tipoSolicitud;
    },

    setFechaEntrega(value: string | null): void {
      this.fechaEntrega = value;
      delete this.validationErrors.fechaEntrega;
    },

    setObservacion(value: string): void {
      this.observacion = value;
      delete this.validationErrors.observacion;
    },

    setSolicitarUrgente(value: boolean): void {
      this.solicitarUrgente = value;
      if (!value) {
        this.motivoUrgencia = '';
        delete this.validationErrors.motivoUrgencia;
      }
    },

    setMotivoUrgencia(value: string): void {
      this.motivoUrgencia = value;
      delete this.validationErrors.motivoUrgencia;
    },

    setProductSearchQuery(value: string): void {
      this.productSearchQuery = value;
      this.productSearchError = null;

      if (!value.trim()) {
        this.productSearchResults = [];
      }
    },

    async buscarEquipos(query: string): Promise<void> {
      const equiposStore = useEquiposStore();

      try {
        await equiposStore.buscarEquipos(query);
      } catch (error) {
        this.error = error instanceof Error
          ? error.message
          : 'No se pudieron obtener los equipos';
      }
    },

    agregarEquipo(item: EquipoOption): void {
      const equiposStore = useEquiposStore();
      equiposStore.agregarEquipo(item);

      if (this.equipos.some((equipo) => equipo.codEquipo === item.codEquipo)) {
        return;
      }

      this.equipos = [...this.equipos, toEquipoSeleccionado(item)];
      delete this.validationErrors.equipos;
    },

    removerEquipo(codEquipo: string): void {
      const equiposStore = useEquiposStore();
      equiposStore.removerEquipo(codEquipo);
      this.equipos = this.equipos.filter((item) => item.codEquipo !== codEquipo);
    },

    async buscarProductos(query: string): Promise<void> {
      const normalizedQuery = query.trim();
      this.productSearchQuery = normalizedQuery;
      this.productSearchError = null;

      if (normalizedQuery.length < 2) {
        this.productSearchResults = [];
        this.productSearchLoading = false;
        return;
      }

      this.productSearchLoading = true;

      try {
        const rows = await solicitudesCompraCrearService.buscarProductos(normalizedQuery);
        this.productSearchResults = rows
          .map<ProductoCatalogoOption>((row) => ({
            productoId: row.producto_id,
            codProducto: row.cod_producto,
            descripcion: row.descripcion,
            unidadCodigo: row.unidad_codigo,
            unidadLabel: row.unidad_mostrar || row.unidad_abreviatura || row.unidad_codigo,
          }));
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'No se pudieron obtener los productos';

        this.productSearchResults = [];
        this.productSearchError = message;
      } finally {
        this.productSearchLoading = false;
      }
    },

    agregarProductoExistente(item: ProductoCatalogoOption): void {
      if (this.productos.some((product) => product.tipo === 'existente' && product.codProducto === item.codProducto)) {
        return;
      }

      this.productos = [
        ...this.productos,
        {
          localId: createLocalId(),
          tipo: 'existente',
          productoId: item.productoId,
          codProducto: item.codProducto,
          descripcion: item.descripcion,
          unidadCodigo: item.unidadCodigo,
          unidadLabel: item.unidadLabel,
        },
      ];
      delete this.validationErrors.productos;
    },

    agregarProductoTemporal(
      item: ProductoTemporalDraft
    ): void {
      this.productos = [
        ...this.productos,
        {
          localId: createLocalId(),
          tipo: 'temporal',
          temporal: true,
          ...item,
        },
      ];
      delete this.validationErrors.productos;
    },

    actualizarProductoTemporal(localId: string, item: ProductoTemporalDraft): void {
      this.productos = this.productos.map((product) => {
        if (product.localId !== localId || product.tipo !== 'temporal') {
          return product;
        }

        return {
          ...product,
          descripcion: item.descripcion,
          unidadCodigo: item.unidadCodigo,
          unidadLabel: item.unidadLabel,
        };
      });

      delete this.validationErrors.productos;
    },

    removerProducto(localId: string): void {
      this.productos = this.productos.filter((item) => item.localId !== localId);
    },

    agregarServicio(
      item: Omit<ServicioSolicitudItem, 'localId'>
    ): void {
      this.servicios = [
        ...this.servicios,
        {
          localId: createLocalId(),
          ...item,
        },
      ];
      delete this.validationErrors.servicios;
    },

    removerServicio(localId: string): void {
      this.servicios = this.servicios.filter((item) => item.localId !== localId);
    },

    validateStep(step?: SolicitudCompraCreateStep): boolean {
      const targetStep = step ?? this.currentStep;

      if (targetStep === 1) {
        const result = stepDatosBaseSchema.safeParse({
          tipoSolicitud: this.tipoSolicitud,
          fechaEntrega: this.fechaEntrega,
          equipos: this.equipos,
        });

        if (!result.success) {
          this.validationErrors = {
            ...this.validationErrors,
            ...formatZodErrors(result.error.issues),
          };
          return false;
        }

        this.validationErrors = {
          ...this.validationErrors,
          tipoSolicitud: undefined,
          fechaEntrega: undefined,
          equipos: undefined,
        };
        return true;
      }

      if (targetStep === 2) {
        const result = stepProductosSchema.safeParse({
          tipoSolicitud: this.tipoSolicitud,
          productos: this.productos,
          servicios: this.servicios,
        });

        if (!result.success) {
          this.validationErrors = {
            ...this.validationErrors,
            ...formatZodErrors(result.error.issues),
          };
          return false;
        }

        return true;
      }

      if (targetStep === 3) {
        const result = stepObservacionesSchema.safeParse({
          observacion: this.observacion,
          solicitarUrgente: this.solicitarUrgente,
          motivoUrgencia: this.motivoUrgencia,
        });

        if (!result.success) {
          this.validationErrors = {
            ...this.validationErrors,
            ...formatZodErrors(result.error.issues),
          };
          return false;
        }

        this.validationErrors = {
          ...this.validationErrors,
          observacion: undefined,
          motivoUrgencia: undefined,
        };
        return true;
      }

      return true;
    },

    goToNextStep(): boolean {
      if (!this.validateStep()) {
        return false;
      }

      if (this.currentStep < 4) {
        this.currentStep = (this.currentStep + 1) as SolicitudCompraCreateStep;
      }

      return true;
    },

    goToPreviousStep(): void {
      if (this.currentStep > 1) {
        this.currentStep = (this.currentStep - 1) as SolicitudCompraCreateStep;
      }
    },

    buildPayload(mode: Exclude<SolicitudCompraSubmitMode, null>): SolicitudCompraCrearPayload {
      const schema = getCreateSolicitudSchemaByMode(mode);
        const result = schema.safeParse({
          tipoSolicitud: this.tipoSolicitud,
          fechaEntrega: this.fechaEntrega,
          equipos: this.equipos,
          productos: this.productos,
          servicios: this.servicios,
          observacion: this.observacion,
          solicitarUrgente: this.solicitarUrgente,
          motivoUrgencia: this.motivoUrgencia,
      });

      if (!result.success) {
        this.validationErrors = formatZodErrors(result.error.issues);
        throw new Error('La solicitud no es válida');
      }

      const parsed = mode === 'draft'
        ? createSolicitudDraftSchema.parse({
          tipoSolicitud: this.tipoSolicitud,
          fechaEntrega: this.fechaEntrega,
          equipos: this.equipos,
          productos: this.productos,
          servicios: this.servicios,
          observacion: this.observacion,
          solicitarUrgente: this.solicitarUrgente,
          motivoUrgencia: this.motivoUrgencia,
        })
        : createSolicitudSendSchema.parse({
          tipoSolicitud: this.tipoSolicitud,
          fechaEntrega: this.fechaEntrega,
          equipos: this.equipos,
          productos: this.productos,
          servicios: this.servicios,
          observacion: this.observacion,
          solicitarUrgente: this.solicitarUrgente,
          motivoUrgencia: this.motivoUrgencia,
        });

      return {
        p_tipo_codigo: parsed.tipoSolicitud,
        p_fecha_entrega: parsed.fechaEntrega,
        p_observacion: parsed.observacion.trim(),
        p_equipos: parsed.equipos.map((item) => item.codEquipo),
        p_productos: parsed.tipoSolicitud === 'servicio'
          ? []
          : parsed.productos.map((item) => item.tipo === 'existente'
            ? { cod_producto: item.codProducto }
            : {
              temporal: true,
              descripcion: item.descripcion.trim(),
              unidad_codigo: item.unidadCodigo.trim(),
            }),
        p_servicios: parsed.tipoSolicitud === 'servicio'
          ? parsed.servicios.map((item) => ({
            descripcion: item.descripcion.trim(),
            cantidad: 1,
            unidad_codigo: item.unidadCodigo.trim(),
          }))
          : [],
        p_enviar: mode === 'send',
        p_solicitar_urgente: mode === 'send' ? parsed.solicitarUrgente : false,
        p_motivo_urgencia: mode === 'send' && parsed.solicitarUrgente
          ? parsed.motivoUrgencia.trim()
          : null,
        p_adjuntos: this.adjuntosSubidos,
        p_requerir_adjuntos_storage: true,
      };
    },

    async submit(mode: Exclude<SolicitudCompraSubmitMode, null>): Promise<SolicitudCompraCrearResponse> {
      this.submitMode = mode;
      this.loading = true;
      this.error = null;
      this.validationErrors = {};

      try {
        if (this.adjuntosLocales.length > 0 && !this.uploadSession) {
          this.uploading = true;
          this.uploadSession = await solicitudesCompraCrearService.prepararUploadSession();
          this.adjuntosSubidos = await solicitudesCompraCrearService.subirAdjuntos(
            this.uploadSession,
            this.adjuntosLocales
          );
        }

        const payload = this.buildPayload(mode);
        const response = await solicitudesCompraCrearService.crearSolicitud(payload);

        this.lastCreatedResponse = response;
        return response;
      } catch (error) {
        this.error = error instanceof Error
          ? error.message
          : 'No se pudo crear la solicitud';
        throw error;
      } finally {
        this.loading = false;
        this.uploading = false;
      }
    },
  },
});
