export interface EquipoRow {
  id: number;
  cod_equipo: string;
  modelo: string | null;
  marca: string | null;
  tipo: string | null;
  activo: boolean | null;
}

export interface EquipoOption {
  id: number;
  codEquipo: string;
  modelo: string | null;
  marca: string | null;
  tipo: string | null;
  label: string;
}

export interface BuscarEquiposParams {
  query: string;
  limit?: number;
}

export interface EquiposState {
  searchResults: EquipoOption[];
  selectedItems: EquipoOption[];
  isSearching: boolean;
  error: string | null;
  lastQuery: string;
}
