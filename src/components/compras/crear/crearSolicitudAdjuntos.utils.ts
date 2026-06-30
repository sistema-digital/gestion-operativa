import {
  ADJUNTO_DUPLICATE_ERROR_MESSAGE,
  ADJUNTO_ERROR_MESSAGE,
  ADJUNTO_MAX_FILE_SIZE_BYTES,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';
import type {
  CrearSolicitudAdjuntoKind,
  CrearSolicitudAdjuntoLocalItem,
  CrearSolicitudAdjuntoValidationIssue,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const MIME_BY_EXTENSION: Record<string, string[]> = {
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const KIND_BY_EXTENSION: Record<string, CrearSolicitudAdjuntoKind | null> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  pdf: 'pdf',
  docx: 'docx',
};

const createIssue = (file: File): CrearSolicitudAdjuntoValidationIssue => ({
  localId: crypto.randomUUID(),
  fileName: file.name,
  message: ADJUNTO_ERROR_MESSAGE,
});

const createDuplicateIssue = (file: File): CrearSolicitudAdjuntoValidationIssue => ({
  localId: crypto.randomUUID(),
  fileName: file.name,
  message: ADJUNTO_DUPLICATE_ERROR_MESSAGE,
});

export const getAdjuntoExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? '' : '';
};

export const getAdjuntoKind = (file: File): CrearSolicitudAdjuntoKind | null => {
  const extension = getAdjuntoExtension(file.name);
  return KIND_BY_EXTENSION[extension] ?? null;
};

export const buildAdjuntoFingerprint = (file: File): string => [
  file.name.trim().toLowerCase(),
  String(file.size),
  file.type.trim().toLowerCase(),
  String(file.lastModified),
].join('::');

export const isValidAdjuntoFile = (file: File): boolean => {
  const extension = getAdjuntoExtension(file.name);
  const mimeCandidates = MIME_BY_EXTENSION[extension];

  if (!mimeCandidates || file.size > ADJUNTO_MAX_FILE_SIZE_BYTES) {
    return false;
  }

  return file.type.length === 0 || mimeCandidates.includes(file.type.toLowerCase());
};

export const validateAdjuntosSelection = (
  files: File[],
  existingAdjuntos: CrearSolicitudAdjuntoLocalItem[]
): {
  acceptedFiles: File[];
  invalidIssues: CrearSolicitudAdjuntoValidationIssue[];
} => {
  const existingFingerprints = new Set(existingAdjuntos.map((item) => item.fingerprint));
  const queuedFingerprints = new Set<string>();
  const acceptedFiles: File[] = [];
  const invalidIssues: CrearSolicitudAdjuntoValidationIssue[] = [];

  files.forEach((file) => {
    const fingerprint = buildAdjuntoFingerprint(file);
    const isDuplicate = existingFingerprints.has(fingerprint) || queuedFingerprints.has(fingerprint);

    if (isDuplicate) {
      invalidIssues.push(createDuplicateIssue(file));
      return;
    }

    if (!isValidAdjuntoFile(file) || !getAdjuntoKind(file)) {
      invalidIssues.push(createIssue(file));
      return;
    }

    queuedFingerprints.add(fingerprint);
    acceptedFiles.push(file);
  });

  return {
    acceptedFiles,
    invalidIssues,
  };
};

export const formatAdjuntoSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
};

export const formatAdjuntoDisplayName = (fileName: string): string => {
  const extension = getAdjuntoExtension(fileName);
  const normalizedExtension = extension ? `.${extension}` : '';
  const baseName = normalizedExtension
    ? fileName.slice(0, -(normalizedExtension.length))
    : fileName;
  const trimmedBaseName = baseName.slice(0, 10);

  return `${trimmedBaseName}..... ${normalizedExtension}`.trim();
};
