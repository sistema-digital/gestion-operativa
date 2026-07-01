import { defineStore } from 'pinia';

import { useUserStore } from '@/stores/userStore';
import { useEquiposStore } from '@/stores/dbequipos/equipos/equipos.store';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import {
  buildAdjuntoFingerprint,
  getAdjuntoKind,
  validateAdjuntosSelection,
} from '@/components/compras/crear/crearSolicitudAdjuntos.utils';
import { solicitudCompraBorradorSchema } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.schemas';
import { solicitudesCompraBorradoresService } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.service';
import {
  SOLICITUD_COMPRA_BORRADOR_SCHEMA_VERSION,
  type SolicitudCompraBorradorListadoItem,
  type SolicitudCompraBorradorCreatePayload,
  type SolicitudCompraBorradorStep,
  type SolicitudCompraBorradorUpdatePayload,
} from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.types';

import { solicitudesCompraCrearService } from './solicitudesCompraCrear.service';
import {
  createSolicitudSendSchema,
  stepDatosBaseSchema,
  stepObservacionesSchema,
  stepProductosSchema,
} from './solicitudesCompraCrear.schemas';
import {
  OBSERVACION_MAX_LENGTH,
  OBSERVACION_PREFILL_PREFIX,
} from './solicitudesCompraCrear.types';
import type {
  CrearSolicitudAdjuntoDraftInput,
  EquipoSeleccionadoSource,
  CrearSolicitudFieldErrors,
  EquipoSeleccionado,
  ProductoCatalogoOption,
  ProductoSolicitudItem,
  ProductoTemporalDraft,
  ProductoSolicitudTemporalItem,
  ServicioSolicitudDraft,
  ServicioSolicitudItem,
  SolicitudCompraCreateStep,
  SolicitudCompraCrearPayload,
  SolicitudCompraCrearResponse,
  SolicitudCompraGuardarBorradorResponse,
  SolicitudCompraCrearState,
  SolicitudCompraSubmitMode,
  SolicitudCompraTipoSolicitud,
} from './solicitudesCompraCrear.types';

