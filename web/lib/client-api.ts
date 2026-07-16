export class ClientApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Runs in the browser: hits a relative /api/... path (same-origin, cookies
// attach automatically) which next.config.ts's rewrite proxies to Express.
// Every mutating call carries X-Requested-With — see
// middleware/requireApiClient.js on the Express side for why that's enough
// of a CSRF defense without a form-embedded token.
export async function clientFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isMutating = method !== "GET";
  const isFormData = options.body instanceof FormData;

  const res = await fetch(path, {
    method,
    headers: {
      ...(isMutating ? { "X-Requested-With": "XMLHttpRequest" } : {}),
      ...(!isFormData && options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}));
    throw new ClientApiError(res.status, parsed.error ?? `${path} failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
