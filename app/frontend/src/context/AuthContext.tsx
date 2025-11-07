// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { UserProfile } from "@/types/verifier";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化檢查登入狀態
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<UserProfile>("/auth/me");
        setUser(res);
      } catch (err) {
        console.error("[AuthProvider] checkLogin failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
