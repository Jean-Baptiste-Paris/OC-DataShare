import { useEffect } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { LoginPage } from './LoginPage';

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
}));

const mockedPost = vi.mocked(apiClient.post);
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

let lastUploadVisit = false;

function UploadCapture() {
  useEffect(() => {
    lastUploadVisit = true;
  }, []);
  return <div>Upload Page</div>;
}

function renderLogin(initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/upload" element={<UploadCapture />} />
        <Route path="/register" element={<div>Register Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      registerStatus: 'idle',
      registerError: null,
      loginStatus: 'idle',
      loginError: null,
    });
    localStorage.clear();
    mockedPost.mockReset();
    mockedGet.mockReset();
    lastUploadVisit = false;
  });

  it('rend les 2 champs, le bouton submit et les CTA "Créer un compte" (header + form)', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    // Doublon volontaire : Header CTA + lien borderless du form, même action.
    expect(screen.getAllByRole('button', { name: 'Créer un compte' })).toHaveLength(2);
  });

  it("affiche les erreurs de validation client et n'appelle pas l'API", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(screen.getByText("L'email est obligatoire.")).toBeInTheDocument();
    expect(screen.getByText('Le mot de passe est obligatoire.')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('redirige vers /upload après login réussi', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce({
      data: { data: { token: 'jwt-token' } },
    } as AxiosResponse);
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 'u-1',
          email: 'foo@bar.fr',
          createdAt: '2026-05-09T10:00:00+00:00',
        },
      },
    } as AxiosResponse);

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'foo@bar.fr');
    await user.type(screen.getByLabelText('Mot de passe'), 'plainPassword');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByText('Upload Page')).toBeInTheDocument();
    });
    expect(lastUploadVisit).toBe(true);
    expect(useAuthStore.getState().token).toBe('jwt-token');
  });

  it("affiche un Callout error sur 401 invalid-credentials", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(401, { code: 401, message: 'Invalid credentials.' }),
    );

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'foo@bar.fr');
    await user.type(screen.getByLabelText('Mot de passe'), 'wrongPassword');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByText('Email ou mot de passe incorrect.')).toBeInTheDocument();
    });
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("affiche le flash success quand on arrive depuis /register", () => {
    function Wrapper() {
      const location = useLocation();
      // sanity check du hook
      void location;
      return <LoginPage />;
    }
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { flashSuccess: 'Compte créé. Connecte-toi pour continuer.' },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<Wrapper />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Compte créé. Connecte-toi pour continuer.'),
    ).toBeInTheDocument();
  });
});
