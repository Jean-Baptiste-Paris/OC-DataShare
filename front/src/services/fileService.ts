import { AxiosError } from 'axios';
import { apiClient } from '@/lib/apiClient';
import type { FileSummary, UploadError } from '@/types/file';

type EnvelopedResponse<T> = { data: T };

type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
};

const DEFAULT_NETWORK_MESSAGE =
  'Le serveur est indisponible. Réessaie dans un instant.';

const DEFAULT_FILE_MISSING_MESSAGE =
  'Aucun fichier sélectionné.';

const DEFAULT_FILE_TOO_LARGE_MESSAGE =
  'La taille du fichier dépasse la limite autorisée (1 Go).';

const DEFAULT_FILE_TYPE_REJECTED_MESSAGE =
  "Le type de fichier n'est pas autorisé.";

const DEFAULT_UNAUTHORIZED_MESSAGE =
  'Ta session a expiré. Reconnecte-toi pour continuer.';

export const fileService = {
  /**
   * Téléverse un fichier. Lève {@link UploadError} en cas d'échec.
   */
  async upload(file: File): Promise<FileSummary> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<EnvelopedResponse<FileSummary>>(
        '/api/files',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data.data;
    } catch (err) {
      throw mapUploadError(err);
    }
  },
};

function mapUploadError(err: unknown): UploadError {
  if (err instanceof AxiosError && err.response) {
    const status = err.response.status;
    const problem = err.response.data as ProblemDetail | undefined;

    if (status === 400) {
      return {
        kind: 'file-missing',
        message: problem?.detail ?? DEFAULT_FILE_MISSING_MESSAGE,
      };
    }

    if (status === 401) {
      return {
        kind: 'unauthorized',
        message: problem?.detail ?? DEFAULT_UNAUTHORIZED_MESSAGE,
      };
    }

    if (status === 413) {
      return {
        kind: 'file-too-large',
        message: problem?.detail ?? DEFAULT_FILE_TOO_LARGE_MESSAGE,
      };
    }

    if (status === 415) {
      return {
        kind: 'file-type-rejected',
        message: problem?.detail ?? DEFAULT_FILE_TYPE_REJECTED_MESSAGE,
      };
    }
  }

  return { kind: 'network', message: DEFAULT_NETWORK_MESSAGE };
}
