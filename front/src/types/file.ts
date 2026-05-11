export type FileStatus = 'available' | 'deleted';

export type FileSummary = {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  status: FileStatus;
};

export type UploadError =
  | { kind: 'file-missing'; message: string }
  | { kind: 'file-too-large'; message: string }
  | { kind: 'file-type-rejected'; message: string }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'network'; message: string };

export function isUploadError(value: unknown): value is UploadError {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return (
    kind === 'file-missing' ||
    kind === 'file-too-large' ||
    kind === 'file-type-rejected' ||
    kind === 'unauthorized' ||
    kind === 'network'
  );
}

export type FileListError =
  | { kind: 'unauthorized'; message: string }
  | { kind: 'network'; message: string };

export function isFileListError(value: unknown): value is FileListError {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === 'unauthorized' || kind === 'network';
}

export type FileDeleteError =
  | { kind: 'not-found'; message: string }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'network'; message: string };

export function isFileDeleteError(value: unknown): value is FileDeleteError {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === 'not-found' || kind === 'unauthorized' || kind === 'network';
}
