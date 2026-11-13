/**
 * Browser API client. All requests go through the same-origin `/backend` proxy
 * (see next.config.ts) so Sanctum's SPA cookie session + CSRF work seamlessly.
 * The frontend never computes prices, discounts or permissions — it only renders
 * what the Laravel API returns.
 */

export const API_PREFIX = "/backend/api/v1";

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

let csrfReady: Promise<void> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : null;
}

async function ensureCsrf(force = false) {
  if (force) csrfReady = null;
  if (!csrfReady || !readCookie("XSRF-TOKEN")) {
    csrfReady = fetch("/backend/sanctum/csrf-cookie", { credentials: "include" }).then(() => undefined);
  }
  return csrfReady;
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Options["query"]) {
  const url = path.startsWith("http") ? path : `${API_PREFIX}${path}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

export async function api<T = unknown>(path: string, opts: Options = {}, retried = false): Promise<T> {
  const method = opts.method ?? "GET";
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  if (method !== "GET") await ensureCsrf();

  const headers: Record<string, string> = { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" };
  if (!isForm && opts.body !== undefined) headers["Content-Type"] = "application/json";
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers,
    credentials: "include",
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  // CSRF token expired → refresh once
  if (res.status === 419 && !retried) {
    await ensureCsrf(true);
    return api<T>(path, opts, true);
  }

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data.message as string) || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
      data.code as string | undefined,
      data.errors as Record<string, string[]> | undefined,
    );
  }
  return data as T;
}

export const get = <T,>(path: string, query?: Options["query"]) => api<T>(path, { query });
export const post = <T,>(path: string, body?: unknown) => api<T>(path, { method: "POST", body });
export const put = <T,>(path: string, body?: unknown) => api<T>(path, { method: "PUT", body });
export const patch = <T,>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body });
export const del = <T,>(path: string, query?: Options["query"]) => api<T>(path, { method: "DELETE", query });

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "حدث خطأ غير متوقع.";
}
