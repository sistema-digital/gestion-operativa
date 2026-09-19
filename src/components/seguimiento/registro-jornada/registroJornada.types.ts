/**
 * Modelo frontend compartido para la captura administrativa de jornadas.
 * No define contratos de RPC ni reglas de validación.
 */

export type ActividadTipo = "labor" | "parada";

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

/**
 * Forma que la interfaz puede consumir tras registrar un implemento.
 * La respuesta real del RPC sigue pendiente de verificación en Supabase.
 */
export interface RegistroImplementoResponse {
  implemento?: ImplementoOption;
}

export interface JornadaInicioRpcPayload {
  p_operador_id: string;
  p_fecha_operativa: string;
  p_equipo_numero: string;
  p_labor_id: string | null;
  p_ocurrio_en: string;
  p_implemento_id: string | null;
  p_latitud: number | null;
  p_longitud: number | null;
}

export interface JornadaEventoRpcPayload {
  p_jornada_id: string;
  p_ocurrio_en: string;
  p_latitud: number | null;
  p_longitud: number | null;
}

export interface CambiarLaborRpcPayload extends JornadaEventoRpcPayload {
  p_nueva_labor_id: string;
}

export interface RegistrarParadaRpcPayload extends JornadaEventoRpcPayload {
  p_tipo_parada_id: string;
  p_observacion: string | null;
}

export interface CambiarTipoParadaRpcPayload extends RegistrarParadaRpcPayload {
  p_modo: "cambio_real" | "correccion";
}

export interface ReanudarTrabajoRpcPayload extends JornadaEventoRpcPayload {
  p_labor_id: string;
}

export interface CambiarImplementoRpcPayload extends JornadaEventoRpcPayload {
  p_nuevo_implemento_id: string | null;
  p_labor_id: string | null;
}

export interface JornadaRpcResponse {
  ok: boolean;
  jornada_id: string;
  estado: "trabajando" | "parado" | "sin_labor" | "finalizada";
  secuencia?: number;
  requiere_parada_inicial?: boolean;
  requiere_labor_al_reanudar?: boolean;
  ya_finalizada?: boolean;
}
