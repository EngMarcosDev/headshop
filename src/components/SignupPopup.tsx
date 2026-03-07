import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, X, AlertCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface FormError {
  field?: string;
  message: string;
}

const SignupPopup = () => {
  const { totalItems } = useCart();
  const { user, login, register, verifyEmail, resendVerification } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
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

  const openPopup = (force = false) => {
    if (isLogged) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (force) {
      setMode("login");
      setError(null);
    }
    setIsOpen(true);
  };

  // Auto-open popup on signup
  useEffect(() => {
    if (isLogged) return;
    timerRef.current = window.setTimeout(() => openPopup(false), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.email, isLogged]);

  // Auto-open popup on add to cart
  useEffect(() => {
    if (!isLogged && totalItems > prevTotalItemsRef.current) {
      openPopup(false);
    }
    prevTotalItemsRef.current = totalItems;
  }, [totalItems, isLogged]);

  // Listen for popup trigger
  useEffect(() => {
    const onTrigger = (event: Event) => {
      const detail = (event as CustomEvent<{ force?: boolean }>).detail;
      openPopup(Boolean(detail?.force));
    };
    window.addEventListener("bacaxita:login-popup", onTrigger as EventListener);
    return () => {
      window.removeEventListener("bacaxita:login-popup", onTrigger as EventListener);
    };
  }, [isLogged]);

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
      setError(
        result.verificationCode 
          ? { message: `Código: ${result.verificationCode}` } 
          : { message: "Código enviado para seu e-mail" }
      );
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

      setError({ message: "E-mail verificado! Faça login para continuar" });
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

  const handleGoogleLogin = async () => {
    // Google login disabled - use internal authentication only
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-sm bg-card rounded-lg border border-border z-50 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />

        <div className="p-6">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold mb-3 text-foreground">
            {mode === "login" ? "Efetue seu Login" : mode === "register" ? "Efetue seu Cadastro" : "Verificar E-mail"}
          </h2>

          {mode === "login" && (
            <div className="bg-muted rounded p-2 mb-4 text-xs text-foreground">
              <p>Me parece que você é novo aqui!</p>
              <p className="text-muted-foreground mt-1">Cadastre-se e receba 5% de desconto na primeira compra.</p>
            </div>
          )}

          {mode === "register" && (
            <div className="bg-muted rounded p-2 mb-4 text-xs text-foreground">
              <p>É realmente uma maravilha ter você conosco.</p>
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error.message}</span>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
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

