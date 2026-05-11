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
}

export type DetalleSolicitud = {
  id: string
  cantidad: number | null
  producto: ProductoDetalle | null
  folio_sol: string
  cod_producto: string
  solicitud_id: string
  estatus_datalle: number
  cantidad_gerencia: number | null
  cantidad_inventario: number | null
  cantidad_subida_sistema_compra: number | null
}
