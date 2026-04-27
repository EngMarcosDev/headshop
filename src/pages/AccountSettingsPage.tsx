import { useEffect, useRef, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, refreshProfile, logout } = useAuth();

  // ── Profile form
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── Address form (entrega) — todos opcionais. Se incompleto, no checkout o
  // cliente pode preencher na hora.
  const [addrZipCode,      setAddrZipCode]      = useState(user?.addressZipCode      ?? "");
  const [addrStreet,       setAddrStreet]       = useState(user?.addressStreet       ?? "");
  const [addrNumber,       setAddrNumber]       = useState(user?.addressNumber       ?? "");
  const [addrComplement,   setAddrComplement]   = useState(user?.addressComplement   ?? "");
  const [addrNeighborhood, setAddrNeighborhood] = useState(user?.addressNeighborhood ?? "");
  const [addrCity,         setAddrCity]         = useState(user?.addressCity         ?? "");
  const [addrState,        setAddrState]        = useState(user?.addressState        ?? "");
  const [addrReference,    setAddrReference]    = useState(user?.addressReference    ?? "");
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrMsg, setAddrMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  // Hidrata endereço quando o profile chega da API (evita sobrescrever se o user
  // já estava editando um campo).
  useEffect(() => {
    if (!user) return;
    setAddrZipCode((prev) => (prev === "" ? (user.addressZipCode ?? "") : prev));
    setAddrStreet((prev) => (prev === "" ? (user.addressStreet ?? "") : prev));
    setAddrNumber((prev) => (prev === "" ? (user.addressNumber ?? "") : prev));
    setAddrComplement((prev) => (prev === "" ? (user.addressComplement ?? "") : prev));
    setAddrNeighborhood((prev) => (prev === "" ? (user.addressNeighborhood ?? "") : prev));
    setAddrCity((prev) => (prev === "" ? (user.addressCity ?? "") : prev));
    setAddrState((prev) => (prev === "" ? (user.addressState ?? "") : prev));
    setAddrReference((prev) => (prev === "" ? (user.addressReference ?? "") : prev));
  }, [
    user?.addressZipCode, user?.addressStreet, user?.addressNumber, user?.addressComplement,
    user?.addressNeighborhood, user?.addressCity, user?.addressState, user?.addressReference,
  ]);

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

  const handleAddressSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAddrSaving(true);
    setAddrMsg(null);
    const result = await updateProfile({
      addressZipCode:      addrZipCode.trim(),
      addressStreet:       addrStreet.trim(),
      addressNumber:       addrNumber.trim(),
      addressComplement:   addrComplement.trim(),
      addressNeighborhood: addrNeighborhood.trim(),
      addressCity:         addrCity.trim(),
      addressState:        addrState.trim().toUpperCase(),
      addressReference:    addrReference.trim(),
    });
    setAddrSaving(false);
    if (result.ok) {
      setAddrMsg({ type: "ok", text: "Endereço salvo com sucesso!" });
    } else {
      setAddrMsg({ type: "err", text: result.error ?? "Erro ao salvar endereço." });
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
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-accent uppercase tracking-widest">
                Minha Conta
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Link to="/historico" className="text-sm text-muted-foreground hover:text-foreground">
              Histórico
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

          {/* ── Endereço de entrega ───────────────────────────────── */}
          <section className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Endereço de Entrega</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cadastre seu endereço para agilizar o checkout — você ainda pode alterar na hora da compra.
              </p>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="addr-zip" className="mb-1.5 block text-sm font-medium text-foreground">CEP</label>
                  <input
                    id="addr-zip" type="text" value={addrZipCode}
                    onChange={(e) => setAddrZipCode(e.target.value)}
                    placeholder="00000-000" maxLength={12}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="addr-street" className="mb-1.5 block text-sm font-medium text-foreground">Rua / Avenida</label>
                  <input
                    id="addr-street" type="text" value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    placeholder="Ex: R. Soc Mario Ferreira" maxLength={160}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  />
                </div>
                <div>
                  <label htmlFor="addr-number" className="mb-1.5 block text-sm font-medium text-foreground">Número</label>
                  <input
                    id="addr-number" type="text" value={addrNumber}
                    onChange={(e) => setAddrNumber(e.target.value)}
                    placeholder="200" maxLength={20}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="addr-complement" className="mb-1.5 block text-sm font-medium text-foreground">
                    Complemento <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <input
                    id="addr-complement" type="text" value={addrComplement}
                    onChange={(e) => setAddrComplement(e.target.value)}
                    placeholder="Ap 401, Bloco B" maxLength={120}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  />
                </div>
                <div>
                  <label htmlFor="addr-neighborhood" className="mb-1.5 block text-sm font-medium text-foreground">Bairro</label>
                  <input
                    id="addr-neighborhood" type="text" value={addrNeighborhood}
                    onChange={(e) => setAddrNeighborhood(e.target.value)}
                    placeholder="Indianópolis" maxLength={120}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="addr-city" className="mb-1.5 block text-sm font-medium text-foreground">Cidade</label>
                  <input
                    id="addr-city" type="text" value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Caruaru" maxLength={120}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  />
                </div>
                <div>
                  <label htmlFor="addr-state" className="mb-1.5 block text-sm font-medium text-foreground">UF</label>
                  <input
                    id="addr-state" type="text" value={addrState}
                    onChange={(e) => setAddrState(e.target.value.toUpperCase())}
                    placeholder="PE" maxLength={2}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="addr-reference" className="mb-1.5 block text-sm font-medium text-foreground">
                  Referência <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  id="addr-reference" type="text" value={addrReference}
                  onChange={(e) => setAddrReference(e.target.value)}
                  placeholder="Edifício Bruna, em frente à praça" maxLength={200}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rasta-green/60"
                />
              </div>

              {addrMsg ? (
                <p className={`text-sm font-medium ${addrMsg.type === "ok" ? "text-rasta-green" : "text-destructive"}`}>
                  {addrMsg.text}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addrSaving}
                  className="rounded-lg bg-rasta-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                >
                  {addrSaving ? "Salvando..." : "Salvar endereço"}
                </button>
              </div>
            </form>
          </section>

          {/* ── Change password section ───────────────────────────── */}
          <section className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
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
          {/* ── Logout section ───────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Sair da Conta</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Você será desconectado deste dispositivo.
              </p>
            </div>
            <div className="flex justify-end px-6 py-5">
              <button
                type="button"
                onClick={() => { logout(); navigate("/"); }}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-2 text-sm font-semibold text-destructive shadow-sm transition hover:bg-destructive/20"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettingsPage;
