"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type UserRole = "superadmin" | "admin" | "buyer";

type AuthUser = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: UserRole;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  openLogin: () => void;
  closeLogin: () => void;
  loginOpen: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  // Restaura sessão do localStorage ao carregar
  useEffect(() => {
    const saved = localStorage.getItem("bb_token");
    if (saved) {
      fetchMe(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t: string) {
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("Token inválido");
      const data = await res.json();
      setUser(data);
      setToken(t);
      // Cookie para o middleware ler (sem httpOnly — edge runtime)
      document.cookie = `bb_token=${t}; path=/; max-age=86400; SameSite=Lax`;
    } catch {
      localStorage.removeItem("bb_token");
      document.cookie = "bb_token=; path=/; max-age=0";
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (identifier: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", identifier);
    form.append("password", password);

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail ?? "Erro ao fazer login");
    }

    const { access_token } = await res.json();
    localStorage.setItem("bb_token", access_token);
    await fetchMe(access_token);
    setLoginOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bb_token");
    document.cookie = "bb_token=; path=/; max-age=0";
    setUser(null);
    setToken(null);
  }, []);

  const isAdmin = user?.role === "superadmin" || user?.role === "admin";

  return (
    <AuthContext.Provider value={{
      user, token, isAdmin, loading,
      login, logout,
      openLogin: () => setLoginOpen(true),
      closeLogin: () => setLoginOpen(false),
      loginOpen,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
