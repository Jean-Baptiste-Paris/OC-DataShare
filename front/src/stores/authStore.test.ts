import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/services/authService';
import { useAuthStore } from './authStore';
import type { LoginError, RegisterError, User } from '@/types/auth';

vi.mock('@/services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    me: vi.fn(),
  },
}));

const mockedRegister = vi.mocked(authService.register);
const mockedLogin = vi.mocked(authService.login);
const mockedMe = vi.mocked(authService.me);

const sampleUser: User = {
  id: 'u-1',
  email: 'foo@bar.fr',
  createdAt: '2026-05-09T10:00:00+00:00',
};

function freshStore(): void {
  useAuthStore.setState({
    token: null,
    user: null,
    registerStatus: 'idle',
    registerError: null,
    loginStatus: 'idle',
    loginError: null,
  });
  localStorage.clear();
}

describe('authStore — register', () => {
  beforeEach(() => {
    freshStore();
    mockedRegister.mockReset();
  });

  it("démarre dans l'état idle sans erreur", () => {
    const state = useAuthStore.getState();
    expect(state.registerStatus).toBe('idle');
    expect(state.registerError).toBeNull();
  });

  it("passe en 'pending' puis 'success' sur succès", async () => {
    mockedRegister.mockResolvedValueOnce(sampleUser);

    const promise = useAuthStore.getState().register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });
    expect(useAuthStore.getState().registerStatus).toBe('pending');

    await promise;
    expect(useAuthStore.getState().registerStatus).toBe('success');
    expect(useAuthStore.getState().registerError).toBeNull();
  });

  it("passe en 'error' avec l'erreur typée sur échec", async () => {
    const err: RegisterError = {
      kind: 'email-already-taken',
      message: 'Un compte avec cet email existe déjà.',
    };
    mockedRegister.mockRejectedValueOnce(err);

    await useAuthStore.getState().register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });

    expect(useAuthStore.getState().registerStatus).toBe('error');
    expect(useAuthStore.getState().registerError).toEqual(err);
  });

  it("normalise toute erreur non typée en 'network'", async () => {
    mockedRegister.mockRejectedValueOnce(new Error('boom'));

    await useAuthStore.getState().register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });

    expect(useAuthStore.getState().registerStatus).toBe('error');
    expect(useAuthStore.getState().registerError?.kind).toBe('network');
  });

  it('resetRegister() ramène le store à idle sans erreur', async () => {
    mockedRegister.mockRejectedValueOnce({ kind: 'network', message: 'x' });
    await useAuthStore.getState().register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });

    useAuthStore.getState().resetRegister();
    expect(useAuthStore.getState().registerStatus).toBe('idle');
    expect(useAuthStore.getState().registerError).toBeNull();
  });
});

describe('authStore — login', () => {
  beforeEach(() => {
    freshStore();
    mockedLogin.mockReset();
    mockedMe.mockReset();
  });

  it("stocke token et user après un login réussi", async () => {
    mockedLogin.mockResolvedValueOnce('jwt-token');
    mockedMe.mockResolvedValueOnce(sampleUser);

    await useAuthStore.getState().login({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });

    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt-token');
    expect(state.user).toEqual(sampleUser);
    expect(state.loginStatus).toBe('idle');
    expect(state.loginError).toBeNull();
  });

  it("met loginStatus à 'pending' pendant l'appel", async () => {
    mockedLogin.mockResolvedValueOnce('jwt-token');
    mockedMe.mockResolvedValueOnce(sampleUser);

    const promise = useAuthStore.getState().login({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });
    expect(useAuthStore.getState().loginStatus).toBe('pending');
    await promise;
  });

  it("passe en 'error' avec invalid-credentials sur 401", async () => {
    const err: LoginError = {
      kind: 'invalid-credentials',
      message: 'Email ou mot de passe incorrect.',
    };
    mockedLogin.mockRejectedValueOnce(err);

    await useAuthStore.getState().login({
      email: 'foo@bar.fr',
      password: 'wrong',
    });

    const state = useAuthStore.getState();
    expect(state.loginStatus).toBe('error');
    expect(state.loginError).toEqual(err);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("normalise toute erreur non typée en 'network'", async () => {
    mockedLogin.mockRejectedValueOnce(new Error('boom'));

    await useAuthStore.getState().login({
      email: 'foo@bar.fr',
      password: 'whatever',
    });

    expect(useAuthStore.getState().loginStatus).toBe('error');
    expect(useAuthStore.getState().loginError?.kind).toBe('network');
  });
});

describe('authStore — bootstrap & logout', () => {
  beforeEach(() => {
    freshStore();
    mockedMe.mockReset();
  });

  it("bootstrap sans token ne fait rien", async () => {
    await useAuthStore.getState().bootstrap();
    expect(mockedMe).not.toHaveBeenCalled();
  });

  it("bootstrap avec token valide remplit user", async () => {
    useAuthStore.setState({ token: 'jwt-token' });
    mockedMe.mockResolvedValueOnce(sampleUser);

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toEqual(sampleUser);
    expect(useAuthStore.getState().token).toBe('jwt-token');
  });

  it("bootstrap avec token invalide nettoie token et user", async () => {
    useAuthStore.setState({ token: 'jwt-expired' });
    mockedMe.mockRejectedValueOnce(new Error('401'));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("logout vide token et user", () => {
    useAuthStore.setState({ token: 'jwt-token', user: sampleUser });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
