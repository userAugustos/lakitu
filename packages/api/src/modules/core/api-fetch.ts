type FetchInit = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
};

type FetchResult<TData, TError = unknown> =
  | { ok: true; status: number; data: TData }
  | { ok: false; status: number | null; error: TError };

export async function apiFetch<TData = unknown, TError = unknown>(
  url: string | URL,
  init?: FetchInit
): Promise<FetchResult<TData, TError>> {
  const rawBody = init?.body;
  const isString = typeof rawBody === 'string';
  const body = rawBody == null ? undefined : isString ? rawBody : JSON.stringify(rawBody);

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      body,
      headers: {
        ...(body && !isString ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    return {
      ok: false,
      status: null,
      error: { code: 'network_error', message: 'Could not reach API' } as TError,
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      status: response.status,
      error: { code: 'parse_error', message: 'Invalid JSON response' } as TError,
    };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, error: data as TError };
  }

  return { ok: true, status: response.status, data: data as TData };
}
