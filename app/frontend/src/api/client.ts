// src/api/client.ts
import { API_BASE_URL } from '@/config/api';

// ---- Access Token 只放在記憶體（最安全，關頁即失） ----
let ACCESS_TOKEN: string | null = null;
export function setAccessToken(token: string | null) {
  ACCESS_TOKEN = token;
  if (!token) {
    CSRF_TOKEN = null;
  }
}
export function getAccessToken() {
  return ACCESS_TOKEN;
}

const USE_COOKIE_ACCESS = false;

let CSRF_TOKEN: string | null = null;
const CSRF_COOKIE_NAME = "csrf_token";

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [k, ...rest] = cookie.split("=");
    if (k === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
};

// CSRF fix: added per-request nonce. We pair the anti-forgery cookie with an explicit header on every
// state-changing request so the backend middleware can validate both pieces.
async function ensureCsrfToken(): Promise<string | null> {
  if (CSRF_TOKEN) return CSRF_TOKEN;
  const fromCookie = readCookie(CSRF_COOKIE_NAME);
  if (fromCookie) {
    CSRF_TOKEN = fromCookie;
    return CSRF_TOKEN;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    CSRF_TOKEN = data?.csrfToken ?? null;
    return CSRF_TOKEN;
  } catch {
    return null;
  }
}

function generateRequestId(): string {
  // CSRF fix: added per-request nonce using a CSPRNG for every attempt.
  const cryptoObj = typeof globalThis !== "undefined"
    ? ((globalThis as typeof globalThis & { crypto?: Crypto }).crypto ?? undefined)
    : undefined;

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `req-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  throw new Error("Secure random generator (crypto) is not available; cannot generate request id.");
}
function applyCsrf(
  headers: Record<string, string>,
  token: string | null,
  requestId?: string
) {
  if (token) {
    headers["X-CSRF-Token"] = token;
  }
  if (requestId) {
    headers["X-CSRF-Request-Id"] = requestId;
  }
}

function attachCsrfToBody(body?: any, requestId?: string) {
  if (!CSRF_TOKEN) return body;

  const csrfFields: Record<string, any> = { csrfToken: CSRF_TOKEN };
  if (requestId) {
    csrfFields.requestId = requestId;
  }

  const isPlainObject =
    typeof body === "object" && body !== null && !Array.isArray(body);

  // No body: only send csrfToken + requestId
  if (body === undefined || body === null) {
    return csrfFields;
  }

  // Merge into plain objects without clobbering other fields
  if (isPlainObject) {
    return {
      ...csrfFields,
      ...body,
    };
  }

  // For non-object bodies, keep the original as-is
  return body;
}

// ---- 共用 request（含自動 refresh & 重試一次） ----
type RequestOptions = {
  params?: Record<string, any>;
  body?: any;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  // 預設需要驗證；有些公開 API 可傳 false 跳過帶 token
  auth?: boolean;
};

const isStateChangingMethod = (method: RequestOptions["method"]) =>
  !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);

async function request<T>(
  endpoint: string,
  { params, body, method, auth = true }: RequestOptions
): Promise<T> {
  // 組 querystring
  const query = params
    ? "?" +
    new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString()
    : "";

  const url = `${API_BASE_URL}${endpoint}${query}`;

  // 基本 headers
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // CSRF fix: added per-request nonce to every state-changing attempt with CSRF headers.
  // 對應後端 csrfProtectionMiddleware：所有改變狀態的請求都帶上 CSRF header（double-submit cookie + Origin/Referer 檢查）。
  const needsCsrf = isStateChangingMethod(method);
  // 需要驗證 + 有 token + 未採用 cookie-access 時，加 Bearer
  const withAuthHeader = (headers: Record<string, string>) => {
    if (auth && !USE_COOKIE_ACCESS && ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
    }
  };
  withAuthHeader(baseHeaders);

  let csrfToken: string | null = null;
  if (needsCsrf) {
    csrfToken = await ensureCsrfToken();
    if (!csrfToken) {
      throw new Error("Missing CSRF token; please refresh and try again.");
    }
  }

  const sendWithFreshNonce = async (): Promise<Response> => {
    // CSRF fix: added per-request nonce to each fetch attempt (including retries).
    const headers: Record<string, string> = { ...baseHeaders };
    withAuthHeader(headers);

    let finalBody = body;
    if (needsCsrf) {
      const requestId = generateRequestId();
      applyCsrf(headers, csrfToken, requestId);
      finalBody = attachCsrfToBody(body, requestId);
    }

    return fetch(url, {
      method,
      headers,
      body: finalBody ? JSON.stringify(finalBody) : undefined,
      // ✅ 讓瀏覽器自動帶上 HttpOnly refresh_token
      credentials: auth ? "include" : "same-origin",
    });
  };

  // 第一次請求
  const res = await sendWithFreshNonce();

  // 如果 OK 直接回
  if (res.ok) {
    // 有些後端 204 無內容
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
  }

  // 若 401：嘗試 refresh 後重試一次（只做一次）
  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // 更新 header 的 Authorization
      const retryRes = await sendWithFreshNonce();
      if (retryRes.ok) {
        if (retryRes.status === 204) return undefined as unknown as T;
        return retryRes.json();
      }
      // 重試仍失敗 → 丟錯
      throw new Error(await safeReadText(retryRes));
    }
  }

  // 其他錯誤
  throw new Error(await safeReadText(res));
}

// 幫手：安全讀取錯誤訊息
async function safeReadText(res: Response) {
  try {
    const t = await res.text();
    return t || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

// 呼叫 /auth/refresh 換新 access token（用 HttpOnly cookie）
async function tryRefresh(): Promise<boolean> {
  try {
    const csrfToken = await ensureCsrfToken();
    if (!csrfToken) return false;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // CSRF fix: added per-request nonce for refresh token path.
    const requestId = generateRequestId();
    applyCsrf(headers, csrfToken, requestId);
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers,
      credentials: "include", // 帶 refresh_token cookie
      body: JSON.stringify({ csrfToken, requestId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    // 後端應回 { accessToken: '...' }
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** 對外暴露的簡單 API 介面（維持你原本的呼叫法） */
export const api = {
  async get<T>(endpoint: string, params?: Record<string, any>, auth = true) {
    return request<T>(endpoint, { method: "GET", params, auth });
  },
  async post<T>(endpoint: string, body?: any, auth = true) {
    return request<T>(endpoint, { method: "POST", body, auth });
  },
  async put<T>(endpoint: string, body?: any, auth = true) {
    return request<T>(endpoint, { method: "PUT", body, auth });
  },
  async patch<T>(endpoint: string, body?: any, auth = true) {
    return request<T>(endpoint, { method: "PATCH", body, auth });
  },
  async delete<T>(endpoint: string, auth = true) {
    return request<T>(endpoint, { method: "DELETE", body: undefined, auth });
  },
};
