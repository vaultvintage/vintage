// Thin fetch wrapper around the Vintage Bank Django REST API.
// Handles JSON, JWT bearer tokens, and transparent access-token refresh.

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

export const API_ROOT = `${RAW_BASE}/api/v1`;
export const API_ORIGIN = RAW_BASE;

/** Resolve a possibly-relative media path (e.g. /media/x.png) to an absolute URL. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

const ACCESS_KEY = "fr_access";
const REFRESH_KEY = "fr_refresh";
const USER_KEY = "fr_user";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  saveUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser<T>(): T | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export type ErrorKind =
  | "network" // couldn't reach the server at all
  | "timeout" // request took too long
  | "auth" // 401 — not signed in / token invalid
  | "permission" // 403
  | "notfound" // 404
  | "validation" // 400 / 422 — bad input
  | "ratelimit" // 429
  | "server" // 5xx
  | "unknown";

export const SESSION_EXPIRED_EVENT = "vb:session-expired";

export class ApiError extends Error {
  status: number;
  data: unknown;
  kind: ErrorKind;
  constructor(message: string, status: number, data: unknown, kind: ErrorKind) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.kind = kind;
  }
}

function kindFromStatus(status: number): ErrorKind {
  if (status === 401) return "auth";
  if (status === 403) return "permission";
  if (status === 404) return "notfound";
  if (status === 429) return "ratelimit";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

/** Short, friendly fallbacks per error kind when the API gives us nothing useful. */
const KIND_FALLBACK: Record<ErrorKind, string> = {
  network:
    "Can't reach Vintage Bank right now. Check your connection and try again.",
  timeout: "The request took too long. Please try again.",
  auth: "Your session has expired. Please sign in again.",
  permission: "You don't have permission to do that.",
  notfound: "We couldn't find what you were looking for.",
  validation: "Please check the details and try again.",
  ratelimit: "Too many attempts. Please wait a moment and try again.",
  server: "Something went wrong on our end. Please try again shortly.",
  unknown: "Something went wrong. Please try again.",
};

/** Turn any thrown value into a clear, human message for the UI. */
export function humanizeError(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as any;
    // Prefer a specific message from the API payload.
    if (typeof d === "string" && d.trim() && d.length < 300) return d;
    if (d?.detail) return String(d.detail);
    if (d?.error) return String(d.error);
    if (d?.message) return String(d.message);
    if (d && typeof d === "object") {
      const parts: string[] = [];
      for (const [k, v] of Object.entries(d)) {
        if (k === "details" && v && typeof v === "object") continue;
        const val = Array.isArray(v) ? v.join(", ") : String(v);
        parts.push(k === "non_field_errors" ? val : `${prettyField(k)}: ${val}`);
      }
      if (parts.length) return parts.join(" · ");
    }
    return KIND_FALLBACK[err.kind];
  }
  if (err instanceof Error && err.message) return err.message;
  return KIND_FALLBACK.unknown;
}

/** Structured error kind for choosing icons / retry affordances. */
export function errorKind(err: unknown): ErrorKind {
  return err instanceof ApiError ? err.kind : "unknown";
}

function prettyField(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  isForm?: boolean;
  retry?: boolean;
  timeoutMs?: number;
}

async function refreshAccess(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_ROOT}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access) {
      tokenStore.set(data.access);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Clear the session and let the app react (redirect to login with a notice). */
function expireSession() {
  tokenStore.clear();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    isForm = false,
    retry = true,
    timeoutMs = 20000,
  } = opts;

  const headers: Record<string, string> = {};
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;

  // Abort the request if the server never responds.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      signal: controller.signal,
      body:
        body === undefined
          ? undefined
          : isForm
          ? (body as FormData)
          : JSON.stringify(body),
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(KIND_FALLBACK.timeout, 0, null, "timeout");
    }
    // TypeError from fetch = network / CORS / server down.
    throw new ApiError(KIND_FALLBACK.network, 0, null, "network");
  } finally {
    clearTimeout(timer);
  }

  // Transparent refresh on expiry.
  if (res.status === 401 && auth && retry && tokenStore.refresh) {
    const ok = await refreshAccess();
    if (ok) return apiFetch<T>(path, { ...opts, retry: false });
    // Refresh failed → the session is truly gone.
    expireSession();
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const kind = kindFromStatus(res.status);
    throw new ApiError(`Request failed (${res.status})`, res.status, data, kind);
  }
  return data as T;
}

