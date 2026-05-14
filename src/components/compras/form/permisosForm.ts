export type PermisosFormArea =
  | 'all'
  | 'operativa'
  | 'gerencia'
  | 'almacen'
  | 'secretaria';

export interface PermisosFormDetalleInput {
  cantidad_inventario?: number | null;
  estatus_detalle?: number | null;
  estatus_datalle?: number | null;
  producto?: {
    activo?: boolean | null;
  } | null;
}

export interface SolicitudPermisosFormInput {
  mode: string;
  initialData?: {
    estado_id?: number | string | null;
    detalles?: PermisosFormDetalleInput[];
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
  canAddManualItem: boolean;
  canEditCantidadOperativa: boolean;
  canRemoveDetalleOperativa: boolean;
  canDiscardDetalleAlmacen: boolean;
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
const ESTADOS_OPERATIVA_DETALLES = new Set([1, 2, 12, 16]);
const ESTADOS_OPERATIVA_EDITA_CANTIDAD = new Set([2, 3, 12, 16]);

const isEditMode = (input: SolicitudPermisosFormInput) => input.mode === 'edit';

const canEditCantidadInventarioAlmacen = (input: SolicitudPermisosFormInput) =>
  isEditMode(input) &&
  ESTADOS_EDITABLES_ALMACEN.has(Number(input.initialData?.estado_id));

const canUseOperativaDetalleActions = (input: SolicitudPermisosFormInput, area: PermisosFormArea) =>
  area === 'operativa' &&
  ESTADOS_OPERATIVA_DETALLES.has(Number(input.initialData?.estado_id ?? 1));

const canEditCantidadOperativa = (input: SolicitudPermisosFormInput, area: PermisosFormArea) =>
  area === 'operativa' &&
  ESTADOS_OPERATIVA_EDITA_CANTIDAD.has(Number(input.initialData?.estado_id));

const canUseAlmacenDetalleActions = (input: SolicitudPermisosFormInput, area: PermisosFormArea) =>
  area === 'almacen' &&
  isEditMode(input) &&
  ESTADOS_EDITABLES_ALMACEN.has(Number(input.initialData?.estado_id));

const detalleTieneCantidadVisible = (detalle: PermisosFormDetalleInput, area: PermisosFormArea) => {
  const valor = detalle.cantidad_inventario;
  const tieneCantidadInventario = valor !== null && valor !== undefined && Number(valor) >= 0;

  if (area !== 'operativa') return true;

  const estadoDetalle = Number(detalle.estatus_detalle ?? detalle.estatus_datalle ?? 1);

  return detalle.producto?.activo !== false && estadoDetalle !== 2 && tieneCantidadInventario;
};

const detallePermiteCantidadOperativa = (detalle: PermisosFormDetalleInput) => {
  const estadoDetalle = Number(detalle.estatus_detalle ?? detalle.estatus_datalle ?? 1);

  return detalle.producto?.activo === true && estadoDetalle !== 2;
};

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
  const canEditCantidadOperativaValue = canEditCantidadOperativa(input, area);
  const areThereCantidad =
    input.initialData?.detalles?.some((detalle) => (
      canEditCantidadOperativaValue
        ? detallePermiteCantidadOperativa(detalle)
        : detalleTieneCantidadVisible(detalle, area)
    )) ?? false;
  const permiso = permisosPorArea[area];

  return {
    area,
    showCantidad: permiso.showCantidad(input, areThereCantidad),
    areThereCantidad,
    canEditCantidadInventario: permiso.canEditCantidadInventario(input),
    canEditFechaEntrega: permiso.canEditFechaEntrega,
    canEditEquipos: permiso.canEditEquipos,
    canEditObservacion: permiso.canEditObservacion,
    canManageProductos: permiso.canManageProductos,
    canAddManualItem: permiso.canManageProductos && canUseOperativaDetalleActions(input, area),
    canEditCantidadOperativa: canEditCantidadOperativaValue,
    canRemoveDetalleOperativa: canUseOperativaDetalleActions(input, area),
    canDiscardDetalleAlmacen: canUseAlmacenDetalleActions(input, area)
  };
};
