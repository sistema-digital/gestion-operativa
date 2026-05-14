import type { SolicitudCompraInitialData } from '@/views/compras/type'

export type SolicitudArea =
  | 'all'
  | 'operativa'
  | 'gerencia'
  | 'almacen'
  | 'secretaria'
  | 'sin_permiso'

export type SolicitudMode = 'create' | 'edit' | 'view'

export type PermissionState = {
  visible: boolean
  editable: boolean
}

export type FieldPermissionKey =
  | 'fecha_entrega'
  | 'solicitante'
  | 'equipos'
  | 'observacion'
  | 'prioridad'

export type DetailColumnKey =
  | 'codigo'
  | 'descripcion'
  | 'unidad'
  | 'cantidad'
  | 'cantidad_inventario'
  | 'cantidad_gerencia'
  | 'cantidad_subida_sistema_compra'
  | 'acciones'

export type DetailActionKey =
  | 'add_manual_item'
  | 'remove_detalle'
  | 'discard_detalle'
  | 'undo_discard_detalle'
  | 'save'

export interface SolicitudPermissions {
  area: SolicitudArea
  mode: SolicitudMode
  estado_id: number | null
  fields: Record<FieldPermissionKey, PermissionState>
  columns: Record<DetailColumnKey, PermissionState>
  actions: Record<DetailActionKey, boolean>
}

export interface SolicitudCompraViewResponse {
  success: boolean
  message?: string
  data: SolicitudCompraInitialData
  permissions: SolicitudPermissions
}