export async function apiFetchBlob(
  path: string,
  opts: Omit<RequestOptions, "body" | "isForm"> = {}
): Promise<Blob> {
  const { method = "GET", auth = true, retry = true, timeoutMs = 20000 } = opts;
  const headers: Record<string, string> = {};
  if (auth && tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, { method, headers, signal: controller.signal });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(KIND_FALLBACK.timeout, 0, null, "timeout");
    }
    throw new ApiError(KIND_FALLBACK.network, 0, null, "network");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && auth && retry && tokenStore.refresh) {
    const ok = await refreshAccess();
    if (ok) return apiFetchBlob(path, { ...opts, retry: false });
    expireSession();
  }

  if (!res.ok) {
    let data: unknown = null;
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    const kind = kindFromStatus(res.status);
    throw new ApiError(`Request failed (${res.status})`, res.status, data, kind);
  }

  return res.blob();
}

// ---------------- Endpoint helpers ----------------

export const api = {
  login: (username: string, password: string) =>
    apiFetch<{ access: string; refresh: string; user: any }>("/auth/login/", {
      method: "POST",
      auth: false,
      body: { username, password },
    }),

  register: (payload: Record<string, unknown>) =>
    apiFetch("/auth/register/", { method: "POST", auth: false, body: payload }),

  wallet: () => apiFetch("/wallet/"),
  createWallet: () => apiFetch("/wallet/", { method: "POST", body: {} }),

  credits: () => apiFetch("/credits/"),
  debits: () => apiFetch("/debits/"),

  // Deposit: creates a pending credit transaction. The backend credits the
  // wallet only after an admin approves the deposit.
  createDeposit: (payload: Record<string, unknown>) =>
    apiFetch("/credits/", { method: "POST", body: payload }),

  domesticTransfers: () => apiFetch("/my/domestic-transfers/"),
  wireTransfers: () => apiFetch("/my/wire-transfers/"),

  initiateOtp: () => apiFetch("/transfers/initiate-otp/", { method: "POST", body: {} }),

  createDomesticTransfer: (payload: Record<string, unknown>) =>
    apiFetch("/domestic-transfers/", { method: "POST", body: payload }),

  createWireTransfer: (payload: Record<string, unknown>) =>
    apiFetch("/wire/transfers/", { method: "POST", body: payload }),

  cards: () => apiFetch("/virtual-cards/"),
  createCard: (card_provider: string) =>
    apiFetch("/virtual-cards/", { method: "POST", body: { card_provider } }),
  deleteCard: (pk: number) =>
    apiFetch(`/virtual-cards/${pk}/`, { method: "DELETE" }),

  loans: () => apiFetch("/loans/"),
  createLoan: (payload: Record<string, unknown>) =>
    apiFetch("/loans/", { method: "POST", body: payload }),

  withdrawals: () => apiFetch("/withdrawals/"),
  createWithdrawal: (payload: Record<string, unknown>) =>
    apiFetch("/withdrawals/", { method: "POST", body: payload }),

  paymentMethods: () => apiFetch("/payment-methods/"),

  receiptHtml: (receiptType: string, pk: number) =>
    apiFetch<string>(`/receipts/${receiptType}/${pk}/`),
  receiptDownload: (receiptType: string, pk: number) =>
    apiFetchBlob(`/receipts/${receiptType}/${pk}/?download=1`),

  verifyPin: (pin: string) =>
    apiFetch("/verify-pin/", { method: "POST", body: { pin } }),

  updateUser: (id: string, payload: Record<string, unknown>) =>
    apiFetch(`/users/${id}/`, { method: "PUT", body: payload }),
};
