// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { UserProfile } from "@/types/verifier";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  setUser: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 提取成可重用的函數
  const refreshUser = async () => {
    try {
      const me = await api.get<UserProfile>("/auth/me");
      setUser(me);
      console.log("[AuthProvider] 已登入使用者:", me);
    } catch (err) {
      setUser(null);
      console.log("[AuthProvider] 尚未登入");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 啟動時自動檢查登入狀態
  useEffect(() => {
    refreshUser();

    // ✅ 監聽全域登入事件（例如登入成功後 dispatch）
    const handleAuthUpdated = () => {
      console.log("[AuthProvider] 收到 auth-updated 事件，重新載入使用者");
      refreshUser();
    };

    window.addEventListener("auth-updated", handleAuthUpdated);
    return () => window.removeEventListener("auth-updated", handleAuthUpdated);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
