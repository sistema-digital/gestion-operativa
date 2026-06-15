import type {
  SolicitudCompraColumnKey,
  SolicitudCompraRoleCodigo,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

export interface SolicitudListRoleVisibility {
  canSeeFolio: boolean;
  canSeeFolioOc: boolean;
  canSeeArea: boolean;
  canSeeSolicitante: boolean;
  canSeeEquipos: boolean;
  canSeeFechaEntrega: boolean;
  canSeeAdjuntos: boolean;
  canSeeDiferenciaOc: boolean;
  canSeeBloqueado: boolean;
  canSeeConteos: boolean;
}

export interface SolicitudListRoleConfig extends SolicitudListRoleVisibility {
  desktopColumns: SolicitudCompraColumnKey[];
  mobileFields: SolicitudCompraColumnKey[];
}

const OPERATIVO_CONFIG: SolicitudListRoleConfig = {
  desktopColumns: [
    'folio',
    'observacion',
    'estado',
    'prioridad',
    'equipos',
    'fechaEntrega',
    'indicadores',
  ],
  mobileFields: [
    'folio',
    'estado',
    'observacion',
    'prioridad',
    'equipos',
    'fechaEntrega',
    'indicadores',
  ],
  canSeeFolio: true,
  canSeeFolioOc: true,
  canSeeArea: false,
  canSeeSolicitante: false,
  canSeeEquipos: true,
  canSeeFechaEntrega: true,
  canSeeAdjuntos: true,
  canSeeDiferenciaOc: true,
  canSeeBloqueado: true,
  canSeeConteos: false,
};

export const SOLICITUD_LIST_ROLE_CONFIG: Record<
  SolicitudCompraRoleCodigo,
  SolicitudListRoleConfig
> = {
  operativo: OPERATIVO_CONFIG,
  admin: {
    desktopColumns: [
      'folio',
      'observacion',
      'estado',
      'prioridad',
      'equipos',
      'area',
      'solicitante',
      'fechaEntrega',
      'indicadores',
    ],
    mobileFields: [
      'folio',
      'estado',
      'observacion',
      'prioridad',
      'equipos',
      'area',
      'solicitante',
      'fechaEntrega',
      'indicadores',
    ],
    canSeeFolio: true,
    canSeeFolioOc: true,
    canSeeArea: true,
    canSeeSolicitante: true,
    canSeeEquipos: true,
    canSeeFechaEntrega: true,
    canSeeAdjuntos: true,
    canSeeDiferenciaOc: true,
    canSeeBloqueado: true,
    canSeeConteos: true,
  },
  gerencia: {
    desktopColumns: [
      'folio',
      'observacion',
      'estado',
      'prioridad',
      'equipos',
      'area',
      'fechaEntrega',
      'indicadores',
    ],
    mobileFields: [
      'folio',
      'estado',
      'observacion',
      'prioridad',
      'equipos',
      'area',
      'fechaEntrega',
      'indicadores',
    ],
    canSeeFolio: true,
    canSeeFolioOc: true,
    canSeeArea: true,
    canSeeSolicitante: false,
    canSeeEquipos: true,
    canSeeFechaEntrega: true,
    canSeeAdjuntos: true,
    canSeeDiferenciaOc: true,
    canSeeBloqueado: true,
    canSeeConteos: true,
  },
  almacen: {
    desktopColumns: ['observacion', 'area', 'prioridad', 'estado', 'bloqueado'],
    mobileFields: ['observacion', 'area', 'prioridad', 'estado', 'bloqueado'],
    canSeeFolio: false,
    canSeeFolioOc: false,
    canSeeArea: true,
    canSeeSolicitante: false,
    canSeeEquipos: false,
    canSeeFechaEntrega: false,
    canSeeAdjuntos: false,
    canSeeDiferenciaOc: false,
    canSeeBloqueado: true,
    canSeeConteos: false,
  },
  secretaria: {
    desktopColumns: [
      'folio',
      'observacion',
      'area',
      'solicitante',
      'prioridad',
      'estado',
      'fechaEntrega',
      'bloqueado',
    ],
    mobileFields: [
      'folio',
      'observacion',
      'area',
      'solicitante',
      'prioridad',
      'estado',
      'fechaEntrega',
      'bloqueado',
    ],
    canSeeFolio: true,
    canSeeFolioOc: false,
    canSeeArea: true,
    canSeeSolicitante: true,
    canSeeEquipos: false,
    canSeeFechaEntrega: true,
    canSeeAdjuntos: false,
    canSeeDiferenciaOc: false,
    canSeeBloqueado: true,
    canSeeConteos: false,
  },
};

export const getSolicitudListRoleConfig = (
  roleCodigo: SolicitudCompraRoleCodigo
): SolicitudListRoleConfig =>
  SOLICITUD_LIST_ROLE_CONFIG[roleCodigo] ?? OPERATIVO_CONFIG;

export const getSolicitudDesktopColumnsByRole = (
  roleCodigo: SolicitudCompraRoleCodigo
): SolicitudCompraColumnKey[] =>
  getSolicitudListRoleConfig(roleCodigo).desktopColumns;

export const getSolicitudMobileFieldsByRole = (
  roleCodigo: SolicitudCompraRoleCodigo
): SolicitudCompraColumnKey[] =>
  getSolicitudListRoleConfig(roleCodigo).mobileFields;

export const canShowSolicitudListField = (
  roleCodigo: SolicitudCompraRoleCodigo,
  field: keyof SolicitudListRoleVisibility
): boolean => getSolicitudListRoleConfig(roleCodigo)[field];
