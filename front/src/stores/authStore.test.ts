import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/services/authService';
import { useAuthStore } from './authStore';
import type { RegisterError } from '@/types/auth';

vi.mock('@/services/authService', () => ({
  authService: { register: vi.fn() },
}));

const mockedRegister = vi.mocked(authService.register);

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    mockedRegister.mockReset();
  });

  it("démarre dans l'état idle sans erreur", () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it("passe en 'pending' puis 'success' sur succès", async () => {
    mockedRegister.mockResolvedValueOnce({
      id: 'u-1',
      email: 'foo@bar.fr',
      createdAt: '2026-05-09T10:00:00+00:00',
    });

    const promise = useAuthStore.getState().register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });
    expect(useAuthStore.getState().status).toBe('pending');

    await promise;
    expect(useAuthStore.getState().status).toBe('success');
    expect(useAuthStore.getState().error).toBeNull();
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

    expect(useAuthStore.getState().status).toBe('error');
    expect(useAuthStore.getState().error).toEqual(err);
  });

  it("normalise toute erreur non typée en 'network'", async () => {
    mockedRegister.mockRejectedValueOnce(new Error('boom'));

    await useAuthStore.getState().register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });

    expect(useAuthStore.getState().status).toBe('error');
    expect(useAuthStore.getState().error?.kind).toBe('network');
  });

  it('reset() ramène le store à idle sans erreur', async () => {
    mockedRegister.mockRejectedValueOnce({ kind: 'network', message: 'x' });
    await useAuthStore.getState().register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });

    useAuthStore.getState().reset();
    expect(useAuthStore.getState().status).toBe('idle');
    expect(useAuthStore.getState().error).toBeNull();
  });
});
