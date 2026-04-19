import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

declare global {
  interface Window {
    google?: any;
  }
}

let googleScriptPromise: Promise<void> | null = null;

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.23 1.25-.95 2.31-2.02 3.02l3.27 2.53c1.9-1.75 2.99-4.32 2.99-7.36 0-.7-.06-1.38-.18-2.04H12z"
    />
    <path
      fill="#4285F4"
      d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.27-2.53c-.9.6-2.06.96-3.36.96-2.58 0-4.76-1.74-5.54-4.08H3.1v2.6A9.99 9.99 0 0 0 12 22z"
    />
    <path
      fill="#FBBC05"
      d="M6.46 13.91A5.95 5.95 0 0 1 6.15 12c0-.66.11-1.29.31-1.91V7.49H3.1A9.96 9.96 0 0 0 2 12c0 1.61.38 3.13 1.1 4.51l3.36-2.6z"
    />
    <path
      fill="#34A853"
      d="M12 6.01c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.96 3.04 14.7 2 12 2A9.99 9.99 0 0 0 3.1 7.49l3.36 2.6C7.24 7.75 9.42 6.01 12 6.01z"
    />
  </svg>
);

const GoogleWordmark = () => (
  <span className="inline-flex items-center gap-[1px] font-semibold">
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

const loadGoogleIdentityScript = () => {
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google carregamento falhou"));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
};

interface FormError {
  field?: string;
  message: string;
  type?: "success" | "error";
}

type PopupMode = "login" | "register" | "verify";

type PopupTriggerDetail = {
  force?: boolean;
  mode?: PopupMode;
};

const SignupPopup = () => {
  const { totalItems } = useCart();
  const { user, login, register, verifyEmail, resendVerification, googleLogin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PopupMode>("login");
  const [error, setError] = useState<FormError | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Verify form
  const [verifyEmailAddr, setVerifyEmailAddr] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const timerRef = useRef<number | null>(null);
  const prevTotalItemsRef = useRef<number>(totalItems);
  const isLogged = Boolean(user?.email && user?.token);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

  const openPopup = useCallback((options?: PopupTriggerDetail) => {
    if (isLogged) return;
    const nextMode = options?.mode;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (options?.force || nextMode) {
      setMode(nextMode || "login");
      setError(null);
      setLoading(false);
    }
    setIsOpen(true);
  }, [isLogged]);

  // Auto-open popup on page load (once, after 4s)
  useEffect(() => {
    if (isLogged) return;
    timerRef.current = window.setTimeout(() => openPopup({ mode: "login" }), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLogged, openPopup]);

  // Auto-open popup when item is added to cart
  useEffect(() => {
    if (!isLogged && totalItems > prevTotalItemsRef.current) {
      openPopup({ mode: "login" });
    }
    prevTotalItemsRef.current = totalItems;
  }, [totalItems, isLogged, openPopup]);

  // Listen for external popup trigger (e.g. from checkout)
  useEffect(() => {
    const onTrigger = (event: Event) => {
      const detail = (event as CustomEvent<PopupTriggerDetail>).detail;
      openPopup({ force: detail?.force, mode: detail?.mode });
    };
    window.addEventListener("bacaxita:login-popup", onTrigger as EventListener);
    return () => {
      window.removeEventListener("bacaxita:login-popup", onTrigger as EventListener);
    };
  }, [openPopup]);

  // Close popup on login
  useEffect(() => {
    if (isLogged && isOpen) setIsOpen(false);
  }, [isLogged, isOpen]);

  const normalizeEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    return trimmed.endsWith("@gmail.cc") ? trimmed.replace("@gmail.cc", "@gmail.com") : trimmed;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = normalizeEmail(loginEmail);
      const password = loginPassword.trim();

      if (!email || !password) {
        setError({ message: "Preencha e-mail e senha" });
        return;
      }

      const ok = await login(email, password);
      if (!ok) {
        setError({ message: "E-mail ou senha incorretos" });
        return;
      }
      setIsOpen(false);
    } catch (err) {
      setError({ message: "Erro ao fazer login" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const firstName = regFirstName.trim();
      const lastName = regLastName.trim();
      const email = normalizeEmail(regEmail);
      const phone = regPhone.trim();
      const password = regPassword.trim();
      const confirm = regConfirm.trim();

      if (!firstName || !lastName || !email) {
        setError({ message: "Preencha nome, sobrenome e e-mail" });
        return;
      }
      if (password.length < 8) {
        setError({ message: "Senha deve ter no mínimo 8 caracteres" });
        return;
      }
      if (password !== confirm) {
        setError({ message: "As senhas não conferem" });
        return;
      }

      const result = await register({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password,
        confirmPassword: confirm,
      });

      if (!result.ok) {
        setError({ message: result.error || "Erro ao criar conta" });
        return;
      }

      setVerifyEmailAddr(email);
      setMode("verify");
      setError({ message: "Código enviado para seu e-mail", type: "success" });
    } catch (err) {
      setError({ message: "Erro ao criar conta" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!verifyEmailAddr || !verifyCode.trim()) {
        setError({ message: "Preencha o código" });
        return;
      }

      const result = await verifyEmail(verifyEmailAddr, verifyCode.trim());
      if (!result.ok) {
        setError({ message: result.error || "Código inválido" });
        return;
      }

      setError({ message: "E-mail verificado! Faça login para continuar", type: "success" });
      setTimeout(() => {
        setMode("login");
        setLoginEmail(verifyEmailAddr);
        setVerifyCode("");
      }, 1500);
    } catch (err) {
      setError({ message: "Erro ao verificar e-mail" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const email = normalizeEmail(verifyEmailAddr);
    if (!email) {
      setError({ message: "Informe o e-mail para reenviar o codigo" });
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await resendVerification(email);
      if (!result.ok) {
        setError({ message: result.error || "Nao foi possivel reenviar o codigo" });
        return;
      }

      setError({ message: "Codigo reenviado para seu e-mail", type: "success" });
    } catch {
      setError({ message: "Erro ao reenviar o codigo" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccessToken = async (accessToken: string) => {
    const result = await googleLogin({ accessToken });
    if (result.ok) {
      setIsOpen(false);
      return;
    }

    if (result.needsRegistration) {
      const fullName = String(result.name || "").trim();
      const [firstName = "", ...lastNameParts] = fullName.split(/\s+/);
      setRegFirstName(firstName);
      setRegLastName(lastNameParts.join(" "));
      setRegEmail(result.email || "");
      setMode("register");
      setError({ message: "Complete seu cadastro para continuar" });
      return;
    }

    setError({ message: result.error || "Erro ao entrar com Google" });
  };

  const handleGoogleLogin = async () => {
    setError(null);
    if (!googleClientId) {
      setError({ message: "Google nao configurado" });
      return;
    }

    setLoading(true);
    try {
      await loadGoogleIdentityScript();
      const tokenClientFactory = window.google?.accounts?.oauth2?.initTokenClient;
      if (!tokenClientFactory) {
        setError({ message: "Google indisponivel" });
        setLoading(false);
        return;
      }

      const tokenClient = tokenClientFactory({
        client_id: googleClientId,
        scope: "openid email profile",
        callback: async (response: { access_token?: string; error?: string; error_description?: string }) => {
          try {
            if (response?.error || !response?.access_token) {
              setError({ message: response?.error_description || "Falha ao autenticar com Google" });
              return;
            }

            await handleGoogleAccessToken(response.access_token);
          } finally {
            setLoading(false);
          }
        },
        error_callback: () => {
          setError({ message: "Nao foi possivel abrir o login do Google" });
          setLoading(false);
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch {
      setError({ message: "Erro ao carregar Google" });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed top-1/2 left-1/2 z-50 w-[95%] max-w-[430px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_32px_80px_-34px_rgba(18,14,10,0.78)]">
        <div className="h-1.5 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />

        <div className="bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%)] p-6">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold mb-3 text-foreground">
            {mode === "login" ? "Efetue seu Login" : mode === "register" ? "Efetue seu Cadastro" : "Verificar E-mail"}
          </h2>

          {mode === "register" && (
            <div className="mb-4 rounded-2xl border border-border/70 bg-muted/40 px-3 py-2 text-xs text-foreground">
              <p>Crie sua conta e acompanhe seus pedidos com mais facilidade.</p>
            </div>
          )}

          {error && (
            error.type === "success" ? (
              <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-700 flex gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            ) : (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )
          )}

          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-3 rounded-2xl border-[#dadce0] bg-white text-sm text-slate-700 shadow-sm transition-all hover:border-[#c6dafc] hover:bg-[#f8fbff] hover:text-slate-900"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <GoogleIcon />
                <span>
                  {loading ? (
                    "Conectando..."
                  ) : (
                    <>
                      Entrar com <GoogleWordmark />
                    </>
                  )}
                </span>
              </Button>

              <Input
                type="email"
                placeholder="E-mail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loading}
                className="text-sm"
              />

              <div className="relative">
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loading}
                  className="text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full bg-rasta-green hover:bg-rasta-green/90 text-sm" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                disabled={loading}
              >
                Criar conta
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-3 rounded-2xl border-[#dadce0] bg-white text-sm text-slate-700 shadow-sm transition-all hover:border-[#c6dafc] hover:bg-[#f8fbff] hover:text-slate-900"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <GoogleIcon />
                <span>
                  {loading ? (
                    "Conectando..."
                  ) : (
                    <>
                      Cadastrar com <GoogleWordmark />
                    </>
                  )}
                </span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nome"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  disabled={loading}
                  className="text-sm"
                />
                <Input
                  placeholder="Sobrenome"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  disabled={loading}
                  className="text-sm"
                />
              </div>

              <Input
                type="tel"
                placeholder="Telefone"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                disabled={loading}
                className="text-sm"
              />

              <Input
                type="email"
                placeholder="E-mail"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={loading}
                className="text-sm"
              />

              <div className="relative">
                <Input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                  className="text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showRegConfirm ? "text" : "password"}
                  placeholder="Confirmar senha"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  disabled={loading}
                  className="text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirm(!showRegConfirm)}
                  className="absolute right-3 top-2.5"
                >
                  {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full bg-rasta-green hover:bg-rasta-green/90 text-sm" disabled={loading}>
                {loading ? "Criando..." : "Criar conta"}
              </Button>

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                disabled={loading}
              >
                Já tenho conta
              </button>
            </form>
          )}

          {mode === "verify" && (
            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <Input
                placeholder="Código"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                disabled={loading}
                className="text-sm"
              />

              <Button type="submit" className="w-full bg-rasta-green hover:bg-rasta-green/90 text-sm" disabled={loading}>
                {loading ? "Verificando..." : "Verificar"}
              </Button>

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMode("login");
                  setVerifyCode("");
                  setError(null);
                }}
                disabled={loading}
              >
                Voltar
              </button>

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={handleResendCode}
                disabled={loading}
              >
                Reenviar codigo
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default SignupPopup;
