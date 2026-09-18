/**
 * registroJornada.types.ts
 *
 * Tipos compartidos por todos los componentes de captura administrativa.
 * No ejecuta RPC.
 */

export type ActividadTipo = 'labor' | 'parada';

export interface OperadorOption {
  id: string;
  nombre: string;
}

export interface EquipoOption {
  numero: string;
  etiqueta: string;
  area?: string | null;
}

export interface LaborCatalogo {
  id: string;
  orden: number;
  nombre: string;
  activo: boolean;
}

export interface TipoParadaCatalogo {
  id: string;
  orden: number;
  nombre: string;
  activo: boolean;
  libera_labor_actual?: boolean;
}

export interface ImplementoTipoOption {
  id: string;
  nombre: string;
}

export interface ImplementoOption {
  id: string;
  numero: string;
  nombre: string | null;
  tipo_implemento_id: string;
  activo: boolean;
}

export interface JornadaFilaModel {
  idLocal: string;
  inicio: string;
  fin: string;
  codigo: number | null;

  // Resuelto automáticamente a partir del código.
  tipoActividad: ActividadTipo | null;
  actividadId: string | null;
  actividadNombre: string;

  implementoId: string | null;
}

export interface JornadaDatosGeneralesModel {
  fecha: string | null;
  operadorId: string | null;
  equipoNumero: string | null;
  area: string | null;
}

export interface JornadaState extends JornadaDatosGeneralesModel {
  observaciones: string;
  filas: JornadaFilaModel[];
}

export interface CatalogosJornada {
  labores: LaborCatalogo[];
  tiposParada: TipoParadaCatalogo[];
  implementos: ImplementoOption[];
  implementoTipos: ImplementoTipoOption[];
}

export interface ImplementoCrearPayload {
  numero: string;
  tipoImplementoId: string;
  nombre?: string | null;
}
