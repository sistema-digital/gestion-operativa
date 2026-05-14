export interface BadgeItem {
  id?: string | number;
  label: string;
}

export type BadgeInput = string[] | BadgeItem[];

export interface KPI {
  name: string;
  value: string | number;
  callback?: () => void;
}

export interface RowAction {
  label: string;
  icon?: any;
  callback: (data: any) => void;
}


export type UnidadMedida = {
  id: number
  abreviatura: string
}

export type ProductoDetalle = {
  descripcion: string
  unidad_medida: UnidadMedida | null
  activo: boolean
}

export type DetalleSolicitud = {
  id: string
  cantidad: number | null
  producto: ProductoDetalle
  folio_sol: string
  cod_producto: string
  solicitud_id: string
  estatus_datalle: number
  cantidad_gerencia: number | null
  cantidad_inventario: number | null
  cantidad_subida_sistema_compra: number | null
}

export type SolicitudCompraEstadoBroadcast = {
  solicitud_id: string;
  folio_sol: string | null;
  estado_id: number;
  estado_actual_id: number;
  historial_id: string;
  fecha_inicio: string;
  event_at: string;
};


export type TomarSolicitudParaEdicionResponse =
  | {
      success: true
      message: string
      solicitud_id: string
      folio_sol: string
      estado_anterior_id: number
      estado_actual_id: number
      historial_cerrado: boolean
      historial_insertado: boolean
    }
  | {
      success: false
      message: string
      solicitud_id: string
      folio_sol: string
      estado_actual_id: number
      estado_nuevo_id: number
      historial_cerrado: boolean
      historial_insertado: boolean
    }

  export type ActualizarDetalleAlmacenPayload = {
    id_db: string;
    cantidad_inventario: number;
    estatus_detalle: number;
    status_producto: boolean;
    cod_producto: string;
  };

  export type ActualizarSolicitudAlmacen = {
    solicitud_id:string;
    estado_actual:number;
    detallesActualizar:ActualizarDetalleAlmacenPayload[];
    creadoPor:string
  };

export type ActualizarSolicitudAlmacenResponse = {
  success: boolean;
  message: string;
  solicitud_id: string;
  folio_sol: string | null;
  estado_anterior_id: number;
  estado_actual_id: number;
  updated_detalles_count: number;
  updated_productos_count: number;
  historial_cerrado_count: number;
  historial_insertado: boolean;
  fechaInicioEstadoActuial:string;
};