import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { fileService } from './fileService';
import { isUploadError } from '@/types/file';

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

function makeFile(name = 'cv.pdf', bytes = 'pdf-bytes'): File {
  return new File([bytes], name, { type: 'application/pdf' });
}

describe('fileService.upload', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('renvoie le FileSummary en cas de succès (201)', async () => {
    const summary = {
      id: '019b1b0a-0000-7000-8000-000000000001',
      name: 'cv.pdf',
      sizeBytes: 9,
      mimeType: 'application/pdf',
      createdAt: '2026-05-10T10:00:00+00:00',
    };
    mockedPost.mockResolvedValueOnce({ data: { data: summary } } as AxiosResponse);

    const result = await fileService.upload(makeFile());

    expect(result).toEqual(summary);
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/files',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    const formData = mockedPost.mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBeInstanceOf(File);
  });

  it("lève une erreur 'file-missing' sur 400", async () => {
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(400, {
        type: 'https://datashare.fr/errors/file-missing',
        title: 'File missing',
        status: 400,
        detail: 'Le champ "file" est requis dans la requête multipart.',
      }),
    );

    await expect(fileService.upload(makeFile())).rejects.toMatchObject({
      kind: 'file-missing',
    });
  });

  it("lève une erreur 'unauthorized' sur 401", async () => {
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(401, { code: 401, message: 'JWT Token not found' }),
    );

    await expect(fileService.upload(makeFile())).rejects.toMatchObject({
      kind: 'unauthorized',
    });
  });

  it("lève une erreur 'file-too-large' sur 413", async () => {
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(413, {
        type: 'https://datashare.fr/errors/file-too-large',
        title: 'File too large',
        status: 413,
        detail: 'La taille du fichier dépasse la limite autorisée (1 Go).',
      }),
    );

    try {
      await fileService.upload(makeFile());
      throw new Error('expected upload to throw');
    } catch (err) {
      expect(isUploadError(err)).toBe(true);
      if (!isUploadError(err)) return;
      expect(err.kind).toBe('file-too-large');
      if (err.kind !== 'file-too-large') return;
      expect(err.message).toContain('1 Go');
    }
  });

  it("lève une erreur 'file-type-rejected' sur 415", async () => {
    mockedPost.mockRejectedValueOnce(
      buildAxiosError(415, {
        type: 'https://datashare.fr/errors/file-type-rejected',
        title: 'File type rejected',
        status: 415,
        detail: 'Extension ".exe" is blacklisted.',
      }),
    );

    await expect(fileService.upload(makeFile('cv.exe'))).rejects.toMatchObject({
      kind: 'file-type-rejected',
    });
  });

  it("lève une erreur 'network' sur 5xx", async () => {
    mockedPost.mockRejectedValueOnce(buildAxiosError(503, '<html>...</html>'));

    await expect(fileService.upload(makeFile())).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it("lève une erreur 'network' si l'erreur n'est pas un AxiosError", async () => {
    mockedPost.mockRejectedValueOnce(new Error('boom'));

    await expect(fileService.upload(makeFile())).rejects.toMatchObject({
      kind: 'network',
    });
  });
});
