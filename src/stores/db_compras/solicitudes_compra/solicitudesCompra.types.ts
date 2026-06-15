export type SolicitudCompraRoleCodigo =
  | 'admin'
  | 'gerencia'
  | 'almacen'
  | 'secretaria'
  | 'operativo';

export type SolicitudCompraGrupoListado =
  | 'en_proceso'
  | 'completadas'
  | 'descartadas';

export type SolicitudCompraColumnKey =
  | 'folio'
  | 'observacion'
  | 'estado'
  | 'prioridad'
  | 'equipos'
  | 'area'
  | 'solicitante'
  | 'fechaEntrega'
  | 'indicadores'
  | 'bloqueado';

export type SolicitudCompraFechaEntregaOrigen =
  | 'proveedor'
  | 'sistema'
  | 'solicitud';

export interface SolicitudCompraListRpcParams {
  p_busqueda: string | null;
  p_grupo_listado: SolicitudCompraGrupoListado | null;
  p_estado_codigo: string | null;
  p_prioridad_codigo: string | null;
  p_fecha_desde: string | null;
  p_fecha_hasta: string | null;
  p_solo_bloqueadas: boolean;
  p_solo_diferencia_oc: boolean;
  p_limit: number | null;
  p_offset: number | null;
}

export interface SolicitudCompraListRpcRow {
  id: string | number;
  viewer_email: string | null;
  viewer_role_codigo: string | null;
  viewer_area_codigo: string | null;
  folio_sol: string | null;
  folio_oc_principal: string | null;
  folios_oc: string[] | null;
  observacion: string | null;
  estado_codigo: string | null;
  estado_nombre: string | null;
  badge_codigo: string | null;
  badge_label: string | null;
  prioridad_codigo: string | null;
  prioridad_nombre: string | null;
  area_solicitante_codigo: string | null;
  area_solicitante_nombre: string | null;
  solicitante_nombre: string | null;
  fecha_entrega_mostrada: string | null;
  fecha_entrega_origen: SolicitudCompraFechaEntregaOrigen | null;
  grupo_listado: SolicitudCompraGrupoListado | null;
  disponible_desde: string | null;
  bloqueada: boolean;
  locked_by_email: string | null;
  locked_at: string | null;
  cantidad_adjuntos: number;
  tiene_adjuntos: boolean;
  cantidad_oc: number;
  ordenes_compra_resumen: string | null;
  estado_oc_principal: string | null;
  evaluacion_principal: string | null;
  recepcion_principal: string | null;
  proveedor_principal: string | null;
  cantidad_diferencias: number;
  tiene_diferencia_oc: boolean;
  productos_total: number;
  productos_activos: number;
  servicios_total: number;
  total_count: number;
}

export interface SolicitudCompraFolioUi {
  folioSol: string | null;
  folioSolLabel: string | null;
  folioOcPrincipal: string | null;
  foliosOc: string[];
}

export interface SolicitudCompraEstadoUi {
  codigo: string;
  nombre: string;
  badgeCodigo: string;
  badgeLabel: string;
}

export interface SolicitudCompraPrioridadUi {
  codigo: string;
  nombre: string;
}

export interface SolicitudCompraAreaUi {
  codigo: string | null;
  nombre: string | null;
}

export interface SolicitudCompraSolicitanteUi {
  nombre: string | null;
}

export interface SolicitudCompraFechaEntregaUi {
  fecha: string | null;
  origen: SolicitudCompraFechaEntregaOrigen | null;
}

export interface SolicitudCompraEquipoPreview {
  loading: boolean;
  codigos: string[];
  visibles: string[];
  ocultos: number;
  error: string | null;
  source: 'mock' | 'batch' | 'none';
}

export interface SolicitudCompraIndicadores {
  bloqueado: {
    visible: boolean;
    lockedByEmail: string | null;
    lockedAt: string | null;
  };
  adjuntos: {
    visible: boolean;
    cantidad: number;
  };
  diferenciaOc: {
    visible: boolean;
    cantidad: number;
  };
}

export interface SolicitudCompraConteosUi {
  productosTotal: number;
  productosActivos: number;
  serviciosTotal: number;
  cantidadOc: number;
}

export interface SolicitudCompraOcResumenUi {
  estadoOcPrincipal: string | null;
  evaluacionPrincipal: string | null;
  recepcionPrincipal: string | null;
  proveedorPrincipal: string | null;
  ordenesCompraResumen: string | null;
}

export interface SolicitudCompraListItem {
  id: string | number;
  viewerRoleCodigo: SolicitudCompraRoleCodigo;
  viewerAreaCodigo: string | null;
  folio: SolicitudCompraFolioUi;
  observacion: string | null;
  estado: SolicitudCompraEstadoUi;
  prioridad: SolicitudCompraPrioridadUi;
  equipos: SolicitudCompraEquipoPreview;
  area: SolicitudCompraAreaUi;
  solicitante: SolicitudCompraSolicitanteUi;
  fechaEntrega: SolicitudCompraFechaEntregaUi;
  indicadores: SolicitudCompraIndicadores;
  grupoListado: SolicitudCompraGrupoListado;
  disponibleDesde: string | null;
  conteos: SolicitudCompraConteosUi;
  ocResumen: SolicitudCompraOcResumenUi;
}

export interface SolicitudCompraListFilters {
  busqueda: string;
  grupoListado: SolicitudCompraGrupoListado;
  estadoCodigo: string | null;
  prioridadCodigo: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  soloBloqueadas: boolean;
  soloDiferenciaOc: boolean;
}

export interface SolicitudCompraPagination {
  pageSize: number;
  remoteOffset: number;
  localVisibleCount: number;
  totalCount: number;
  hasMore: boolean;
}

export interface SolicitudCompraListState {
  items: SolicitudCompraListItem[];
  allSearchItems: SolicitudCompraListItem[];
  rawRows: SolicitudCompraListRpcRow[];
  loading: boolean;
  loadingMore: boolean;
  searching: boolean;
  error: string | null;
  filters: SolicitudCompraListFilters;
  pagination: SolicitudCompraPagination;
  lastRequestKey: string | null;
  initialized: boolean;
}
