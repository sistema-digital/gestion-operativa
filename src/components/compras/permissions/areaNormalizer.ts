import type { SolicitudArea } from './types'

export const AREAS_OPERATIVAS = new Set<string>([
  'COSECHA MECANIZADA',
  'COSECHA AGRICOLA',
  'ENGRASE',
  'EQUIPO PESADO',
  'MECANICA DE TRANSPORTE',
  'SERVICIOS GENERALES',
])

export function normalizeAreaText(area?: string | null): string {
  return (area ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

export function getSolicitudArea(area?: string | null): SolicitudArea {
  const normalizedArea = normalizeAreaText(area)

  if (normalizedArea === 'ALL') {
    return 'all'
  }

  if (normalizedArea === 'GERENCIA') {
    return 'gerencia'
  }

  if (normalizedArea === 'ALMACEN') {
    return 'almacen'
  }

  if (normalizedArea === 'SECRETARIA') {
    return 'secretaria'
  }

  if (AREAS_OPERATIVAS.has(normalizedArea)) {
    return 'operativa'
  }

  return 'sin_permiso'
}
