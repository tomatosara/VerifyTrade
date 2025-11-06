// src/api/client.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

// ---- Access Token 只放在記憶體（最安全，關頁即失） ----
let ACCESS_TOKEN: string | null = null;
export function setAccessToken(token: string | null) {
  ACCESS_TOKEN = token;
}
export function getAccessToken() {
  return ACCESS_TOKEN;
}

// 可選：如果你的後端把「access token 也放 HttpOnly Cookie」
// 你可以把這個旗標設為 true，就不會加 Authorization header。
const USE_COOKIE_ACCESS = false;

// ---- 共用 request（含自動 refresh & 重試一次） ----
type RequestOptions = {
  params?: Record<string, any>;
  body?: any;
  method: "GET" | "POST" | "PUT" | "DELETE";
  // 預設需要驗證；有些公開 API 可傳 false 跳過帶 token
  auth?: boolean;
};

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // 需要驗證 + 有 token + 未採用 cookie-access 時，加 Bearer
  if (auth && !USE_COOKIE_ACCESS && ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }

  // 第一次請求
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    // ✅ 讓瀏覽器自動帶上 HttpOnly refresh_token
    credentials: "include",
  });

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
      const retryHeaders = { ...headers };
      if (!USE_COOKIE_ACCESS && ACCESS_TOKEN) {
        retryHeaders.Authorization = `Bearer ${ACCESS_TOKEN}`;
      }
      const retryRes = await fetch(url, {
        method,
        headers: retryHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });
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
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 帶 refresh_token cookie
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
  async delete<T>(endpoint: string, auth = true) {
    return request<T>(endpoint, { method: "DELETE", auth });
  },
};
