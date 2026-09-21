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
  orden: number | null;
  nombre: string;
  activo: boolean;
}

export interface TipoParadaCatalogo {
  id: string;
  orden: number | null;
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
  tipo_implemento_id?: string;
  activo?: boolean;
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

export type JornadaEstadoCaptura = "en_edicion" | "finalizada" | "descartada";

export interface JornadaAdministrativaListaItem {
  jornadaId: string;
  operadorId: string;
  operador: string;
  fechaOperativa: string;
  iniciadaEn: string | null;
  finalizadaEn: string | null;
  estadoCaptura: JornadaEstadoCaptura;
  publicadoJornadaId: string | null;
  actualizadoEn: string | null;
  eventosActivos: number;
}

export interface JornadaAdministrativaFiltros {
  desde: string | null;
  hasta: string | null;
  estado: JornadaEstadoCaptura | null;
}

export interface JornadaAdministrativaDetalle {
  id: string;
  operadorId: string;
  operador: string;
  fechaOperativa: string;
  iniciadaEn: string | null;
  finalizadaEn: string | null;
  estadoCaptura: JornadaEstadoCaptura;
  equipoNumero: string | null;
  eventosActivos: number;
  filas: JornadaAdministrativaFila[];
  eventos: JornadaAdministrativaEvento[];
}

export interface JornadaAdministrativaFilaActividad {
  id: string;
  codigo: string;
  nombre: string;
  requiereImplemento?: boolean;
}

export interface JornadaAdministrativaFilaImplemento {
  id: string;
  numero: string;
  nombre: string | null;
}

export interface JornadaAdministrativaFila {
  numero: number;
  inicio: string;
  fin: string | null;
  inicioLocal: string;
  finLocal: string | null;
  tipo: ActividadTipo;
  equipoNumero: string;
  labor: JornadaAdministrativaFilaActividad | null;
  parada: JornadaAdministrativaFilaActividad | null;
  implemento: JornadaAdministrativaFilaImplemento | null;
  observacion: string | null;
  duracion: string | null;
}

export interface JornadaAdministrativaEvento {
  id: string;
  clientEventId: string | null;
  publicEventoId: string | null;
  secuencia: number;
  tipoEvento: EventoLoteTipo;
  ocurrioEn: string;
  ocurrioEnLocal: string | null;
  anulado: boolean;
  payload: EventoLotePayload;
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

export type EventoLoteTipo =
  | "inicio_jornada"
  | "cambiar_labor"
  | "inicio_parada"
  | "cambio_causa"
  | "reanudar"
  | "confirmar_cambio_implemento"
  | "finalizar_jornada";

export interface EventoLotePayload {
  operador_id?: string;
  fecha_operativa?: string;
  equipo_numero?: string;
  labor_id?: string | null;
  implemento_id?: string | null;
  nueva_labor_id?: string;
  tipo_parada_id?: string;
  modo?: "cambio_real";
  observacion?: string | null;
  nuevo_implemento_id?: string | null;
}

export interface EventoLote {
  secuencia: number;
  tipo_evento: EventoLoteTipo;
  client_event_id: string;
  ocurrio_en: string;
  latitud: null;
  longitud: null;
  payload: EventoLotePayload;
}

export interface RegistroEventosLotePayload {
  p_jornada_id: string;
  p_eventos: EventoLote[];
  p_finalizar: boolean;
}

export interface RegistroEventosLoteError {
  codigo: string;
  mensaje: string;
  detalle: string | null;
  pista: string | null;
}

export interface RegistroEventosLoteEventoFallido {
  secuencia: number;
  tipo_evento: EventoLoteTipo;
  client_event_id: string;
  ocurrio_en: string;
}

export interface RegistroEventosLoteResponse {
  ok: boolean;
  rollback: boolean;
  jornada_id: string;
  procesados: number;
  modo?: string;
  borrador?: boolean;
  borrador_reemplazado?: boolean;
  borrador_previo_conservado?: boolean;
  estado_captura?: JornadaEstadoCaptura;
  publicada_jornada_id?: string | null;
  error?: RegistroEventosLoteError;
  evento_fallido?: RegistroEventosLoteEventoFallido;
}

export interface RegistroJornadaFeedback {
  estado: "exito" | "error";
  modo: "borrador" | "finalizada";
  procesados?: number;
  borradorReemplazado?: boolean;
  borradorPrevioConservado?: boolean;
  codigo?: string;
  mensaje: string;
  eventoFallido?: RegistroEventosLoteEventoFallido;
}
