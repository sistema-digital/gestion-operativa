import type {
  CatalogoActivo,
  NodoEstructuraLubricacion,
} from "./estructuraLubricacion.types";

export type EstadoNodoEstructura =
  "existente" | "nuevo" | "pendiente_eliminacion";

export interface NodoEstructuraBorrador {
  localId: string;
  estadoLocal: EstadoNodoEstructura;
  id: number | null;
  tempId: string | null;
  parentId: number | null;
  parentTempId: string | null;
  sistemaId: number | null;
  subsistemaId: number | null;
  aceiteId: number | null;
  sistema: CatalogoActivo | null;
  subsistema: CatalogoActivo | null;
  aceite: CatalogoActivo | null;
}

export interface AgregarRaizEstructuraInput {
  sistema: CatalogoActivo;
  aceite: CatalogoActivo | null;
}

export interface AgregarHijoEstructuraInput {
  parentLocalId: string;
  subsistema: CatalogoActivo;
  aceite: CatalogoActivo | null;
}

export interface ActualizarNodoEstructuraInput {
  localId: string;
  aceite: CatalogoActivo | null;
}

export interface MoverNodoEstructuraInput {
  localId: string;
  nuevoPadreLocalId: string | null;
}

export interface ErrorValidacionEstructura {
  codigo: string;
  mensaje: string;
  localId?: string;
}

export interface ResultadoValidacionEstructura {
  valido: boolean;
  errores: ErrorValidacionEstructura[];
}

export type ResultadoMutacionEstructura =
  | { ok: true; nodos: NodoEstructuraBorrador[]; localId: string }
  | {
      ok: false;
      codigo: string;
      mensaje: string;
      nodos: NodoEstructuraBorrador[];
    };

export interface EliminarNodoEstructuraResultado {
  nodos: NodoEstructuraBorrador[];
  eliminados: NodoEstructuraBorrador[];
}

export interface NodoEstructuraArbol extends NodoEstructuraBorrador {
  hijos: NodoEstructuraArbol[];
  profundidad: number;
  ruta: string;
}

export interface NodoEstructuraNuevoPayload {
  temp_id: string;
  parent_id: number | null;
  parent_temp_id: string | null;
  sistema_id: number | null;
  subsistema_id: number | null;
  aceite_id: number | null;
}

export interface NodoEstructuraActualizadoPayload {
  id: number;
  parent_id?: number | null;
  parent_temp_id?: string | null;
  aceite_id?: number | null;
}

export interface NodoEstructuraEliminadoPayload {
  id: number;
}

export interface EstructuraSistemasCambiosPayload {
  nuevos: NodoEstructuraNuevoPayload[];
  actualizados: NodoEstructuraActualizadoPayload[];
  eliminados: NodoEstructuraEliminadoPayload[];
}

export class ErrorEstructuraLubricacion extends Error {
  readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = "ErrorEstructuraLubricacion";
    this.codigo = codigo;
  }
}

export type { NodoEstructuraLubricacion };
