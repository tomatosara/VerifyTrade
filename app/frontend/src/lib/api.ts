// src/lib/api.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/** 通用 API 工具 */
export const api = {
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const query = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : "";

    const res = await fetch(`${API_BASE_URL}${endpoint}${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async put<T>(endpoint: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
