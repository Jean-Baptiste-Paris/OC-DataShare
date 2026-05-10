export type SharedFile = {
  name: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
};

export type ShareError =
  | { kind: 'not-found'; message: string }
  | { kind: 'network'; message: string };

export function isShareError(value: unknown): value is ShareError {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === 'not-found' || kind === 'network';
}
