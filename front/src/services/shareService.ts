import { AxiosError } from 'axios';
import { apiClient } from '@/lib/apiClient';
import type { SharedFile, ShareError } from '@/types/share';

type EnvelopedResponse<T> = { data: T };

const DEFAULT_NETWORK_MESSAGE =
  'Le serveur est indisponible. Réessaie dans un instant.';

const DEFAULT_NOT_FOUND_MESSAGE =
  "Le lien est invalide ou le fichier n'est plus disponible.";

export const shareService = {
  /**
   * Récupère les métadonnées d'un fichier partagé.
   * Lève {@link ShareError} (`not-found` | `network`) en cas d'échec.
   */
  async getMetadata(token: string): Promise<SharedFile> {
    try {
      const response = await apiClient.get<EnvelopedResponse<SharedFile>>(
        `/api/share/${encodeURIComponent(token)}`,
      );
      return response.data.data;
    } catch (err) {
      throw mapShareError(err);
    }
  },

  /**
   * URL absolue de téléchargement direct — le serveur applique
   * Content-Disposition: attachment, donc une simple ancre suffit pour
   * déclencher le download (cf. ADR 0001 : streaming agnostique au stockage).
   */
  buildDownloadUrl(token: string): string {
    const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
    return `${baseUrl}/api/share/${encodeURIComponent(token)}/download`;
  },
};

function mapShareError(err: unknown): ShareError {
  if (err instanceof AxiosError && err.response) {
    if (err.response.status === 404) {
      return { kind: 'not-found', message: DEFAULT_NOT_FOUND_MESSAGE };
    }
  }
  return { kind: 'network', message: DEFAULT_NETWORK_MESSAGE };
}
