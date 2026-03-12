import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CreditCard, Plus, ShieldCheck, Trash2, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";

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

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      if (!user?.token) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(joinUrl(API_BASE, "/payments/mercadopago/wallet/cards"), {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          credentials: "include",
        });
        const payload = (await response.json().catch(() => null)) as WalletCardsResponse | { error?: string } | null;

        if (!response.ok) {
          throw new Error(payload && "error" in payload && payload.error ? payload.error : "Erro ao carregar carteira.");
        }

        setCards(Array.isArray(payload?.cards) ? payload.cards : []);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Erro ao carregar carteira.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [user?.token]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleDelete = async (cardId: string) => {
    if (!user?.token) return;
    setDeleting(cardId);
    setError(null);
    try {
      const response = await fetch(joinUrl(API_BASE, `/payments/mercadopago/wallet/cards/${cardId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
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

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:py-10">
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

        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
              Carregando carteira...
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <CreditCard className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Nenhum cartao salvo ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Os cartoes salvos na sua conta Mercado Pago aparecerao aqui automaticamente.
              </p>
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div
                  className={`flex h-8 w-12 items-center justify-center rounded-md text-[10px] font-bold tracking-wider text-white ${brandColors[card.brand]}`}
                >
                  {brandLabels[card.brand]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      **** **** **** {card.lastFour}
                    </span>
                    {card.isDefault ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        PADRAO
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.holderName} • Validade {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(card.id)}
                  disabled={deleting === card.id}
                  className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className={`h-4 w-4 ${deleting === card.id ? "animate-spin" : ""}`} />
                </Button>
              </div>
            ))
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/checkout")}
          className="mt-6 h-12 w-full border-2 border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar novo cartao
        </Button>
      </main>

      <Footer />
    </div>
  );
};

export default WalletPage;
