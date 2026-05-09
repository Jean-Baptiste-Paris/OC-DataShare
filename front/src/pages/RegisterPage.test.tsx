import { useEffect } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { RegisterPage } from './RegisterPage';

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: vi.fn() },
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

let lastFlashSuccess: string | undefined;

function LoginCapture() {
  const location = useLocation();
  useEffect(() => {
    lastFlashSuccess = (location.state as { flashSuccess?: string } | null)?.flashSuccess;
  }, [location.state]);
  return <div>Login Page</div>;
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginCapture />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    mockedPost.mockReset();
    lastFlashSuccess = undefined;
  });

  it('rend les 3 champs, le bouton submit et le lien vers /login', () => {
    renderRegister();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Vérification du mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer un compte' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "J'ai déjà un compte" })).toBeInTheDocument();
  });

  it("affiche les erreurs de validation client et n'appelle pas l'API", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.click(screen.getByRole('button', { name: 'Créer un compte' }));

    expect(screen.getByText("L'email est obligatoire.")).toBeInTheDocument();
    expect(screen.getByText('Le mot de passe est obligatoire.')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("affiche une erreur quand les deux mots de passe ne correspondent pas", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Email'), 'foo@bar.fr');
    await user.type(screen.getByLabelText('Mot de passe'), 'longenough');
    await user.type(screen.getByLabelText('Vérification du mot de passe'), 'different1');
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }));

    expect(
      screen.getByText('Les deux mots de passe ne correspondent pas.'),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('redirige vers /login avec un flash success en cas de 201', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          id: 'u-1',
          email: 'foo@bar.fr',
          createdAt: '2026-05-09T10:00:00+00:00',
        },
      },
    } as AxiosResponse);

    renderRegister();

    await user.type(screen.getByLabelText('Email'), 'foo@bar.fr');
    await user.type(screen.getByLabelText('Mot de passe'), 'longenough');
    await user.type(screen.getByLabelText('Vérification du mot de passe'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }));

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(lastFlashSuccess).toBe('Compte créé. Connecte-toi pour continuer.');
  });

  it("affiche le Callout d'erreur global et marque le champ email en cas de 409", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(409, {
        type: 'https://datashare.fr/errors/email-already-exists',
        title: 'Email already exists',
        status: 409,
        detail: 'Un compte avec cet email existe déjà.',
      }),
    );

    renderRegister();

    await user.type(screen.getByLabelText('Email'), 'foo@bar.fr');
    await user.type(screen.getByLabelText('Mot de passe'), 'longenough');
    await user.type(screen.getByLabelText('Vérification du mot de passe'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/Un compte avec cet email existe déjà\./).length,
      ).toBeGreaterThan(0);
    });
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('affiche les erreurs serveur 422 sur les champs concernés', async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(422, {
        type: 'https://symfony.com/errors/validation',
        title: 'Validation Failed',
        status: 422,
        violations: [
          { propertyPath: 'email', title: 'Format rejeté par le serveur.' },
        ],
      }),
    );

    renderRegister();

    await user.type(screen.getByLabelText('Email'), 'foo@bar.fr');
    await user.type(screen.getByLabelText('Mot de passe'), 'longenough');
    await user.type(screen.getByLabelText('Vérification du mot de passe'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }));

    await waitFor(() => {
      expect(screen.getByText('Format rejeté par le serveur.')).toBeInTheDocument();
    });
  });
});
