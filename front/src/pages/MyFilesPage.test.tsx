import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { MyFilesPage } from './MyFilesPage';

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedDelete = vi.mocked(apiClient.delete);

function buildAxiosError(status: number): AxiosError {
  const response = {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data: {},
  } as AxiosResponse;
  const err = new AxiosError(`Request failed with status ${status}`);
  err.response = response;
  return err;
}

const FILE_A = {
  id: '019b1b0a-0000-7000-8000-000000000001',
  name: 'rapport.pdf',
  sizeBytes: 2048,
  mimeType: 'application/pdf',
  createdAt: '2026-05-10T10:00:00+00:00',
  status: 'available' as const,
};
const FILE_B = {
  id: '019b1b0a-0000-7000-8000-000000000002',
  name: 'notes.txt',
  sizeBytes: 512,
  mimeType: 'text/plain',
  createdAt: '2026-05-09T10:00:00+00:00',
  status: 'available' as const,
};
const FILE_DELETED = {
  id: '019b1b0a-0000-7000-8000-000000000003',
  name: 'archive.zip',
  sizeBytes: 4096,
  mimeType: 'application/zip',
  createdAt: '2026-05-08T10:00:00+00:00',
  status: 'deleted' as const,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/files']}>
      <Routes>
        <Route path="/files" element={<MyFilesPage />} />
        <Route path="/upload" element={<div>Upload Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MyFilesPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedDelete.mockReset();
    useAuthStore.setState({
      token: 'jwt-token',
      user: { id: 'u-1', email: 'alice@datashare.fr', createdAt: '2026-05-01T10:00:00+00:00' },
    });
  });

  it("affiche un squelette pendant le chargement", () => {
    mockedGet.mockReturnValueOnce(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: /Chargement/ })).toBeInTheDocument();
  });

  it("affiche un message vide quand le user n'a aucun fichier", async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/n'as pas encore partagé/i)).toBeInTheDocument();
    });
  });

  it('liste les fichiers disponibles avec nom, taille, date et lien Accéder', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [FILE_A, FILE_B] },
    } as AxiosResponse);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText('notes.txt')).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: /Accéder au lien/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', `/d/${FILE_A.id}`);
    expect(links[0]).toHaveAttribute('target', '_blank');
  });

  it('affiche les fichiers expirés sans lien Accéder + message dédié', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [FILE_A, FILE_DELETED] },
    } as AxiosResponse);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('archive.zip')).toBeInTheDocument();
    });
    expect(screen.getByText(/Ce fichier a expiré/i)).toBeInTheDocument();
    // Le badge UI affiche "Expiré" (mappe sur status='deleted' côté API)
    expect(screen.getByText('Expiré')).toBeInTheDocument();

    // Un seul lien Accéder (pour FILE_A disponible).
    expect(
      screen.getAllByRole('link', { name: /Accéder au lien/ }),
    ).toHaveLength(1);
  });

  it("le bouton Supprimer appelle DELETE /api/files/{id} et flippe le statut localement", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [FILE_A] },
    } as AxiosResponse);
    mockedDelete.mockResolvedValueOnce({ status: 204 } as AxiosResponse);
    const user = userEvent.setup();

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Supprimer rapport.pdf/ }));

    expect(mockedDelete).toHaveBeenCalledWith(`/api/files/${FILE_A.id}`);
    // Optimistic update : le badge devient Expiré
    await waitFor(() => {
      expect(screen.getByText('Expiré')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Supprimer rapport.pdf/ })).not.toBeInTheDocument();
  });

  it("rollback sur l'optimistic update si DELETE échoue (5xx)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [FILE_A] },
    } as AxiosResponse);
    const err = new AxiosError('503');
    err.response = {
      status: 503,
      statusText: '',
      headers: {},
      config: {} as never,
      data: '',
    } as AxiosResponse;
    mockedDelete.mockRejectedValueOnce(err);
    const user = userEvent.setup();

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Supprimer rapport.pdf/ }));

    // Après rollback, le bouton Supprimer doit être à nouveau disponible et pas de badge Expiré.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Supprimer rapport.pdf/ })).toBeInTheDocument();
    });
    expect(screen.queryByText('Expiré')).not.toBeInTheDocument();
  });

  it("redirige vers /login si DELETE renvoie 401", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [FILE_A] },
    } as AxiosResponse);
    const err = new AxiosError('401');
    err.response = {
      status: 401,
      statusText: '',
      headers: {},
      config: {} as never,
      data: {},
    } as AxiosResponse;
    mockedDelete.mockRejectedValueOnce(err);
    const user = userEvent.setup();

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Supprimer rapport.pdf/ }));

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('le switch filtre la liste par statut', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { data: [FILE_A, FILE_DELETED] },
    } as AxiosResponse);
    const user = userEvent.setup();

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText('archive.zip')).toBeInTheDocument();

    // Filtre 'Expirés' → ne reste que archive.zip (mappe sur status=deleted)
    await user.click(screen.getByRole('radio', { name: 'Expirés' }));
    expect(screen.queryByText('rapport.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('archive.zip')).toBeInTheDocument();

    // Filtre 'Actifs' → ne reste que rapport.pdf (mappe sur status=available)
    await user.click(screen.getByRole('radio', { name: 'Actifs' }));
    expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
    expect(screen.queryByText('archive.zip')).not.toBeInTheDocument();
  });

  it("redirige vers /login sur 401", async () => {
    mockedGet.mockRejectedValueOnce(buildAxiosError(401));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('affiche un Callout error sur erreur réseau', async () => {
    mockedGet.mockRejectedValueOnce(buildAxiosError(503));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/serveur est indisponible/i)).toBeInTheDocument();
    });
  });

  it("CTA 'Ajouter des fichiers' navigue vers /upload", async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/n'as pas encore partagé/i)).toBeInTheDocument();
    });
    // Desktop ET mobile rendent un bouton 'Ajouter des fichiers' (l'un caché
    // par CSS selon viewport) ; on prend le premier matché (le bouton desktop).
    const buttons = screen.getAllByRole('button', { name: 'Ajouter des fichiers' });
    await user.click(buttons[0]);
    expect(screen.getByText('Upload Page')).toBeInTheDocument();
  });

  it('affiche le bouton Déconnexion dans la topbar (logout depuis la page)', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/n'as pas encore partagé/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Déconnexion/ })).toBeInTheDocument();
    // L'email du user n'est pas affiché (cf. NOTES.md, maquette MVP)
    expect(screen.queryByText('alice@datashare.fr')).not.toBeInTheDocument();
  });

  it('Déconnexion vide le store et redirige vers /login', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/n'as pas encore partagé/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Déconnexion/ }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
