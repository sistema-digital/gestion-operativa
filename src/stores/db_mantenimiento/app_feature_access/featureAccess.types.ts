export type FuncionalidadPermitida = string;

export type ObtenerFuncionalidadesPermitidasResponse = FuncionalidadPermitida[];

export interface FeatureAccessState {
  funcionalidadesPermitidas: FuncionalidadPermitida[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}
