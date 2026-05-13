export interface SolicitudCompraConDetalles {
  id: string
  folio_sol: string | null
  email: string
  estado_id: number
  fecha_entrega: string
  fecha_creacion: string
  observacion: string
  prioridad_id?: number | null

  detalles: DetalleSolicitudCompra[]
}

export interface EquipoSolicitudInitialData {
  cod_equipo: string
}

export interface SolicitudCompraInitialData extends SolicitudCompraConDetalles {
  nombreSolicitante: string
  detalles: DetalleSolicitudCompra[]
  equipos: EquipoSolicitudInitialData[]
}

export interface DetalleSolicitudCompra {
  id: string
  solicitud_id: string | null
  folio_sol: string | null
  cod_producto: string | null

  cantidad: number | null
  cantidad_inventario: number | null
  cantidad_gerencia: number | null
  cantidad_subida_sistema_compra: number | null

  producto: ProductoDetalleSolicitud
}

export interface ProductoDetalleSolicitud {
  descripcion: string | null
  activo: boolean | null

  unidad_medida: UnidadMedidaDetalle | null
}

export interface UnidadMedidaDetalle {
  id: number | null
  abreviatura: string | null
}