const createInitialState = (): SolicitudCompraCrearState => ({
  entryMode: null,
  continuedFromDraft: false,
  currentStep: 1,
  submitMode: null,
  draftId: null,
  lastSavedDraftSnapshotHash: null,
  solicitanteNombre: '',
  solicitanteEmail: '',
  areaNombre: '',
  fechaCreacionLocal: new Date(),
  tipoSolicitud: null,
  fechaEntrega: null,
  equipos: [],
  productos: [],
  servicios: [],
  observacion: OBSERVACION_PREFILL_PREFIX,
  ultimoPrefillObservacion: OBSERVACION_PREFILL_PREFIX,
  observacionEditadaManual: false,
  solicitarUrgente: false,
  motivoUrgencia: '',
  adjuntosLocales: [],
  adjuntosErroresRecientes: [],
  adjuntosSubidos: [],
  uploadSession: null,
  productSearchQuery: '',
  productSearchResults: [],
  productSearchLoading: false,
  productSearchError: null,
  loading: false,
  draftSaving: false,
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

const truncateObservacion = (value: string): string => value.slice(0, OBSERVACION_MAX_LENGTH);
const normalizeDescripcion = (value: string): string => value.trim().toUpperCase();
const formatDateForDb = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};
const normalizeDraftFechaEntrega = (value: string, now = new Date()): string => {
  const entregaDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(entregaDate.getTime())) {
    return value;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  entregaDate.setHours(0, 0, 0, 0);

  if (entregaDate < today) {
    return formatDateForDb(today);
  }

  return value;
};

const buildObservacionPrefill = (equipos: EquipoSeleccionado[]): string => {
  const equipmentCodes = equipos
    .filter((item) => item.source === 'equipo')
    .map((item) => item.codEquipo.trim())
    .filter(Boolean);

  const generated = equipmentCodes.length > 0
    ? `${OBSERVACION_PREFILL_PREFIX}${equipmentCodes.join(', ')}`
    : OBSERVACION_PREFILL_PREFIX;

  return truncateObservacion(generated);
};

const toEquipoSeleccionado = (
  item: EquipoOption,
  source: EquipoSeleccionadoSource = 'equipo'
): EquipoSeleccionado => ({
  id: item.id,
  source,
  codEquipo: item.codEquipo,
  label: item.label,
  modelo: item.modelo,
  marca: item.marca,
  tipo: item.tipo,
});

const createLocalId = (): string => crypto.randomUUID();
const createDraftSnapshotHash = (snapshot: SolicitudCompraBorradorUpdatePayload): string =>
  JSON.stringify(snapshot);

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

    canSaveDraft(state): boolean {
      return stepDatosBaseSchema.safeParse({
        tipoSolicitud: state.tipoSolicitud,
        fechaEntrega: state.fechaEntrega,
        equipos: state.equipos,
      }).success;
    },

    observacionAutogenerada(state): boolean {
      return !state.observacionEditadaManual
        || state.observacion === state.ultimoPrefillObservacion;
    },
  },

  actions: {
    syncObservacionPrefill(): void {
      const generated = buildObservacionPrefill(this.equipos);
      const shouldOverwrite = !this.observacionEditadaManual
        || this.observacion === this.ultimoPrefillObservacion
        || this.observacion.trim().length === 0;

      this.ultimoPrefillObservacion = generated;

      if (shouldOverwrite) {
        this.observacion = generated;
        this.observacionEditadaManual = false;
        delete this.validationErrors.observacion;
      }
    },

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

    async prepareNewEntry(): Promise<void> {
      this.reset();
      await this.initialize();
      this.entryMode = 'new';
      this.continuedFromDraft = false;
    },

    hydrateFromDraft(draft: SolicitudCompraBorradorListadoItem): void {
      const normalizedFechaEntrega = normalizeDraftFechaEntrega(draft.fechaEntrega);
      const result = solicitudCompraBorradorSchema.safeParse({
        currentStep: draft.currentStep,
        tipoSolicitud: draft.tipoSolicitud,
        fechaEntrega: normalizedFechaEntrega,
        equipos: draft.equipos,
        productos: draft.productos,
        servicios: draft.servicios,
        observacion: draft.observacion,
        solicitarUrgente: draft.solicitarUrgente,
        motivoUrgencia: draft.motivoUrgencia,
      });

      if (!result.success) {
        throw new Error('El borrador no es válido');
      }

      const parsed = result.data;
      const sanitizedProductos = parsed.tipoSolicitud === 'servicio'
        ? []
        : parsed.productos;
      const sanitizedServicios = parsed.tipoSolicitud === 'servicio'
        ? parsed.servicios
        : [];
      const observacionPrefill = buildObservacionPrefill(parsed.equipos);
      const draftSnapshot = {
        activo: true,
        schema_version: draft.schemaVersion,
        current_step: parsed.currentStep,
        tipo_solicitud: parsed.tipoSolicitud,
        fecha_entrega: normalizedFechaEntrega,
        observacion: parsed.observacion.trim(),
        solicitar_urgente: parsed.solicitarUrgente,
        motivo_urgencia: parsed.solicitarUrgente
          ? parsed.motivoUrgencia.trim()
          : null,
        equipos: parsed.equipos,
        productos: sanitizedProductos,
        servicios: sanitizedServicios,
      } satisfies SolicitudCompraBorradorUpdatePayload;

      this.entryMode = 'draft';
      this.continuedFromDraft = true;
      this.currentStep = parsed.currentStep;
      this.submitMode = null;
      this.draftId = draft.id;
      this.lastSavedDraftSnapshotHash = createDraftSnapshotHash(draftSnapshot);
      this.fechaCreacionLocal = new Date(draft.createdAt);
      this.tipoSolicitud = parsed.tipoSolicitud;
      this.fechaEntrega = normalizedFechaEntrega;
      this.equipos = parsed.equipos;
      this.productos = sanitizedProductos;
      this.servicios = sanitizedServicios;
      this.observacion = parsed.observacion;
      this.ultimoPrefillObservacion = observacionPrefill;
      this.observacionEditadaManual = parsed.observacion !== observacionPrefill;
      this.solicitarUrgente = parsed.solicitarUrgente;
      this.motivoUrgencia = parsed.motivoUrgencia;
      this.adjuntosLocales = [];
      this.adjuntosErroresRecientes = [];
      this.adjuntosSubidos = [];
      this.uploadSession = null;
      this.productSearchQuery = '';
      this.productSearchResults = [];
      this.productSearchLoading = false;
      this.productSearchError = null;
      this.loading = false;
      this.draftSaving = false;
      this.uploading = false;
      this.error = null;
      this.validationErrors = {};
      this.lastCreatedResponse = null;
      this.initialized = true;
    },

    async prepareDraftEntry(draft: SolicitudCompraBorradorListadoItem): Promise<void> {
      this.reset();
      await this.initialize();
      this.hydrateFromDraft(draft);
    },

    setTipoSolicitud(value: SolicitudCompraTipoSolicitud | null): void {
      const previousValue = this.tipoSolicitud;
      this.tipoSolicitud = value;
      const isSwitchingServicioMode = (previousValue === 'servicio') !== (value === 'servicio');

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

      if (isSwitchingServicioMode) {
        this.equipos = [];
        delete this.validationErrors.equipos;
        useEquiposStore().reset();
      }

      if (value !== 'servicio') {
        this.equipos = this.equipos.filter((item) => item.source === 'equipo');
      }

      this.syncObservacionPrefill();

      delete this.validationErrors.tipoSolicitud;
    },

    setFechaEntrega(value: string | null): void {
      this.fechaEntrega = value;
      delete this.validationErrors.fechaEntrega;
    },

    setObservacion(value: string): void {
      this.observacion = truncateObservacion(value);
      this.observacionEditadaManual = this.observacion !== this.ultimoPrefillObservacion;
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

    agregarAdjuntos(items: CrearSolicitudAdjuntoDraftInput[]): void {
      const { acceptedItems, invalidIssues } = validateAdjuntosSelection(items, this.adjuntosLocales);

      if (acceptedItems.length > 0) {
        this.adjuntosLocales = [
          ...this.adjuntosLocales,
          ...acceptedItems.flatMap((item) => {
            const kind = getAdjuntoKind(item.file);

            if (!kind) {
              return [];
            }

            return [{
              localId: createLocalId(),
              file: item.file,
              displayName: item.displayName,
              kind,
              fingerprint: buildAdjuntoFingerprint(item.file),
            }];
          }),
        ];
        delete this.validationErrors.adjuntos;
      }

      this.adjuntosErroresRecientes = invalidIssues;

      if (invalidIssues.length > 0) {
        this.validationErrors = {
          ...this.validationErrors,
          adjuntos: invalidIssues[0]?.message,
        };
      } else {
        delete this.validationErrors.adjuntos;
      }
    },

    removerAdjunto(localId: string): void {
      this.adjuntosLocales = this.adjuntosLocales.filter((item) => item.localId !== localId);
    },

    limpiarErroresAdjuntos(): void {
      this.adjuntosErroresRecientes = [];
      delete this.validationErrors.adjuntos;
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
      this.syncObservacionPrefill();
      delete this.validationErrors.equipos;
    },

    agregarContextoServicio(item: {
      id: number;
      codigo: string;
      nombre: string;
    }): void {
      if (this.equipos.some((equipo) => equipo.codEquipo === item.codigo)) {
        return;
      }

      this.equipos = [
        ...this.equipos,
        {
          id: item.id,
          source: 'contexto',
          codEquipo: item.codigo,
          label: item.nombre,
          modelo: null,
          marca: null,
          tipo: null,
        },
      ];
      this.syncObservacionPrefill();
      delete this.validationErrors.equipos;
    },

    removerEquipo(codEquipo: string): void {
      const equiposStore = useEquiposStore();
      equiposStore.removerEquipo(codEquipo);
      this.equipos = this.equipos.filter((item) => item.codEquipo !== codEquipo);
      this.syncObservacionPrefill();
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
          descripcion: normalizeDescripcion(item.descripcion),
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
          descripcion: normalizeDescripcion(item.descripcion),
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
      item: ServicioSolicitudDraft
    ): void {
      this.servicios = [
        ...this.servicios,
        {
          localId: createLocalId(),
          ...item,
          descripcion: normalizeDescripcion(item.descripcion),
        },
      ];
      delete this.validationErrors.servicios;
    },

    actualizarServicio(localId: string, item: ServicioSolicitudDraft): void {
      this.servicios = this.servicios.map((service) => {
        if (service.localId !== localId) {
          return service;
        }

        return {
          ...service,
          cantidad: item.cantidad,
          descripcion: normalizeDescripcion(item.descripcion),
          unidadCodigo: item.unidadCodigo,
          unidadLabel: item.unidadLabel,
        };
      });

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

    buildPayload(): SolicitudCompraCrearPayload {
      const result = createSolicitudSendSchema.safeParse({
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

      const parsed = result.data;

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
            cantidad: item.cantidad,
            unidad_codigo: item.unidadCodigo.trim(),
          }))
          : [],
        p_enviar: true,
        p_solicitar_urgente: parsed.solicitarUrgente,
        p_motivo_urgencia: parsed.solicitarUrgente
          ? parsed.motivoUrgencia.trim()
          : null,
        p_adjuntos: this.adjuntosSubidos,
        p_requerir_adjuntos_storage: this.adjuntosLocales.length > 0,
      };
    },

    buildDraftUpdateSnapshot(options?: {
      syncValidationErrors?: boolean;
    }): SolicitudCompraBorradorUpdatePayload {
      const syncValidationErrors = options?.syncValidationErrors ?? true;
      const draftStep = (this.currentStep === 1 ? 2 : this.currentStep) as SolicitudCompraBorradorStep;
      const result = solicitudCompraBorradorSchema.safeParse({
        currentStep: draftStep,
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
        if (syncValidationErrors) {
          this.validationErrors = formatZodErrors(result.error.issues);
        }
        throw new Error('El borrador no es válido');
      }

      const parsed = result.data;
      return {
        activo: true,
        schema_version: SOLICITUD_COMPRA_BORRADOR_SCHEMA_VERSION,
        current_step: parsed.currentStep as SolicitudCompraBorradorStep,
        tipo_solicitud: parsed.tipoSolicitud,
        fecha_entrega: parsed.fechaEntrega,
        observacion: parsed.observacion.trim(),
        solicitar_urgente: parsed.solicitarUrgente,
        motivo_urgencia: parsed.solicitarUrgente
          ? parsed.motivoUrgencia.trim()
          : null,
        equipos: parsed.equipos,
        productos: parsed.productos,
        servicios: parsed.servicios,
      } satisfies SolicitudCompraBorradorUpdatePayload;
    },

    buildDraftSnapshot():
      SolicitudCompraBorradorCreatePayload
      | SolicitudCompraBorradorUpdatePayload {
      const snapshot = this.buildDraftUpdateSnapshot();

      if (this.draftId) {
        return snapshot;
      }

      return {
        ...snapshot,
        creado_por_email: this.solicitanteEmail.trim(),
        creado_por_nombre: this.solicitanteNombre.trim(),
        creado_por_area: this.areaNombre.trim() || null,
      } satisfies SolicitudCompraBorradorCreatePayload;
    },

    async persistDraft(options?: {
      silent?: boolean;
      skipIfUnchanged?: boolean;
    }): Promise<SolicitudCompraGuardarBorradorResponse | null> {
      const silent = options?.silent ?? false;
      const skipIfUnchanged = options?.skipIfUnchanged ?? false;

      if (this.draftSaving || this.submitMode === 'send') {
        return null;
      }

      if (silent && (!this.canSaveDraft || this.loading || this.uploading)) {
        return null;
      }

      if (!silent) {
        this.loading = true;
        this.error = null;
        this.validationErrors = {};
      }

      this.draftSaving = true;

      try {
        const updateSnapshot = this.buildDraftUpdateSnapshot({
          syncValidationErrors: !silent,
        });
        const snapshotHash = createDraftSnapshotHash(updateSnapshot);

        if (skipIfUnchanged && snapshotHash === this.lastSavedDraftSnapshotHash) {
          return null;
        }

        const payload = this.draftId
          ? updateSnapshot
          : {
            ...updateSnapshot,
            creado_por_email: this.solicitanteEmail.trim(),
            creado_por_nombre: this.solicitanteNombre.trim(),
            creado_por_area: this.areaNombre.trim() || null,
          } satisfies SolicitudCompraBorradorCreatePayload;

        const response = this.draftId
          ? await solicitudesCompraBorradoresService.actualizarBorrador(
            this.draftId,
            payload as SolicitudCompraBorradorUpdatePayload
          )
          : await solicitudesCompraBorradoresService.crearBorrador(
            payload as SolicitudCompraBorradorCreatePayload
          );

        this.draftId = response.id;
        this.lastSavedDraftSnapshotHash = snapshotHash;

        return { id: response.id };
      } catch (error) {
        if (!silent) {
          this.error = error instanceof Error
            ? error.message
            : 'No se pudo guardar el borrador';
        }

        if (!silent) {
          throw error;
        }

        return null;
      } finally {
        if (!silent) {
          this.loading = false;
        }

        this.draftSaving = false;
      }
    },

    async saveDraft(): Promise<SolicitudCompraGuardarBorradorResponse> {
      const response = await this.persistDraft();

      if (!response) {
        throw new Error('No se pudo guardar el borrador');
      }

      return response;
    },

    async autoSaveDraft(): Promise<boolean> {
      const response = await this.persistDraft({
        silent: true,
        skipIfUnchanged: true,
      });

      return Boolean(response);
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

        const payload = this.buildPayload();
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
