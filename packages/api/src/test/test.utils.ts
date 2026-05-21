import { lakituApi } from '@api/app';

const BASE = 'http://localhost';

export type ApiResult<T> = { data: T | null; error: unknown };

async function call<T>(
  method: string,
  path: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  const url = `${BASE}${path}`;
  const res = await lakituApi.handle(new Request(url, { ...init, method }));
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    return { data: null, error: { status: res.status, value: body } };
  }
  return { data: body as T, error: null };
}

export const testClient = {
  get<T>(path: string, headers?: Record<string, string>): Promise<ApiResult<T>> {
    return call<T>('GET', path, { headers });
  },
  post<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<ApiResult<T>> {
    return call<T>('POST', path, {
      headers: { 'content-type': 'application/json', ...(headers ?? {}) },
      body: JSON.stringify(body),
    });
  },
  patch<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<ApiResult<T>> {
    return call<T>('PATCH', path, {
      headers: { 'content-type': 'application/json', ...(headers ?? {}) },
      body: JSON.stringify(body),
    });
  },
  delete<T>(path: string, headers?: Record<string, string>): Promise<ApiResult<T>> {
    return call<T>('DELETE', path, { headers });
  },
};
