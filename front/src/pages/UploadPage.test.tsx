import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { UploadPage } from './UploadPage';

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
}));

const mockedPost = vi.mocked(apiClient.post);

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

function renderUpload() {
  const result = render(
    <MemoryRouter initialEntries={['/upload']}>
      <Routes>
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/files" element={<div>Mes fichiers Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
  return result;
}

async function openComposingMode(user: UserEvent): Promise<HTMLInputElement> {
  await user.click(
    screen.getByRole('button', { name: 'Ouvrir le formulaire de téléversement' }),
  );
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Choisir un fichier' })).toBeInTheDocument();
  });
  const fileInput = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  return fileInput;
}

const successPayload = {
  id: '019b1b0a-0000-7000-8000-000000000001',
  name: 'cv.pdf',
  sizeBytes: 9,
  mimeType: 'application/pdf',
  createdAt: '2026-05-10T10:00:00+00:00',
  status: 'available' as const,
};

describe('UploadPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'jwt-token',
      user: {
        id: 'u-1',
        email: 'foo@bar.fr',
        createdAt: '2026-05-09T10:00:00+00:00',
      },
    });
    mockedPost.mockReset();
  });

  it('affiche le CTA initial (texte + bouton cloud-upload) et pas la card', () => {
    renderUpload();
    expect(screen.getByText('Tu veux partager un fichier ?')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ouvrir le formulaire de téléversement' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Ajouter un fichier')).not.toBeInTheDocument();
  });

  it("ouvre la card 'Ajouter un fichier' au clic sur l'icône", async () => {
    const user = userEvent.setup();
    renderUpload();

    await user.click(
      screen.getByRole('button', { name: 'Ouvrir le formulaire de téléversement' }),
    );

    expect(screen.getByText('Ajouter un fichier')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choisir un fichier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Téléverser' })).toBeDisabled();
  });

  it('affiche le fichier sélectionné après sélection valide', async () => {
    const user = userEvent.setup();
    renderUpload();
    const fileInput = await openComposingMode(user);
    const file = new File(['hello world'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('cv.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Téléverser' })).not.toBeDisabled();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("rejette une extension blacklistée sans appeler l'API", async () => {
    const user = userEvent.setup();
    renderUpload();
    const fileInput = await openComposingMode(user);
    const file = new File(['data'], 'malware.exe', { type: 'application/octet-stream' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/\.exe.*pas autorisé/i)).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("rejette un fichier > 1 Go sans appeler l'API", async () => {
    const user = userEvent.setup();
    renderUpload();
    const fileInput = await openComposingMode(user);
    const file = new File(['x'], 'big.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/dépasse la limite/i)).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('téléverse et affiche le lien de partage en cas de succès', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: successPayload },
    } as AxiosResponse);

    const user = userEvent.setup();
    renderUpload();
    const fileInput = await openComposingMode(user);
    const file = new File(['hello pdf'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await user.click(screen.getByRole('button', { name: 'Téléverser' }));

    await waitFor(() => {
      expect(screen.getByText(/Félicitations/)).toBeInTheDocument();
    });
    const expectedLink = `${window.location.origin}/d/${successPayload.id}`;
    expect(screen.getByRole('link', { name: expectedLink })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier le lien' })).toBeInTheDocument();
  });

  it('affiche un Callout error sur échec de téléversement (415)', async () => {
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(415, {
        type: 'https://datashare.fr/errors/file-type-rejected',
        title: 'File type rejected',
        status: 415,
        detail: 'Extension ".exe" is blacklisted.',
      }),
    );

    const user = userEvent.setup();
    renderUpload();
    const fileInput = await openComposingMode(user);
    const file = new File(['data'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await user.click(screen.getByRole('button', { name: 'Téléverser' }));

    await waitFor(() => {
      expect(screen.getByText(/blacklisted/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Copier le lien' })).not.toBeInTheDocument();
  });

  it('copie le lien de partage dans le presse-papiers', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: successPayload },
    } as AxiosResponse);

    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    renderUpload();
    const fileInput = await openComposingMode(user);
    const file = new File(['hello pdf'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'Téléverser' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copier le lien' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Copier le lien' }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/d/${successPayload.id}`,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lien copié ✓' })).toBeInTheDocument();
    });
  });
});
