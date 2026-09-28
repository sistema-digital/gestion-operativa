export const SUBSISTEMA_NOMBRE_MAX = 100;

export type CatalogoSubsistemaEstado = "activos" | "desactivados" | "todos";
export type CatalogoSubsistemaUso = "en-uso" | "sin-uso" | "todos";
export type CatalogoSubsistemaSortKey =
  "nombre" | "estado" | "equipos" | "asignaciones";
export type CatalogoSubsistemaEditorMode = "cerrado" | "crear" | "editar";
export type CatalogoSortDirection = "asc" | "desc";

export interface CatalogoRelacionado {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoSubsistemaImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoRelacionado[];
}

export interface CatalogoSubsistemaItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  sistemas: CatalogoRelacionado[];
  aceites: CatalogoRelacionado[];
  impacto: CatalogoSubsistemaImpacto;
}

export interface CatalogoSubsistemasResumen {
  total: number;
  activos: number;
  desactivados: number;
}

export interface CatalogoSubsistemaGuardarInput {
  id: number | null;
  nombre: string;
  activo: boolean;
}

export interface CatalogoSubsistemaGuardarResultado {
  operacion: "creado" | "actualizado";
  codigo: "SUBSISTEMA_CREADO" | "SUBSISTEMA_ACTUALIZADO";
  mensaje: string;
  afectaEquipos: number;
  item: CatalogoSubsistemaItem;
}

export interface CatalogoSubsistemaFieldErrors {
  nombre?: string;
}

export interface CatalogoSubsistemasQuery {
  busqueda: string;
  estado: CatalogoSubsistemaEstado;
  uso: CatalogoSubsistemaUso;
}
