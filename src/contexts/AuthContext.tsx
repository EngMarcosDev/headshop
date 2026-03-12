import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE, joinUrl } from "@/api/client";

interface AuthUser {
  email: string;
  name?: string;
  isAdmin: boolean;
  token?: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<{ ok: boolean; verificationCode?: string; error?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ ok: boolean; verificationCode?: string; error?: string }>;
  googleLogin: (payload: { idToken?: string; accessToken?: string }) => Promise<{ ok: boolean; needsRegistration?: boolean; email?: string; name?: string; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem("bacaxita_user");
      const parsed = saved ? (JSON.parse(saved) as AuthUser) : null;
      if (!parsed?.email || !parsed?.token) return null;
      return parsed;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, password }),
      });

      if (!response.ok) {
        setUser(null);
        return false;
      }

      const data = await response.json().catch(() => null);
      if (!data?.user?.email || !data?.token) {
        setUser(null);
        return false;
      }

      setUser({
        email: data.user.email,
        name: data.user.name,
        isAdmin: data.user.role?.toLowerCase() === "admin",
        token: data.token,
      });
      return true;
    } catch {
      setUser(null);
      return false;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const raw = data?.error || data?.message || "Nao foi possivel criar a conta.";
        const sanitized = /535|smtp|g?smtp|BadCredentials/i.test(String(raw))
          ? "Conta criada, mas não foi possível enviar o e-mail de confirmação. Tente reenviar mais tarde."
          : raw;
        return {
          ok: false,
          error: sanitized,
        };
      }

      return {
        ok: true,
        verificationCode: data?.verificationCode,
      };
    } catch {
      return { ok: false, error: "Erro de conexao." };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        return {
          ok: false,
          error: data?.error || data?.message || "Codigo invalido ou expirado.",
        };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: "Erro de conexao." };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/verification/resend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const raw = data?.error || data?.message || "Nao foi possivel reenviar o codigo.";
        const sanitized = /535|smtp|g?smtp|BadCredentials/i.test(String(raw))
          ? "Não foi possível enviar o e-mail de verificação. Tente novamente mais tarde."
          : raw;
        return { ok: false, error: sanitized };
      }

      return { ok: true, verificationCode: data?.verificationCode };
    } catch {
      return { ok: false, error: "Erro de conexao." };
    }
  };

  const googleLogin = async (payload: { idToken?: string; accessToken?: string }) => {
    try {
      const response = await fetch(joinUrl(API_BASE, "/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 404 && data?.needsRegistration) {
          return {
            ok: false,
            needsRegistration: true,
            email: data?.email,
            name: data?.name,
            error: data?.message || "Email Google nao cadastrado.",
          };
        }

        return {
          ok: false,
          error: data?.error || data?.message || "Nao foi possivel entrar com Google.",
        };
      }

      if (!data?.user?.email || !data?.token) {
        return { ok: false, error: "Resposta invalida do servidor." };
      }

      setUser({
        email: data.user.email,
        name: data.user.name,
        isAdmin: data.user.role?.toLowerCase() === "admin",
        token: data.token,
      });

      return { ok: true };
    } catch {
      return { ok: false, error: "Erro de conexao." };
    }
  };

  const logout = () => {
    setUser(null);
  };

  useEffect(() => {
    try {
      if (user) {
        window.localStorage.setItem("bacaxita_user", JSON.stringify(user));
      } else {
        window.localStorage.removeItem("bacaxita_user");
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, verifyEmail, resendVerification, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
