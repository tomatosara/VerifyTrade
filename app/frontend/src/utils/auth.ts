// src/utils/auth.ts
import { api } from "@/api/client";
export async function checkLogin(): Promise<any | null> {
  try {
    const me = await api.get("/auth/me");
    console.log("[checkLogin] user data:", me);
    return me; // 回傳完整使用者資料
  } catch (err) {
    console.warn("未登入或 token 過期:", err);
    return null;
  }
}