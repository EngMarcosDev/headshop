import { useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const AccountSettingsPage = () => {
  const { user, updateProfile, changePassword, refreshProfile } = useAuth();

  // ── Profile form
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Sync local state when user data loads / changes
  const profileLoaded = useRef(false);
  useEffect(() => {
    if (!profileLoaded.current && user) {
      setProfileName(user.name ?? "");
      setProfilePhone(user.phone ?? "");
      profileLoaded.current = true;
    }
  }, [user]);

  // Refresh profile from backend on mount (so phone is always up-to-date)
  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep fields in sync after refreshProfile resolves
  useEffect(() => {
    if (user) {
      setProfileName((prev) => (prev === "" ? (user.name ?? "") : prev));
      setProfilePhone((prev) => (prev === "" ? (user.phone ?? "") : prev));
    }
  }, [user?.name, user?.phone]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileName.trim()) {
      setProfileMsg({ type: "err", text: "Nome nao pode ficar vazio." });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    const result = await updateProfile({ name: profileName.trim(), phone: profilePhone.trim() || undefined });
    setProfileSaving(false);
    if (result.ok) {
      setProfileMsg({ type: "ok", text: "Dados atualizados com sucesso!" });
    } else {
      setProfileMsg({ type: "err", text: result.error ?? "Erro ao salvar dados." });
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "err", text: "Nova senha e confirmacao nao conferem." });
      return;
    }
    if (newPassword.length < 8) {
      setPassMsg({ type: "err", text: "A nova senha deve ter ao menos 8 caracteres." });
      return;
    }
    setPassSaving(true);
    setPassMsg(null);
    const result = await changePassword({ currentPassword, newPassword, confirmPassword });
    setPassSaving(false);
    if (result.ok) {
      setPassMsg({ type: "ok", text: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPassMsg({ type: "err", text: result.error ?? "Erro ao alterar senha." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-accent uppercase tracking-widest">
                Minha Conta
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Link to="/historico" className="text-sm text-muted-foreground hover:text-foreground">
              Historico
            </Link>
          </div>

          {/* ── Personal data section ─────────────────────────────── */}
          <section className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Dados Pessoais</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Atualize seu nome e telefone de contato.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-foreground">
                  Nome completo
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  maxLength={80}
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-foreground">
                  Telefone / WhatsApp{" "}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  maxLength={25}
                />
              </div>

              {profileMsg ? (
                <p
                  className={`text-sm font-medium ${
                    profileMsg.type === "ok" ? "text-rasta-green" : "text-destructive"
                  }`}
                >
                  {profileMsg.text}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-lg bg-rasta-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                >
                  {profileSaving ? "Salvando..." : "Salvar dados"}
                </button>
              </div>
            </form>
          </section>

          {/* ── Change password section ───────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Alterar Senha</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Para sua seguranca, informe a senha atual antes de escolher a nova.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-foreground">
                  Senha atual
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-foreground">
                  Nova senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caracteres"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground">
                  Confirmar nova senha
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {passMsg ? (
                <p
                  className={`text-sm font-medium ${
                    passMsg.type === "ok" ? "text-rasta-green" : "text-destructive"
                  }`}
                >
                  {passMsg.text}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passSaving}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-2 text-sm font-semibold text-destructive shadow-sm transition hover:bg-destructive/20 disabled:opacity-50"
                >
                  {passSaving ? "Alterando..." : "Alterar senha"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettingsPage;
