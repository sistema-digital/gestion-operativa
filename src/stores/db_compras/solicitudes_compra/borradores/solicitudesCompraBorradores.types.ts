import type {
  EquipoSeleccionado,
  ProductoSolicitudItem,
  ServicioSolicitudItem,
  SolicitudCompraCreateStep,
  SolicitudCompraTipoSolicitud,
} from '../crear_solicitud/solicitudesCompraCrear.types';

export const SOLICITUD_COMPRA_BORRADOR_SCHEMA_VERSION = 1;

export type SolicitudCompraBorradorStep = Extract<SolicitudCompraCreateStep, 2 | 3 | 4>;

export interface SolicitudCompraBorradorSnapshot {
  currentStep: SolicitudCompraBorradorStep;
  tipoSolicitud: SolicitudCompraTipoSolicitud;
  fechaEntrega: string;
  equipos: EquipoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  observacion: string;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
}

export interface SolicitudCompraBorradorRow {
  id: string;
  creado_por_user_id: string | null;
  creado_por_email: string;
  creado_por_nombre: string;
  creado_por_area: string | null;
  activo: boolean;
  schema_version: number;
  current_step: SolicitudCompraBorradorStep;
  tipo_solicitud: SolicitudCompraTipoSolicitud;
  fecha_entrega: string;
  observacion: string;
  solicitar_urgente: boolean;
  motivo_urgencia: string | null;
  equipos: EquipoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  enviado_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolicitudCompraBorradorCreatePayload {
  creado_por_email: string;
  creado_por_nombre: string;
  creado_por_area: string | null;
  activo: boolean;
  schema_version: number;
  current_step: SolicitudCompraBorradorStep;
  tipo_solicitud: SolicitudCompraTipoSolicitud;
  fecha_entrega: string;
  observacion: string;
  solicitar_urgente: boolean;
  motivo_urgencia: string | null;
  equipos: EquipoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
}

export interface SolicitudCompraBorradorUpdatePayload {
  activo: boolean;
  schema_version: number;
  current_step: SolicitudCompraBorradorStep;
  tipo_solicitud: SolicitudCompraTipoSolicitud;
  fecha_entrega: string;
  observacion: string;
  solicitar_urgente: boolean;
  motivo_urgencia: string | null;
  equipos: EquipoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
}
