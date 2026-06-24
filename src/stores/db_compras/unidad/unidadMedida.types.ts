export interface UnidadMedidaRow {
  id: number;
  codigo: string;
  abreviatura: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export interface UnidadMedidaOption {
  id: number;
  codigo: string;
  abreviatura: string;
  descripcion: string;
}
