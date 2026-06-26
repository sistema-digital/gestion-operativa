import type {
  RepuestoCaptura,
  RepuestoImageFileMap,
  RepuestoImageSlot,
  RepuestoImagenesParseadas,
  RepuestoImageUrlMap
} from './repuestos.types';

export const REPUESTO_IMAGE_SLOTS: RepuestoImageSlot[] = [
  'frente',
  'lado',
  'puesta',
  'extra'
];

export const REQUIRED_REPUESTO_IMAGE_SLOTS: RepuestoImageSlot[] = [
  'frente',
  'lado'
];

export const createEmptyRepuestoImageFileMap = (): RepuestoImageFileMap => ({
  frente: null,
  lado: null,
  puesta: null,
  extra: null
});

export const createEmptyRepuestoImageUrlMap = (): RepuestoImageUrlMap => ({
  frente: null,
  lado: null,
  puesta: null,
  extra: null
});

export const parseRepuestoImagenes = (
  repuesto: Pick<RepuestoCaptura, 'imagen_1' | 'imagen_2'> | null | undefined
): RepuestoImagenesParseadas => {
  const originalSlots = (repuesto?.imagen_2 ?? '')
    .split(';')
    .map((item) => item.trim());

  const originales = originalSlots.filter(Boolean);

  return {
    miniaturaPath: repuesto?.imagen_1?.trim() || null,
    originales,
    frentePath: originalSlots[0] || null,
    ladoPath: originalSlots[1] || null,
    puestaPath: originalSlots[2] || null,
    extraPath: originalSlots[3] || null
  };
};

export const buildOriginalImagesValue = (
  paths: Partial<Record<RepuestoImageSlot, string | null | undefined>>
) => {
  const orderedPaths = REPUESTO_IMAGE_SLOTS.map((slot) => paths[slot]?.trim() || '');

  while (orderedPaths.length > 0 && orderedPaths[orderedPaths.length - 1] === '') {
    orderedPaths.pop();
  }

  return orderedPaths.length > 0 ? orderedPaths.join(';') : null;
};

export const getPathForSlot = (
  parsedImages: RepuestoImagenesParseadas,
  slot: RepuestoImageSlot
) => {
  switch (slot) {
    case 'frente':
      return parsedImages.frentePath;
    case 'lado':
      return parsedImages.ladoPath;
    case 'puesta':
      return parsedImages.puestaPath;
    case 'extra':
      return parsedImages.extraPath;
  }
};
