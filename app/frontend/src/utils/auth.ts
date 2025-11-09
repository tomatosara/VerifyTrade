// src/utils/auth.ts
import { api } from "@/api/client";
import type { UserProfile } from "@/types/verifier";
export async function checkLogin(): Promise<UserProfile | null> {
  try {
    const res = await api.get<UserProfile>("/auth/me");
    return res;
  } catch {
    return null;
  }
}