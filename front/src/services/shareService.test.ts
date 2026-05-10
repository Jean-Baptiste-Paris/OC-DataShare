import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { shareService } from './shareService';
import { isShareError } from '@/types/share';

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

describe('shareService.getMetadata', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('renvoie le SharedFile en cas de succès (200)', async () => {
    const sharedFile = {
      name: 'rapport.pdf',
      sizeBytes: 1024,
      mimeType: 'application/pdf',
      createdAt: '2026-05-10T10:00:00+00:00',
    };
    mockedGet.mockResolvedValueOnce({
      data: { data: sharedFile },
    } as AxiosResponse);

    const result = await shareService.getMetadata(TOKEN);

    expect(result).toEqual(sharedFile);
    expect(mockedGet).toHaveBeenCalledWith(`/api/share/${TOKEN}`);
  });

  it("lève une erreur 'not-found' sur 404", async () => {
    mockedGet.mockRejectedValueOnce(
      buildAxiosError(404, {
        type: 'https://datashare.fr/errors/share-not-found',
        title: 'Share not found',
        status: 404,
      }),
    );

    try {
      await shareService.getMetadata(TOKEN);
      throw new Error('expected getMetadata to throw');
    } catch (err) {
      expect(isShareError(err)).toBe(true);
      if (!isShareError(err)) return;
      expect(err.kind).toBe('not-found');
    }
  });

  it("lève une erreur 'network' sur 5xx", async () => {
    mockedGet.mockRejectedValueOnce(buildAxiosError(503, '<html>...</html>'));

    await expect(shareService.getMetadata(TOKEN)).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it("lève une erreur 'network' si l'erreur n'est pas un AxiosError", async () => {
    mockedGet.mockRejectedValueOnce(new Error('boom'));

    await expect(shareService.getMetadata(TOKEN)).rejects.toMatchObject({
      kind: 'network',
    });
  });
});

describe('shareService.buildDownloadUrl', () => {
  it("construit l'URL absolue de téléchargement à partir de VITE_API_URL", () => {
    const url = shareService.buildDownloadUrl(TOKEN);
    expect(url).toMatch(new RegExp(`/api/share/${TOKEN}/download$`));
  });
});
