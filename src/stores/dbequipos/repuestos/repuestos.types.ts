export interface CatalogItem {
  id: string;
  name: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CatalogTableName =
  | 'repuesto_sistema'
  | 'repuesto_categoria'
  | 'repuesto_criticidad'
  | 'repuesto_estado'
  | 'repuesto_unidad'
  | 'repuesto_proveedor'
  | 'repuesto_tipo_codigo_proveedor';

export interface RepuestoCaptura {
  id?: string;
  tipo_equipo: string;
  modelo: string;
  sistema: string;
  nombre_repuesto: string;
  categoria?: string | null;
  criticidad?: string | null;
  estado?: string;
  codigo_original: string;
  codigo_proveedor: string;
  tipo_codigo_proveedor?: string | null;
  nombre_proveedor?: string | null;
  unidad?: string | null;
  cantidad_requerida?: number | null;
  descripcion_corta?: string | null;
  descripcion_detallada?: string | null;
  imagen_1?: string | null;
  imagen_2?: string | null;
  observacion?: string | null;
  creado_por?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface RepuestosState {
  sistemas: CatalogItem[];
  categorias: CatalogItem[];
  criticidades: CatalogItem[];
  estados: CatalogItem[];
  unidades: CatalogItem[];
  proveedores: CatalogItem[];
  tiposCodigoProveedor: CatalogItem[];
  repuestosCaptura: RepuestoCaptura[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}