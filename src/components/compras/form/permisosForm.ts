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
}

type PermisoCantidadRule = {
  area: PermisosFormArea;
  showCantidad: (input: SolicitudPermisosFormInput, areThereCantidad: boolean) => boolean;
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
    showCantidad: input => input.mode === 'edit'
  },
  {
    area: 'operativa',
    showCantidad: (input, areThereCantidad) =>
      input.mode === 'edit' &&
      Number(input.initialData?.estado_id) !== 1 &&
      areThereCantidad
  },
  {
    area: 'gerencia',
    showCantidad: input => input.mode === 'edit'
  },
  {
    area: 'almacen',
    showCantidad: () => false
  },
  {
    area: 'secretaria',
    showCantidad: () => false
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

      return valor !== null && valor !== undefined;
    }) ?? false;

  return {
    area,
    showCantidad: permisosPorArea[area].showCantidad(input, areThereCantidad),
    areThereCantidad
  };
};
