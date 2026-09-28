export interface CatalogoActivo {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface AuxiliaresEstructuraLubricacion {
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
}

export interface NodoEstructuraLubricacion {
  id: number;
  parentId: number | null;
  sistema: CatalogoActivo | null;
  subsistema: CatalogoActivo | null;
  aceite: CatalogoActivo | null;
}

export interface NodoEstructuraTemporal {
  tempId: string;
  parentTempId: string | null;
  sistemaId: number | null;
  subsistemaId: number | null;
  aceiteId: number | null;
}

export interface EstructuraSistemasTempIds {
  [tempId: string]: number;
}
