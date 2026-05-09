import { AxiosError } from 'axios';
import { apiClient } from '@/lib/apiClient';
import type {
  LoginError,
  LoginPayload,
  RegisterError,
  RegisterFieldErrors,
  RegisterPayload,
  User,
} from '@/types/auth';

type EnvelopedResponse<T> = { data: T };

type LoginResponse = { token: string };

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

const DEFAULT_INVALID_CREDENTIALS_MESSAGE =
  'Email ou mot de passe incorrect.';

export const authService = {
  /**
   * Crée un compte utilisateur. Lève {@link RegisterError} en cas d'échec.
   */
  async register(payload: RegisterPayload): Promise<User> {
    try {
      const response = await apiClient.post<EnvelopedResponse<User>>(
        '/api/auth/register',
        payload,
      );
      return response.data.data;
    } catch (err) {
      throw mapRegisterError(err);
    }
  },

  /**
   * Authentifie un utilisateur et retourne le JWT. Lève {@link LoginError} sur échec.
   */
  async login(payload: LoginPayload): Promise<string> {
    try {
      const response = await apiClient.post<EnvelopedResponse<LoginResponse>>(
        '/api/auth/login',
        payload,
      );
      return response.data.data.token;
    } catch (err) {
      throw mapLoginError(err);
    }
  },

  /**
   * Récupère l'utilisateur courant à partir du JWT (header Authorization injecté
   * par l'intercepteur axios). Lève une erreur si le token est invalide/absent.
   */
  async me(): Promise<User> {
    const response = await apiClient.get<EnvelopedResponse<User>>('/api/auth/me');
    return response.data.data;
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

function mapLoginError(err: unknown): LoginError {
  if (err instanceof AxiosError && err.response?.status === 401) {
    return {
      kind: 'invalid-credentials',
      message: DEFAULT_INVALID_CREDENTIALS_MESSAGE,
    };
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
