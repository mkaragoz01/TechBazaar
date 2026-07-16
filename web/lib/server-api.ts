import { headers } from "next/headers";
import { EXPRESS_ORIGIN } from "./config";
import type { CurrentUser } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Server Components run on the Next.js server, so a fetch to Express is a
// separate server-to-server request — the browser's session cookie has to be
// forwarded by hand. (Client Components don't need this: their fetch calls
// go from the browser to a relative /api/... path, which carries cookies
// automatically and is proxied to Express by next.config.ts.)
export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const incoming = await headers();
  const cookie = incoming.get("cookie") ?? "";

  const res = await fetch(new URL(path, EXPRESS_ORIGIN), {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers ?? {}),
      cookie,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `${path} failed: ${res.status}`);
  }

  return res.json();
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const { user } = await serverFetch<{ user: CurrentUser }>("/api/auth/me");
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function productImageUrl(imgUrl: string | undefined): string {
  return `${EXPRESS_ORIGIN}/img/${imgUrl ?? ""}`;
}
