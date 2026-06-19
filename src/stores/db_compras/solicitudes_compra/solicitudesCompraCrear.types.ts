export type SolicitudCompraCreateStep = 1 | 2 | 3 | 4;

export type SolicitudCompraSubmitMode = 'draft' | 'send' | null;

export type SolicitudCompraTipoSolicitud = 'zafra' | 'cultivo' | 'otros' | 'servicio';

export interface CrearSolicitudHeaderContext {
  solicitanteNombre: string;
  solicitanteEmail: string;
  areaNombre: string;
  fechaCreacionLocal: Date;
}

export interface EquipoSeleccionado {
  id: number;
  codEquipo: string;
  label: string;
  modelo: string | null;
  marca: string | null;
  tipo: string | null;
}

export interface ProductoCatalogoRow {
  id: string;
  cod_producto: string;
  descripcion: string;
  activo: boolean;
  es_temporal: boolean;
  estado_catalogo: string;
  unidad_medida: {
    codigo: string;
    abreviatura: string;
    descripcion: string | null;
  } | null;
}

export interface ProductoCatalogoOption {
  id: string;
  codProducto: string;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
}

export interface ProductoSolicitudExistenteItem {
  localId: string;
  tipo: 'existente';
  codProducto: string;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
}

export interface ProductoSolicitudTemporalItem {
  localId: string;
  tipo: 'temporal';
  temporal: true;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
  notas: string;
}

export type ProductoSolicitudItem =
  | ProductoSolicitudExistenteItem
  | ProductoSolicitudTemporalItem;

export interface ServicioSolicitudItem {
  localId: string;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
  notas: string;
}

export interface CrearSolicitudAdjuntoLocalItem {
  localId: string;
  file: File;
}

export interface CrearSolicitudAdjuntoUploadMetadata {
  bucketId: string;
  storagePath: string;
  nombreOriginal: string;
  mimeType: string;
  extension: string | null;
  sizeBytes: number;
  tipoAdjuntoCodigo: string;
  descripcion: string | null;
}

export interface CrearSolicitudUploadSession {
  bucket_id: string;
  upload_group_id: string;
  base_path: string;
  fecha_path: string;
  area_codigo: string | null;
  area_slug: string;
  usuario_slug: string;
  email: string | null;
}

export interface SolicitudCompraCrearPayload {
  p_tipo_codigo: SolicitudCompraTipoSolicitud;
  p_fecha_entrega: string;
  p_observacion: string;
  p_equipos: string[];
  p_productos: Array<
    | { cod_producto: string }
    | {
      temporal: true;
      descripcion: string;
      unidad_codigo: string;
    }
  >;
  p_servicios: Array<{
    descripcion: string;
    cantidad: number;
    unidad_codigo: string;
  }>;
  p_enviar: boolean;
  p_solicitar_urgente: boolean;
  p_motivo_urgencia: string | null;
  p_adjuntos: CrearSolicitudAdjuntoUploadMetadata[];
  p_requerir_adjuntos_storage: boolean;
}

export interface SolicitudCompraCrearResponse {
  solicitud_id: string;
  folio_sol: string | null;
  tipo_codigo: SolicitudCompraTipoSolicitud;
  estado_codigo: string;
  prioridad_codigo: string;
  ciclo_estado: number;
  productos_total: number;
  servicios_total: number;
  equipos_total: number;
  adjuntos_total: number;
  peticion_urgente_creada: boolean;
  urgente_ignorado_por_borrador: boolean;
}

export interface CrearSolicitudFieldErrors {
  tipoSolicitud?: string;
  fechaEntrega?: string;
  equipos?: string;
  productos?: string;
  servicios?: string;
  observacion?: string;
  motivoUrgencia?: string;
}

export interface SolicitudCompraCrearState extends CrearSolicitudHeaderContext {
  currentStep: SolicitudCompraCreateStep;
  submitMode: SolicitudCompraSubmitMode;
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  fechaEntrega: string | null;
  equipos: EquipoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  observacion: string;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
  adjuntosLocales: CrearSolicitudAdjuntoLocalItem[];
  adjuntosSubidos: CrearSolicitudAdjuntoUploadMetadata[];
  uploadSession: CrearSolicitudUploadSession | null;
  productSearchQuery: string;
  productSearchResults: ProductoCatalogoOption[];
  productSearchLoading: boolean;
  productSearchError: string | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
  validationErrors: CrearSolicitudFieldErrors;
  initialized: boolean;
  lastCreatedResponse: SolicitudCompraCrearResponse | null;
}
