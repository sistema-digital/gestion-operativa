import type { DetalleSolicitud } from '@/types';

export type PermisosFormArea =
  | 'all'
  | 'operativa'
  | 'gerencia'
  | 'almacen'
  | 'secretaria';

export interface SolicitudPermisosFormInput {
  mode: string;
  initialData?: {
    estado_id?: number | string | null;
    detalles?: DetalleSolicitud[];
  } | null;
  userArea?: string | null;
}

export interface PermisosFormSolicitud {
  area: PermisosFormArea;
  showCantidad: boolean;
  areThereCantidad: boolean;
  canEditCantidadInventario: boolean;
  canEditFechaEntrega: boolean;
  canEditEquipos: boolean;
  canEditObservacion: boolean;
  canManageProductos: boolean;
}

type PermisoCantidadRule = {
  area: PermisosFormArea;
  showCantidad: (input: SolicitudPermisosFormInput, areThereCantidad: boolean) => boolean;
  canEditCantidadInventario: (input: SolicitudPermisosFormInput) => boolean;
  canEditFechaEntrega: boolean;
  canEditEquipos: boolean;
  canEditObservacion: boolean;
  canManageProductos: boolean;
};

const normalizeArea = (area?: string | null) =>
  String(area || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const AREAS_OPERATIVAS = new Set([
  'COSECHA MECANIZADA',
  'COSECHA AGRICOLA',
  'ENGRASE',
  'EQUIPO PESADO',
  'MECANICA DE TRANSPORTE',
  'SERVICIOS GENERALES',
]);

const ESTADOS_EDITABLES_ALMACEN = new Set([1, 2, 10]);

const isEditMode = (input: SolicitudPermisosFormInput) => input.mode === 'edit';

const canEditCantidadInventarioAlmacen = (input: SolicitudPermisosFormInput) =>
  isEditMode(input) &&
  ESTADOS_EDITABLES_ALMACEN.has(Number(input.initialData?.estado_id));

export const getAreaPermisosFormSolicitud = (area?: string | null): PermisosFormArea => {
  const areaKey = normalizeArea(area);

  if (areaKey === 'ALL') return 'all';
  if (areaKey === 'GERENCIA') return 'gerencia';
  if (areaKey === 'ALMACEN') return 'almacen';
  if (areaKey === 'SECRETARIA') return 'secretaria';
  if (AREAS_OPERATIVAS.has(areaKey)) return 'operativa';

  return 'operativa';
};

export const permisosFormSolicitud: PermisoCantidadRule[] = [
  {
    area: 'all',
    showCantidad: input => isEditMode(input),
    canEditCantidadInventario: canEditCantidadInventarioAlmacen,
    canEditFechaEntrega: true,
    canEditEquipos: true,
    canEditObservacion: true,
    canManageProductos: true
  },
  {
    area: 'operativa',
    showCantidad: (input, areThereCantidad) => isEditMode(input) && areThereCantidad,
    canEditCantidadInventario: () => false,
    canEditFechaEntrega: true,
    canEditEquipos: true,
    canEditObservacion: true,
    canManageProductos: true
  },
  {
    area: 'gerencia',
    showCantidad: () => false,
    canEditCantidadInventario: () => false,
    canEditFechaEntrega: true,
    canEditEquipos: true,
    canEditObservacion: true,
    canManageProductos: true
  },
  {
    area: 'almacen',
    showCantidad: input => isEditMode(input),
    canEditCantidadInventario: canEditCantidadInventarioAlmacen,
    canEditFechaEntrega: false,
    canEditEquipos: false,
    canEditObservacion: false,
    canManageProductos: false
  },
  {
    area: 'secretaria',
    showCantidad: () => false,
    canEditCantidadInventario: () => false,
    canEditFechaEntrega: true,
    canEditEquipos: true,
    canEditObservacion: true,
    canManageProductos: true
  }
];

export const permisosPorArea = permisosFormSolicitud.reduce(
  (acc, permiso) => {
    acc[permiso.area] = permiso;
    return acc;
  },
  {} as Record<PermisosFormArea, PermisoCantidadRule>
);

export const getPermisosFormSolicitud = (
  input: SolicitudPermisosFormInput
): PermisosFormSolicitud => {
  const area = getAreaPermisosFormSolicitud(input.userArea);
  const areThereCantidad =
    input.initialData?.detalles?.some((detalle: DetalleSolicitud) => {
      const valor = detalle.cantidad_inventario;

      return valor !== null && valor !== undefined && Number(valor) >= 0;
    }) ?? false;
  const permiso = permisosPorArea[area];

  return {
    area,
    showCantidad: permiso.showCantidad(input, areThereCantidad),
    areThereCantidad,
    canEditCantidadInventario: permiso.canEditCantidadInventario(input),
    canEditFechaEntrega: permiso.canEditFechaEntrega,
    canEditEquipos: permiso.canEditEquipos,
    canEditObservacion: permiso.canEditObservacion,
    canManageProductos: permiso.canManageProductos
  };
};
