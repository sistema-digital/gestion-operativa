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

export type RepuestoImageSlot = 'frente' | 'lado' | 'puesta' | 'extra';

export type RepuestoImageFileMap = Record<RepuestoImageSlot, File | null>;

export type RepuestoImageUrlMap = Record<RepuestoImageSlot, string | null>;

export interface RepuestoImagenesParseadas {
  miniaturaPath: string | null;
  originales: string[];
  frentePath: string | null;
  ladoPath: string | null;
  puestaPath: string | null;
  extraPath: string | null;
}

export interface RepuestoImagenesFirmadas {
  miniaturaUrl: string | null;
  frenteUrl: string | null;
  ladoUrl: string | null;
  puestaUrl: string | null;
  extraUrl: string | null;
  originales: Array<{
    slot: RepuestoImageSlot;
    path: string;
    url: string | null;
  }>;
}

export interface RepuestoCaptura {
  id?: string;
  tipo_equipo: string[];
  modelo: string[];
  sistema: string;
  nombre_repuesto: string;
  categoria?: string | null;
  criticidad?: string | null;
  estado?: string;
  codigo_original: string;
  codigo_almacen?: string | null;
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
