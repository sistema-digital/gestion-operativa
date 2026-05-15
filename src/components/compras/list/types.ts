import type { SolicitudCompra } from '@/stores/comprasStore';
export type {
  ActualizarSolicitudAlmacen,
  ActualizarSolicitudAlmacenResponse
} from '@/types';

export type SolicitudColumnType =
  | 'solicitud'
  | 'ordenCompra'
  | 'estado'
  | 'fechas'
  | 'observacion'
  | 'equipos';

export interface SolicitudColumn {
  key: string;
  label: string;
  type: SolicitudColumnType;
  cellClass?: string;
}

export interface SolicitudDisplayConfig {
  estadoLabel: (item: SolicitudCompra) => string;
  ordenesCompraLabel: (item: SolicitudCompra) => string;
  shouldShowPriorityBadge: (item: SolicitudCompra) => boolean;
  priorityLabel: (item: SolicitudCompra) => string;
  priorityClass: (item: SolicitudCompra) => string;
  formatDate: (value: string | null) => string;
  formatDateTime: (value: string | null) => string;
}

export type SolicitudRowKey = keyof SolicitudCompra | ((item: SolicitudCompra) => string | number);

export const defaultSolicitudColumns: SolicitudColumn[] = [
  { key: 'solicitud', label: 'Solicitud Compra', type: 'solicitud' },
  { key: 'ordenCompra', label: 'Orden de compra', type: 'ordenCompra' },
  { key: 'estado', label: 'Estado', type: 'estado' },
  { key: 'fechas', label: 'Fecha', type: 'fechas' },
  { key: 'observacion', label: 'Observación', type: 'observacion' },
  { key: 'equipos', label: 'Equipo', type: 'equipos' },
];

export const defaultTableGridClass =
  'lg:grid-cols-[minmax(140px,0.75fr)_minmax(140px,0.75fr)_minmax(210px,1.2fr)_minmax(180px,0.9fr)_minmax(220px,1.2fr)_minmax(90px,0.5fr)]';

export const resolveSolicitudRowKey = (item: SolicitudCompra, rowKey: SolicitudRowKey = 'id') => {
  if (typeof rowKey === 'function') return rowKey(item);

  const value = item[rowKey];
  return typeof value === 'string' || typeof value === 'number' ? value : item.id;
};
