export type FileSummary = {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
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
