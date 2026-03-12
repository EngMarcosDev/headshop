import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CreditCard, LockKeyhole, Plus, ShieldCheck, Trash2, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

interface SavedCard {
  id: string;
  brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard";
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  isDefault: boolean;
}

interface WalletCardsResponse {
  customerId: string;
  cards: SavedCard[];
}

interface WalletAccessResponse {
  walletAccessToken?: string;
  expiresAt?: string;
  error?: string;
}

const brandColors: Record<SavedCard["brand"], string> = {
  visa: "bg-blue-600",
  mastercard: "bg-orange-500",
  elo: "bg-yellow-500",
  amex: "bg-emerald-600",
  hipercard: "bg-red-600",
};

const brandLabels: Record<SavedCard["brand"], string> = {
  visa: "VISA",
  mastercard: "MASTERCARD",
  elo: "ELO",
  amex: "AMEX",
  hipercard: "HIPERCARD",
};

const loadMercadoPagoSdk = async () => {
  if (typeof window === "undefined") throw new Error("Janela indisponivel.");
  if (window.MercadoPago) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-mercadopago-sdk="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar SDK Mercado Pago.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.defer = true;
    script.dataset.mercadopagoSdk = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar SDK Mercado Pago."));
    document.head.appendChild(script);
  });
};

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionStorageKey = `wallet_access_token:${user?.id || "guest"}`;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string>("");
  const [search, setSearch] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [walletAccessToken, setWalletAccessToken] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({
    holderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cpf: "",
  });

  const lockWallet = useCallback(
    (message?: string) => {
      setWalletAccessToken("");
      setCards([]);
      setRegisterOpen(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(sessionStorageKey);
      }
      if (message) {
        setError(message);
      }
    },
    [sessionStorageKey]
  );

  const loadCards = useCallback(async () => {
    if (!user?.token || !walletAccessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(joinUrl(API_BASE, "/payments/mercadopago/wallet/cards"), {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "X-Wallet-Access-Token": walletAccessToken,
        },
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as
        | WalletCardsResponse
        | { error?: string; code?: string }
        | null;

      if (!response.ok) {
        if (response.status === 423 || (payload && "code" in payload && payload.code === "WALLET_LOCKED")) {
          lockWallet(payload && "error" in payload ? payload.error : "Carteira bloqueada. Informe sua senha.");
          return;
        }
        throw new Error(payload && "error" in payload && payload.error ? payload.error : "Erro ao carregar carteira.");
      }

      setCards(Array.isArray(payload?.cards) ? payload.cards : []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Erro ao carregar carteira.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [lockWallet, user?.token, walletAccessToken]);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    const storedToken = window.sessionStorage.getItem(sessionStorageKey);
    if (storedToken) {
      setWalletAccessToken(storedToken);
    }
  }, [sessionStorageKey, user?.id]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    const loadPublicKey = async () => {
      try {
        const response = await fetch(joinUrl(API_BASE, "/payments/mercadopago/public-key"));
        const payload = (await response.json().catch(() => null)) as { publicKey?: string } | null;
        if (!response.ok) return;
        if (payload?.publicKey) {
          setPublicKey(String(payload.publicKey));
        }
      } catch {
        // best effort
      }
    };

    loadPublicKey();
  }, []);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) => {
      const holder = String(card.holderName || "").toLowerCase();
      return holder.includes(q) || card.lastFour.includes(q) || card.brand.includes(q);
    });
  }, [cards, search]);

  const handleDelete = async (cardId: string) => {
    if (!user?.token || !walletAccessToken) return;
    setDeleting(cardId);
    setError(null);
    try {
      const response = await fetch(joinUrl(API_BASE, `/payments/mercadopago/wallet/cards/${cardId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "X-Wallet-Access-Token": walletAccessToken,
        },
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;

      if (!response.ok) {
        if (response.status === 423 || payload?.code === "WALLET_LOCKED") {
          lockWallet(payload?.error || "Carteira bloqueada. Informe sua senha.");
          return;
        }
        throw new Error(payload?.error || "Nao foi possivel remover o cartao.");
      }

      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Nao foi possivel remover o cartao.";
      setError(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleUnlockWallet = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.token) return;

    setIsUnlocking(true);
    setError(null);
    try {
      const response = await fetch(joinUrl(API_BASE, "/payments/mercadopago/wallet/access/verify"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        credentials: "include",
        body: JSON.stringify({ password: unlockPassword }),
      });

      const payload = (await response.json().catch(() => null)) as WalletAccessResponse | null;
      if (!response.ok || !payload?.walletAccessToken) {
        throw new Error(payload?.error || "Senha invalida para acessar a carteira.");
      }

      setWalletAccessToken(payload.walletAccessToken);
      setUnlockPassword("");
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(sessionStorageKey, payload.walletAccessToken);
      }
    } catch (unlockError) {
      const message =
        unlockError instanceof Error ? unlockError.message : "Nao foi possivel desbloquear a carteira.";
      setError(message);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleRegisterCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.token || !walletAccessToken) return;
    setError(null);
    setIsSaving(true);

    try {
      const key = String(publicKey || "").trim();
      if (!key) {
        throw new Error("Chave publica do Mercado Pago nao configurada.");
      }

      await loadMercadoPagoSdk();
      if (!window.MercadoPago) {
        throw new Error("SDK Mercado Pago indisponivel.");
      }

      const mp = new window.MercadoPago(key, { locale: "pt-BR" });
      const tokenResponse = await mp.createCardToken({
        cardNumber: formData.cardNumber.replace(/\s+/g, ""),
        cardholderName: formData.holderName.trim(),
        cardExpirationMonth: formData.expiryMonth.trim(),
        cardExpirationYear: formData.expiryYear.trim(),
        securityCode: formData.cvv.trim(),
        identificationType: "CPF",
        identificationNumber: formData.cpf.replace(/\D/g, ""),
      });

      const token = String(tokenResponse?.id || "").trim();
      if (!token) {
        throw new Error("Nao foi possivel tokenizar o cartao.");
      }

      const response = await fetch(joinUrl(API_BASE, "/payments/mercadopago/wallet/cards"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
          "X-Wallet-Access-Token": walletAccessToken,
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { card?: SavedCard; error?: string; code?: string }
        | null;
      if (!response.ok || !payload?.card) {
        if (response.status === 423 || payload?.code === "WALLET_LOCKED") {
          lockWallet(payload?.error || "Carteira bloqueada. Informe sua senha.");
          return;
        }
        throw new Error(payload?.error || "Nao foi possivel cadastrar o cartao.");
      }

      setCards((prev) => [payload.card as SavedCard, ...prev]);
      setRegisterOpen(false);
      setFormData({
        holderName: "",
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        cpf: "",
      });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Nao foi possivel cadastrar o cartao.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="mb-8 flex items-center gap-3">
          <Wallet className="h-7 w-7 text-accent" />
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Minha Carteira</h1>
        </div>

        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Seguranca de dados</p>
              <p>
                Seus dados de pagamento sao processados pelo Mercado Pago. Apenas informacoes mascaradas ficam
                disponiveis nesta tela.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!walletAccessToken ? (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="mx-auto max-w-md space-y-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Carteira protegida</p>
                  <p className="text-sm text-muted-foreground">
                    Digite sua senha de login para visualizar e gerenciar os cartoes salvos.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUnlockWallet} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="wallet-password">Senha da conta</Label>
                  <Input
                    id="wallet-password"
                    type="password"
                    value={unlockPassword}
                    onChange={(event) => setUnlockPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-rasta-green text-white hover:bg-rasta-green/90"
                  disabled={isUnlocking}
                >
                  {isUnlocking ? "Validando..." : "Desbloquear Minha Carteira"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input
                  placeholder="Buscar por bandeira, titular ou final"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="md:col-span-2"
                />
                <Button
                  onClick={() => setRegisterOpen(true)}
                  className="bg-rasta-green text-white hover:bg-rasta-green/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar cartao
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-6">
              {isLoading ? <p className="text-sm text-muted-foreground">Carregando carteira...</p> : null}

              {!isLoading && filteredCards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                  <CreditCard className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">Nenhum cartao salvo ainda</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cadastre um cartao para acelerar seus proximos pagamentos.
                  </p>
                </div>
              ) : null}

              {filteredCards.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">{filteredCards.length} cartao(oes) encontrado(s)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-3">Bandeira</th>
                          <th className="py-2 pr-3">Cartao</th>
                          <th className="py-2 pr-3">Titular</th>
                          <th className="py-2 pr-3">Validade</th>
                          <th className="py-2 pr-3">Padrao</th>
                          <th className="py-2 text-right">Acao</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCards.map((card) => (
                          <tr key={card.id} className="border-b border-border/60 last:border-0">
                            <td className="py-3 pr-3">
                              <span
                                className={`inline-flex h-7 min-w-[62px] items-center justify-center rounded-md px-2 text-[10px] font-bold tracking-wider text-white ${brandColors[card.brand]}`}
                              >
                                {brandLabels[card.brand]}
                              </span>
                            </td>
                            <td className="py-3 pr-3 font-mono text-foreground">**** **** **** {card.lastFour}</td>
                            <td className="py-3 pr-3 text-foreground">{card.holderName}</td>
                            <td className="py-3 pr-3 text-muted-foreground">
                              {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}
                            </td>
                            <td className="py-3 pr-3">
                              {card.isDefault ? (
                                <span className="inline-flex rounded-full bg-accent/15 px-2 py-1 text-[10px] font-semibold text-accent">
                                  PADRAO
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(card.id)}
                                disabled={deleting === card.id}
                                className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className={`h-4 w-4 ${deleting === card.id ? "animate-spin" : ""}`} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          </>
        )}
      </main>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar cartao</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegisterCard} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holderName">Nome no cartao</Label>
              <Input
                id="holderName"
                value={formData.holderName}
                onChange={(event) => setFormData((prev) => ({ ...prev, holderName: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Numero do cartao</Label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                value={formData.cardNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, cardNumber: event.target.value }))}
                placeholder="0000 0000 0000 0000"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth">Mes</Label>
                <Input
                  id="expiryMonth"
                  inputMode="numeric"
                  value={formData.expiryMonth}
                  onChange={(event) => setFormData((prev) => ({ ...prev, expiryMonth: event.target.value }))}
                  placeholder="MM"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryYear">Ano</Label>
                <Input
                  id="expiryYear"
                  inputMode="numeric"
                  value={formData.expiryYear}
                  onChange={(event) => setFormData((prev) => ({ ...prev, expiryYear: event.target.value }))}
                  placeholder="AAAA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  inputMode="numeric"
                  value={formData.cvv}
                  onChange={(event) => setFormData((prev) => ({ ...prev, cvv: event.target.value }))}
                  placeholder="123"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF do titular</Label>
              <Input
                id="cpf"
                inputMode="numeric"
                value={formData.cpf}
                onChange={(event) => setFormData((prev) => ({ ...prev, cpf: event.target.value }))}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Os dados do cartao sao tokenizados com Mercado Pago. Nenhum dado sensivel e salvo no servidor Bacaxita.
            </p>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setRegisterOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-rasta-green hover:bg-rasta-green/90 text-white" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar cartao"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default WalletPage;
