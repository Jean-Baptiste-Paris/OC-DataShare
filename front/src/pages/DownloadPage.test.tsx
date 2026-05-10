import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { DownloadPage } from './DownloadPage';

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

function buildAxiosError(status: number, data: unknown): AxiosError {
  const response = {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data,
  } as AxiosResponse;
  const err = new AxiosError(`Request failed with status ${status}`);
  err.response = response;
  return err;
}

const TOKEN = '019b1b0a-0000-7000-8000-000000000001';

function renderDownload(token: string = TOKEN) {
  return render(
    <MemoryRouter initialEntries={[`/d/${token}`]}>
      <Routes>
        <Route path="/d/:token" element={<DownloadPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/upload" element={<div>Upload Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DownloadPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    useAuthStore.setState({ token: null, user: null });
  });

  it("affiche le squelette de chargement avant la résolution de l'API", () => {
    mockedGet.mockReturnValueOnce(new Promise(() => {}));
    renderDownload();
    expect(screen.getByRole('status', { name: /Chargement/ })).toBeInTheDocument();
  });

  it('affiche le nom, la taille et un lien Télécharger en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          name: 'rapport.pdf',
          sizeBytes: 2048,
          mimeType: 'application/pdf',
          createdAt: '2026-05-10T10:00:00+00:00',
        },
      },
    } as AxiosResponse);

    renderDownload();

    await waitFor(() => {
      expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText(/2(\.|\,)0\s?Ko|2\s?ko|2\.0 Ko/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Télécharger/ });
    expect(link).toHaveAttribute('href', expect.stringContaining(`/api/share/${TOKEN}/download`));
    expect(link).toHaveAttribute('download', 'rapport.pdf');
  });

  it("affiche un message 'lien invalide' sur 404", async () => {
    mockedGet.mockRejectedValueOnce(
      buildAxiosError(404, {
        type: 'https://datashare.fr/errors/share-not-found',
        title: 'Share not found',
        status: 404,
      }),
    );

    renderDownload();

    await waitFor(() => {
      expect(
        screen.getByText(/lien est invalide ou le fichier n'est plus disponible/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: /Télécharger/ })).not.toBeInTheDocument();
  });

  it("affiche un Callout d'erreur réseau sur 5xx", async () => {
    mockedGet.mockRejectedValueOnce(buildAxiosError(503, ''));

    renderDownload();

    await waitFor(() => {
      expect(screen.getByText(/serveur est indisponible/i)).toBeInTheDocument();
    });
  });

  it("affiche le CTA 'Se connecter' quand l'utilisateur n'est pas authentifié", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          name: 'rapport.pdf',
          sizeBytes: 1024,
          mimeType: 'application/pdf',
          createdAt: '2026-05-10T10:00:00+00:00',
        },
      },
    } as AxiosResponse);

    renderDownload();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Mon espace' })).not.toBeInTheDocument();
  });

  it("affiche le CTA 'Mon espace' quand l'utilisateur est authentifié", async () => {
    useAuthStore.setState({
      token: 'jwt-token',
      user: { id: 'u-1', email: 'foo@bar.fr', createdAt: '2026-05-09T10:00:00+00:00' },
    });
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          name: 'rapport.pdf',
          sizeBytes: 1024,
          mimeType: 'application/pdf',
          createdAt: '2026-05-10T10:00:00+00:00',
        },
      },
    } as AxiosResponse);

    renderDownload();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mon espace' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Se connecter' })).not.toBeInTheDocument();
  });
});
