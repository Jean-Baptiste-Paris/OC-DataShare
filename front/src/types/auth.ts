export type RegisterPayload = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type RegisterFieldErrors = Partial<Record<'email' | 'password', string>>;

export type RegisterError =
  | { kind: 'email-already-taken'; message: string }
  | { kind: 'validation'; fieldErrors: RegisterFieldErrors }
  | { kind: 'network'; message: string };

export function isRegisterError(value: unknown): value is RegisterError {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === 'email-already-taken' || kind === 'validation' || kind === 'network';
}
