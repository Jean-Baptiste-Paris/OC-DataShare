import { AxiosError } from 'axios';
import { apiClient } from '@/lib/apiClient';
import type {
  RegisterError,
  RegisterFieldErrors,
  RegisterPayload,
  User,
} from '@/types/auth';

type RegisterServerResponse = {
  data: User;
};

type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  violations?: Array<{ propertyPath: string; title: string }>;
};

const DEFAULT_NETWORK_MESSAGE =
  'Le serveur est indisponible. Réessaie dans un instant.';

const DEFAULT_EMAIL_TAKEN_MESSAGE = 'Un compte avec cet email existe déjà.';

export const authService = {
  /**
   * Crée un compte utilisateur. Lève {@link RegisterError} en cas d'échec.
   */
  async register(payload: RegisterPayload): Promise<User> {
    try {
      const response = await apiClient.post<RegisterServerResponse>(
        '/api/auth/register',
        payload,
      );
      return response.data.data;
    } catch (err) {
      throw mapRegisterError(err);
    }
  },
};

function mapRegisterError(err: unknown): RegisterError {
  if (err instanceof AxiosError && err.response) {
    const status = err.response.status;
    const problem = err.response.data as ProblemDetail | undefined;

    if (status === 409) {
      return {
        kind: 'email-already-taken',
        message: problem?.detail ?? DEFAULT_EMAIL_TAKEN_MESSAGE,
      };
    }

    if (status === 422) {
      return {
        kind: 'validation',
        fieldErrors: extractFieldErrors(problem?.violations),
      };
    }
  }

  return { kind: 'network', message: DEFAULT_NETWORK_MESSAGE };
}

function extractFieldErrors(
  violations: ProblemDetail['violations'],
): RegisterFieldErrors {
  const fieldErrors: RegisterFieldErrors = {};
  for (const violation of violations ?? []) {
    if (violation.propertyPath === 'email' || violation.propertyPath === 'password') {
      fieldErrors[violation.propertyPath] = violation.title;
    }
  }
  return fieldErrors;
}
