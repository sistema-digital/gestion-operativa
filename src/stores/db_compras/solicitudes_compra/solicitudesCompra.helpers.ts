import type {
  SolicitudCompraEquipoPreview,
  SolicitudCompraPagination,
} from './solicitudesCompra.types';

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_VISIBLE_EQUIPOS = 3;
const MOCK_EQUIPOS = ['422005', '422009', '422014'] as const;

export const normalizarTextoVacio = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

export const normalizarBusqueda = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

export const safeArrayText = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  return normalizedValue.length > 0 ? [normalizedValue] : [];
};

export const calcularEquiposVisibles = (
  codigos: string[],
  max = DEFAULT_VISIBLE_EQUIPOS
): { visibles: string[]; ocultos: number } => {
  const normalizedCodigos = safeArrayText(codigos);
  const visibles = normalizedCodigos.slice(0, max);
  const ocultos = Math.max(normalizedCodigos.length - visibles.length, 0);

  return { visibles, ocultos };
};

export const crearEquiposMock = (): SolicitudCompraEquipoPreview => {
  const codigos = [...MOCK_EQUIPOS];
  const { visibles, ocultos } = calcularEquiposVisibles(codigos);

  return {
    loading: false,
    codigos,
    visibles,
    ocultos,
    error: null,
    source: 'mock',
  };
};

export const isSearchMode = (value: string): boolean =>
  normalizarBusqueda(value).length > 0;

export const formatFolioSol = (folioSol: string | null): string | null => {
  const normalizedFolio = normalizarTextoVacio(folioSol);

  if (!normalizedFolio) {
    return null;
  }

  return normalizedFolio.startsWith('#') ? normalizedFolio : `#${normalizedFolio}`;
};

export const getInitialPagination = (
  totalCount = 0
): SolicitudCompraPagination => ({
  pageSize: DEFAULT_PAGE_SIZE,
  remoteOffset: 0,
  localVisibleCount: DEFAULT_PAGE_SIZE,
  totalCount,
  hasMore: totalCount > DEFAULT_PAGE_SIZE,
});

export const getNextRemoteOffset = (
  pagination: SolicitudCompraPagination
): number => pagination.remoteOffset + pagination.pageSize;

export const canLoadMoreRemote = (
  pagination: SolicitudCompraPagination
): boolean => getNextRemoteOffset(pagination) < pagination.totalCount;

export const canShowMoreLocal = (
  totalItems: number,
  visibleCount: number
): boolean => totalItems > visibleCount;
