import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListItem,
  SolicitudCompraListRpcRow,
  SolicitudCompraRoleCodigo,
} from './solicitudesCompra.types';
import {
  calcularEquiposVisibles,
  formatFolioSol,
  normalizarTextoVacio,
  safeArrayText,
} from './solicitudesCompra.helpers';

const FALLBACK_ROLE: SolicitudCompraRoleCodigo = 'operativo';
const FALLBACK_GRUPO: SolicitudCompraGrupoListado = 'en_proceso';

const ROLE_CODES: SolicitudCompraRoleCodigo[] = [
  'admin',
  'gerencia',
  'almacen',
  'secretaria',
  'operativo',
];

const GRUPO_CODES: SolicitudCompraGrupoListado[] = [
  'en_proceso',
  'completadas',
  'descartadas',
];

const toRoleCodigo = (value: string | null): SolicitudCompraRoleCodigo =>
  ROLE_CODES.includes(value as SolicitudCompraRoleCodigo)
    ? (value as SolicitudCompraRoleCodigo)
    : FALLBACK_ROLE;

const toGrupoListado = (value: SolicitudCompraListRpcRow['grupo_listado']): SolicitudCompraGrupoListado =>
  value && GRUPO_CODES.includes(value) ? value : FALLBACK_GRUPO;

export const mapSolicitudCompraListRowToItem = (
  row: SolicitudCompraListRpcRow
): SolicitudCompraListItem => {
  const foliosOc = safeArrayText(row.folios_oc);
  const ordenesCompraResumenParts = safeArrayText(row.ordenes_compra_resumen);
  const equiposCodigos = safeArrayText(row.equipos);
  const equiposTotal = Math.max(row.equipos_total, 0);
  const { visibles, ocultos } = calcularEquiposVisibles(equiposCodigos);
  const estadoCodigo = normalizarTextoVacio(row.estado_codigo) ?? 'sin_estado';
  const estadoNombre = normalizarTextoVacio(row.estado_nombre) ?? 'Sin estado';
  const prioridadCodigo = normalizarTextoVacio(row.prioridad_codigo) ?? 'sin_prioridad';
  const prioridadNombre = normalizarTextoVacio(row.prioridad_nombre) ?? 'Sin prioridad';
  const cantidadAdjuntos = Math.max(row.cantidad_adjuntos, 0);
  const cantidadDiferencias = Math.max(row.cantidad_diferencias, 0);
  const cantidadOc = Math.max(row.cantidad_oc, 0);
  const productosTotal = Math.max(row.productos_total, 0);
  const productosActivos = Math.max(row.productos_activos, 0);
  const serviciosTotal = Math.max(row.servicios_total, 0);

  return {
    id: row.id,
    viewerRoleCodigo: toRoleCodigo(row.viewer_role_codigo),
    viewerAreaCodigo: normalizarTextoVacio(row.viewer_area_codigo),
    folio: {
      folioSol: normalizarTextoVacio(row.folio_sol),
      folioSolLabel: formatFolioSol(row.folio_sol),
      folioOcPrincipal: normalizarTextoVacio(row.folio_oc_principal),
      foliosOc,
    },
    observacion: normalizarTextoVacio(row.observacion),
    estado: {
      codigo: estadoCodigo,
      nombre: estadoNombre,
      badgeCodigo: normalizarTextoVacio(row.badge_codigo) ?? estadoCodigo,
      badgeLabel: normalizarTextoVacio(row.badge_label) ?? estadoNombre,
    },
    prioridad: {
      codigo: prioridadCodigo,
      nombre: prioridadNombre,
    },
    equipos: {
      loading: false,
      codigos: equiposCodigos,
      visibles,
      ocultos: Math.max(equiposTotal - visibles.length, ocultos, 0),
      error: null,
      source: 'equipos',
    },
    area: {
      codigo: normalizarTextoVacio(row.area_solicitante_codigo),
      nombre: normalizarTextoVacio(row.area_solicitante_nombre),
    },
    solicitante: {
      nombre: normalizarTextoVacio(row.solicitante_nombre),
    },
    fechaEntrega: {
      fecha: normalizarTextoVacio(row.fecha_entrega_mostrada),
      origen: row.fecha_entrega_origen,
    },
    indicadores: {
      bloqueado: {
        visible: row.bloqueada === true,
        lockedByEmail: normalizarTextoVacio(row.locked_by_email),
        lockedAt: normalizarTextoVacio(row.locked_at),
      },
      adjuntos: {
        visible: row.tiene_adjuntos === true && cantidadAdjuntos > 0,
        cantidad: cantidadAdjuntos,
      },
      diferenciaOc: {
        visible:
          row.tiene_diferencia_oc === true &&
          cantidadDiferencias > 0 &&
          cantidadOc > 0,
        cantidad: cantidadDiferencias,
      },
    },
    grupoListado: toGrupoListado(row.grupo_listado),
    disponibleDesde: normalizarTextoVacio(row.disponible_desde),
    conteos: {
      productosTotal,
      productosActivos,
      serviciosTotal,
      cantidadOc,
    },
    ocResumen: {
      estadoOcPrincipal: normalizarTextoVacio(row.estado_oc_principal),
      evaluacionPrincipal: normalizarTextoVacio(row.evaluacion_principal),
      recepcionPrincipal: normalizarTextoVacio(row.recepcion_principal),
      proveedorPrincipal: normalizarTextoVacio(row.proveedor_principal),
      ordenesCompraResumen:
        ordenesCompraResumenParts.length > 0
          ? ordenesCompraResumenParts.join(', ')
          : null,
    },
  };
};

export const mapSolicitudCompraListRowsToItems = (
  rows: SolicitudCompraListRpcRow[]
): SolicitudCompraListItem[] => rows.map(mapSolicitudCompraListRowToItem);
