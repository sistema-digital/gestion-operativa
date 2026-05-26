export interface MecanicoMantenimiento {
  id: number;
  NOMBRE: string | null;
  AREA: string | null;
  'EQUIPO DE TRABAJO': string | null;
  is_enabled: boolean | null;
}

export interface MecanicosState {
  mecanicosPorArea: Record<string, MecanicoMantenimiento[]>;
  areasCargadas: string[];
  isLoading: boolean;
  error: string | null;
}
