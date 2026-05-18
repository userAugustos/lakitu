import { edenTreaty } from '@elysiajs/eden';
import type { z } from 'zod';

import type { LakituApi as LakituApiType } from '@lakitu/api/client';

import { authActions } from '@/modules/auth/auth.store';
import { webEnv } from '@/modules/core/lib/env';

const API_URL = webEnv.api.baseUrl;

const fetchWithAuth = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const token = authActions.getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
};

export const lakituPublicApi = edenTreaty<LakituApiType>(API_URL);

export const lakituAuthApi = edenTreaty<LakituApiType>(API_URL, {
  fetcher: fetchWithAuth as typeof fetch,
});

export const lakituApi = lakituPublicApi;

interface ErrorPayload {
  value: {
    error: string;
    message: string;
    request_id?: string;
    details?: { summary: string; message: string; path: string }[];
  };
}

export class ApiResponseError extends Error {
  readonly requestId?: string;
  readonly status?: number;
  readonly code?: string;
  constructor(message: string, requestId?: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiResponseError';
    this.requestId = requestId;
    this.status = status;
    this.code = code;
  }
}

type EdenResponse<T> = Promise<{ data: T; error: null } | { data: null; error: unknown }>;

export async function apiCall<T>(
  request: () => EdenResponse<unknown>,
  schema?: z.ZodType
): Promise<T> {
  const result = await request();
  if (result.error) {
    const err = result.error as { status?: number; value?: ErrorPayload['value'] };
    const status = err.status;
    const payload = err.value ?? ({} as Partial<ErrorPayload['value']>);
    let message = 'Something went wrong';
    if (payload.message) message = payload.message;
    if (payload.details?.[0]?.message) message = payload.details[0].message;
    throw new ApiResponseError(message, payload.request_id, status, payload.error);
  }
  if (schema) return schema.parse(result.data) as T;
  return result.data as T;
}
