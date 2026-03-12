import { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

declare global {
  interface Window {
    google?: any;
  }
}

interface FormError {
  field?: string;
  message: string;
}

type PopupMode = "login" | "register" | "verify";

const SignupPopup = () => {
  const { user, login, register, verifyEmail, googleLogin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PopupMode>("login");
  const [error, setError] = useState<FormError | null>(null);
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [verifyEmailAddr, setVerifyEmailAddr] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const isLogged = Boolean(user?.email && user?.token);

  const openPopup = (targetMode: "login" | "register" = "login") => {
    if (isLogged) return;
    setMode(targetMode);
    setError(null);
    setIsOpen(true);
  };

  useEffect(() => {
    const onTrigger = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: "login" | "register" }>).detail;
      openPopup(detail?.mode === "register" ? "register" : "login");
    };

    window.addEventListener("bacaxita:login-popup", onTrigger as EventListener);
    return () => {
      window.removeEventListener("bacaxita:login-popup", onTrigger as EventListener);
    };
  }, [isLogged]);

  useEffect(() => {
    if (isLogged && isOpen) setIsOpen(false);
  }, [isLogged, isOpen]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bacaxita:login-popup-visibility", {
        detail: { open: isOpen },
      })
    );
  }, [isOpen]);

  const normalizeEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    return trimmed.endsWith("@gmail.cc") ? trimmed.replace("@gmail.cc", "@gmail.com") : trimmed;
  };

  const loadGoogleScript = async () => {
    if (typeof window === "undefined") throw new Error("Janela indisponivel.");
    if (window.google?.accounts?.id) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-google-gsi="1"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Falha ao carregar Google Identity.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleGsi = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar Google Identity."));
      document.head.appendChild(script);
    });
  };

  const requestGoogleCredential = async (clientId: string) => {
    await loadGoogleScript();

    return new Promise<string>((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error("Google Identity nao disponivel."));
        return;
      }

      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const timeout = window.setTimeout(() => {
        finish(() => reject(new Error("Nao foi possivel obter credencial Google.")));
      }, 30000);

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          window.clearTimeout(timeout);
          const credential = String(response?.credential || "").trim();
          if (!credential) {
            finish(() => reject(new Error("Resposta Google sem credencial.")));
            return;
          }
          finish(() => resolve(credential));
        },
        ux_mode: "popup",
        auto_select: false,
      });

      window.google.accounts.id.prompt((notification: any) => {
        const notDisplayed = typeof notification?.isNotDisplayed === "function" && notification.isNotDisplayed();
        const skipped = typeof notification?.isSkippedMoment === "function" && notification.isSkippedMoment();
        const dismissed =
          typeof notification?.isDismissedMoment === "function" &&
          notification.isDismissedMoment() &&
          String(notification?.getDismissedReason?.() || "").toLowerCase() !== "credential_returned";

        if (notDisplayed || skipped || dismissed) {
          window.clearTimeout(timeout);
          finish(() => reject(new Error("Login Google cancelado ou bloqueado pelo navegador.")));
        }
      });
    });
  };

  const requestGoogleAccessToken = async (clientId: string) => {
    await loadGoogleScript();

    return new Promise<string>((resolve, reject) => {
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2?.initTokenClient) {
        reject(new Error("Google OAuth indisponivel no navegador."));
        return;
      }

      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const timeout = window.setTimeout(() => {
        finish(() => reject(new Error("Tempo esgotado ao tentar autenticar com Google.")));
      }, 30000);

      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (response: any) => {
          window.clearTimeout(timeout);
          if (response?.error) {
            finish(() => reject(new Error(String(response.error_description || response.error || "Falha no Google OAuth."))));
            return;
          }
          const token = String(response?.access_token || "").trim();
          if (!token) {
            finish(() => reject(new Error("Nao foi possivel obter token Google.")));
            return;
          }
          finish(() => resolve(token));
        },
        error_callback: (error: any) => {
          window.clearTimeout(timeout);
          const reason = String(error?.type || error?.message || "").toLowerCase();
          if (reason.includes("popup")) {
            finish(() => reject(new Error("Popup do Google bloqueado. Permita popups e tente novamente.")));
            return;
          }
          finish(() => reject(new Error("Falha ao abrir autenticacao Google.")));
        },
      });

      try {
        tokenClient.requestAccessToken({ prompt: "consent" });
      } catch {
        window.clearTimeout(timeout);
        finish(() => reject(new Error("Falha ao abrir autenticacao Google.")));
      }
    });
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
    } catch {
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
        setError({ message: "Senha deve ter no minimo 8 caracteres" });
        return;
      }
      if (password !== confirm) {
        setError({ message: "As senhas nao conferem" });
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
      setError(
        result.verificationCode
          ? { message: `Codigo: ${result.verificationCode}` }
          : { message: "Codigo enviado para seu e-mail" }
      );
    } catch {
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
        setError({ message: "Preencha o codigo" });
        return;
      }

      const result = await verifyEmail(verifyEmailAddr, verifyCode.trim());
      if (!result.ok) {
        setError({ message: result.error || "Codigo invalido" });
        return;
      }

      setError({ message: "E-mail verificado! Faca login para continuar" });
      window.setTimeout(() => {
        setMode("login");
        setLoginEmail(verifyEmailAddr);
        setVerifyCode("");
      }, 1500);
    } catch {
      setError({ message: "Erro ao verificar e-mail" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
      if (!clientId) {
        setError({ message: "Google OAuth nao configurado no frontend." });
        return;
      }

      let result:
        | { ok: boolean; needsRegistration?: boolean; email?: string; name?: string; error?: string }
        | null = null;

      try {
        const accessToken = await requestGoogleAccessToken(clientId);
        result = await googleLogin({ accessToken });
      } catch {
        const idToken = await requestGoogleCredential(clientId);
        result = await googleLogin({ idToken });
      }

      if (!result) {
        setError({ message: "Nao foi possivel entrar com Google." });
        return;
      }

      if (!result.ok) {
        if (result.needsRegistration) {
          const fullName = String(result.name || "").trim();
          const parts = fullName.split(" ").filter(Boolean);
          const firstName = parts.shift() || "Cliente";
          const lastName = parts.join(" ") || "Google";
          setRegFirstName(firstName);
          setRegLastName(lastName);
          setRegEmail(String(result.email || "").trim().toLowerCase());
          setRegPassword("");
          setRegConfirm("");
          setMode("register");
          setError({
            message: "Conta Google ainda nao criada aqui. Complete o cadastro para continuar.",
          });
          return;
        }

        setError({ message: result.error || "Nao foi possivel entrar com Google." });
        return;
      }

      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao entrar com Google.";
      setError({ message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div className="fixed top-1/2 left-1/2 z-50 w-[95%] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />

        <div className="p-6">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="mb-3 text-xl font-bold text-foreground">
            {mode === "login" ? "Efetue seu Login" : mode === "register" ? "Efetue seu Cadastro" : "Verificar E-mail"}
          </h2>

          {mode === "login" && (
            <div className="mb-4 rounded bg-muted p-2 text-xs text-foreground">
              <p>Me parece que voce e novo aqui!</p>
              <p className="mt-1 text-muted-foreground">Cadastre-se e receba 5% de desconto na primeira compra.</p>
            </div>
          )}

          {mode === "register" && (
            <div className="mb-4 rounded bg-muted p-2 text-xs text-foreground">
              <p>E realmente uma maravilha ter voce conosco.</p>
            </div>
          )}

          {error && (
            <div className="mb-3 flex gap-2 rounded border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <Button type="button" variant="outline" className="w-full text-sm" onClick={handleGoogleLogin} disabled={loading}>
                {loading ? "Conectando..." : "Entrar com Google"}
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
                  className="pr-10 text-sm"
                />
                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-2.5">
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full bg-rasta-green text-sm hover:bg-rasta-green/90" disabled={loading}>
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
              <Button type="button" variant="outline" className="w-full text-sm" onClick={handleGoogleLogin} disabled={loading}>
                {loading ? "Conectando..." : "Cadastrar com Google"}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nome" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} disabled={loading} className="text-sm" />
                <Input placeholder="Sobrenome" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} disabled={loading} className="text-sm" />
              </div>

              <Input type="tel" placeholder="Telefone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} disabled={loading} className="text-sm" />

              <Input type="email" placeholder="E-mail" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} disabled={loading} className="text-sm" />

              <div className="relative">
                <Input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10 text-sm"
                />
                <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-2.5">
                  {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showRegConfirm ? "text" : "password"}
                  placeholder="Confirmar senha"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  disabled={loading}
                  className="pr-10 text-sm"
                />
                <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)} className="absolute right-3 top-2.5">
                  {showRegConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full bg-rasta-green text-sm hover:bg-rasta-green/90" disabled={loading}>
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
                Ja tenho conta
              </button>
            </form>
          )}

          {mode === "verify" && (
            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <Input
                placeholder="Codigo"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                disabled={loading}
                className="text-sm"
              />

              <Button type="submit" className="w-full bg-rasta-green text-sm hover:bg-rasta-green/90" disabled={loading}>
                {loading ? "Verificando..." : "Verificar"}
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
                Voltar
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default SignupPopup;
