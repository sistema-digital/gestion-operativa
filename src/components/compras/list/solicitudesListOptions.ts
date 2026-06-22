import type {
  SolicitudCompraEstadoFilterOption,
  SolicitudCompraGrupoListado,
  SolicitudCompraGrupoOption,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const allEstadoOptions: SolicitudCompraEstadoFilterOption[] = [
  { value: null, label: 'Todos estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'para_revision_almacen', label: 'Para revisión almacén' },
  { value: 'en_revision_almacen', label: 'En revisión almacén' },
  { value: 'para_revision_supervisor', label: 'Para revisión supervisor' },
  { value: 'en_revision_supervisor', label: 'En revisión supervisor' },
  { value: 'para_revision_gerencia', label: 'Para revisión gerencia' },
  { value: 'en_revision_gerencia', label: 'En revisión gerencia' },
  { value: 'aprobado_gerencia', label: 'Aprobado gerencia' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'subido_sistema_compra', label: 'Subido a sistema' },
  { value: 'orden_compra', label: 'Orden de compra' },
];

const estadoCodesByGrupo: Record<SolicitudCompraGrupoListado, string[]> = {
  en_proceso: [
    'borrador',
    'para_revision_almacen',
    'en_revision_almacen',
    'para_revision_supervisor',
    'en_revision_supervisor',
    'para_revision_gerencia',
    'en_revision_gerencia',
  ],
  completadas: [
    'aprobado_gerencia',
    'subido_sistema_compra',
    'orden_compra',
  ],
  descartadas: [
    'rechazado',
  ],
};

export const solicitudCompraGrupoOptions: SolicitudCompraGrupoOption[] = [
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completadas', label: 'Completadas' },
  { value: 'descartadas', label: 'Descartadas' },
];

export const prioridadOptions = [
  { value: null, label: 'Todas prioridades' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'baja', label: 'Baja' },
];

export const getEstadoOptionsForGrupo = (
  grupo: SolicitudCompraGrupoListado
): SolicitudCompraEstadoFilterOption[] => {
  const allowedCodes = new Set(estadoCodesByGrupo[grupo]);

  return allEstadoOptions.filter((option) =>
    option.value === null || allowedCodes.has(option.value)
  );
};

export const isEstadoAllowedForGrupo = (
  grupo: SolicitudCompraGrupoListado,
  estadoCodigo: string | null
): boolean => {
  if (!estadoCodigo) {
    return true;
  }

  return estadoCodesByGrupo[grupo].includes(estadoCodigo);
};
