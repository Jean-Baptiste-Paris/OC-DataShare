import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { authService } from './authService';
import { isRegisterError } from '@/types/auth';

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

describe('authService.register', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('renvoie le User en cas de succès (201)', async () => {
    const user = {
      id: 'd2c1...',
      email: 'foo@bar.fr',
      createdAt: '2026-05-09T10:00:00+00:00',
    };
    mockedPost.mockResolvedValueOnce({ data: { data: user } } as AxiosResponse);

    const result = await authService.register({
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });

    expect(result).toEqual(user);
    expect(mockedPost).toHaveBeenCalledWith('/api/auth/register', {
      email: 'foo@bar.fr',
      password: 'plainPassword',
    });
  });

  it("lève une erreur 'email-already-taken' sur 409", async () => {
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(409, {
        type: 'https://datashare.fr/errors/email-already-exists',
        title: 'Email already exists',
        status: 409,
        detail: 'Un compte avec cet email existe déjà.',
      }),
    );

    await expect(
      authService.register({ email: 'foo@bar.fr', password: 'plainPassword' }),
    ).rejects.toMatchObject({
      kind: 'email-already-taken',
      message: 'Un compte avec cet email existe déjà.',
    });
  });

  it("lève une erreur 'validation' avec fieldErrors sur 422", async () => {
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(422, {
        type: 'https://symfony.com/errors/validation',
        title: 'Validation Failed',
        status: 422,
        violations: [
          { propertyPath: 'email', title: "Format d'email invalide." },
          { propertyPath: 'password', title: 'Le mot de passe doit faire au moins 8 caractères.' },
        ],
      }),
    );

    try {
      await authService.register({ email: 'oups', password: 'x' });
      throw new Error('expected register to throw');
    } catch (err) {
      expect(isRegisterError(err)).toBe(true);
      if (!isRegisterError(err)) return;
      expect(err.kind).toBe('validation');
      if (err.kind !== 'validation') return;
      expect(err.fieldErrors).toEqual({
        email: "Format d'email invalide.",
        password: 'Le mot de passe doit faire au moins 8 caractères.',
      });
    }
  });

  it("lève une erreur 'network' sur 5xx", async () => {
    mockedPost.mockRejectedValueOnce(buildAxiosError(503, '<html>...</html>'));

    await expect(
      authService.register({ email: 'foo@bar.fr', password: 'plainPassword' }),
    ).rejects.toMatchObject({ kind: 'network' });
  });

  it("lève une erreur 'network' si l'erreur n'est pas un AxiosError", async () => {
    mockedPost.mockRejectedValueOnce(new Error('boom'));

    await expect(
      authService.register({ email: 'foo@bar.fr', password: 'plainPassword' }),
    ).rejects.toMatchObject({ kind: 'network' });
  });
});
