// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { isLoggedIn, getAccessToken, setAccessToken, clearAccessToken } from "@/utils/auth";

export function useAuth() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [token, setToken] = useState<string | null>(getAccessToken());

  const login = (token: string) => {
    setAccessToken(token);
    setToken(token);
    setLoggedIn(true);
  };

  const logout = () => {
    clearAccessToken();
    setToken(null);
    setLoggedIn(false);
  };

  useEffect(() => {
    // 每次載入頁面時確認 token 狀態
    setLoggedIn(isLoggedIn());
  }, []);

  return { loggedIn, token, login, logout };
}
