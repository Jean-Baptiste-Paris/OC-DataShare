/**
 * Validation client de l'upload (UX). L'autorité reste côté serveur :
 * extension blacklist + magic bytes (cf. CLAUDE.md ambiguïté #6).
 * Cette duplication front/back est assumée en MVP — à factoriser via
 * env-config ou code-gen en V2 si la liste évolue.
 */
export const BLACKLISTED_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'com',
  'scr',
  'msi',
  'ps1',
  'vbs',
  'vbe',
  'wsf',
  'wsh',
  'jar',
] as const;

export const MAX_SIZE_BYTES = 1_073_741_824;
export const MAX_SIZE_HUMAN = '1 Go';

export type UploadValidationError =
  | { kind: 'extension-blacklisted'; extension: string }
  | { kind: 'file-too-large' };

export function validateUploadFile(file: File): UploadValidationError | null {
  const extension = extractExtension(file.name);
  if (extension && (BLACKLISTED_EXTENSIONS as readonly string[]).includes(extension)) {
    return { kind: 'extension-blacklisted', extension };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { kind: 'file-too-large' };
  }
  return null;
}

export function getUploadValidationMessage(error: UploadValidationError): string {
  if (error.kind === 'extension-blacklisted') {
    return `Le type de fichier ".${error.extension}" n'est pas autorisé.`;
  }
  return `La taille du fichier dépasse la limite autorisée (${MAX_SIZE_HUMAN}).`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${formatFr(bytes / 1024, 1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${formatFr(bytes / (1024 * 1024), 1)} Mo`;
  return `${formatFr(bytes / (1024 * 1024 * 1024), 2)} Go`;
}

function formatFr(value: number, decimals: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function extractExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return filename.slice(dotIndex + 1).toLowerCase();
}
