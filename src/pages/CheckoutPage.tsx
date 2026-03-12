import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import PaymentMethodSelector, { type CheckoutMethod } from "@/components/checkout/PaymentMethodSelector";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";

const methodDescriptions: Record<CheckoutMethod, string> = {
  credit: "Voce sera redirecionado para o checkout do Mercado Pago e podera pagar no cartao de credito.",
  debit: "Voce sera redirecionado para o checkout do Mercado Pago e podera pagar no cartao de debito.",
  pix: "Voce sera redirecionado para o checkout do Mercado Pago e podera pagar via PIX.",
  boleto: "Voce sera redirecionado para o checkout do Mercado Pago e podera pagar via boleto.",
};

const normalizeCartItem = (item: any) => ({
  id: Number(item.id) || 0,
  name: String(item.name || "Produto sem nome").trim(),
  price: Number(item.price || 0),
  image: String(item.image || "").trim(),
  quantity: Number(item.quantity || 1),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<CheckoutMethod>("credit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixDiagnostic, setPixDiagnostic] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({
    checked: false,
    available: true,
  });

  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map(normalizeCartItem).filter((item) => item.id > 0 && item.quantity > 0);
  }, [items]);

  useEffect(() => {
    const loadPixDiagnostic = async () => {
      try {
        const response = await fetch(joinUrl(API_BASE, "/payments/mercadopago/pix/diagnostics"));
        const payload = (await response.json().catch(() => null)) as
          | { pixAvailableInAccount?: boolean; error?: string }
          | null;
        if (!response.ok) {
          setPixDiagnostic({
            checked: true,
            available: false,
            message: payload?.error || "Nao foi possivel validar PIX no Mercado Pago.",
          });
          return;
        }

        const available = Boolean(payload?.pixAvailableInAccount);
        setPixDiagnostic({
          checked: true,
          available,
          message: available ? undefined : "PIX nao apareceu como ativo na conta Mercado Pago.",
        });
      } catch {
        setPixDiagnostic({
          checked: true,
          available: false,
          message: "Falha ao validar disponibilidade de PIX.",
        });
      }
    };

    loadPixDiagnostic();
  }, []);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleStartMercadoPago = async () => {
    setError(null);

    if (normalizedItems.length === 0) {
      setError("Sua sacola esta vazia.");
      return;
    }

    if (!user?.email) {
      setError("Faca login para continuar.");
      return;
    }

    setIsProcessing(true);

    try {
      const authHeader = user.token ? { Authorization: `Bearer ${user.token}` } : {};
      const orderResponse = await fetch(joinUrl(API_BASE, "/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          customer: {
            name: user.name || user.email.split("@")[0],
            email: user.email,
          },
          items: normalizedItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      });

      if (!orderResponse.ok) {
        const body = await orderResponse.text();
        throw new Error(`Erro ao criar pedido: ${body}`);
      }

      const orderPayload = await orderResponse.json();
      const orderId = orderPayload?.id;

      if (!orderId) {
        throw new Error("Pedido sem ID para iniciar pagamento.");
      }

      const preferenceResponse = await fetch(joinUrl(API_BASE, "/payments/mercadopago/preference"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          payerEmail: user.email,
          items: normalizedItems.map((item) => ({
            title: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      });

      if (!preferenceResponse.ok) {
        const body = await preferenceResponse.text();
        throw new Error(`Erro ao gerar checkout: ${body}`);
      }

      const preferencePayload = await preferenceResponse.json();
      const checkoutUrl = preferencePayload?.init_point || preferencePayload?.sandbox_init_point;

      if (!checkoutUrl) {
        throw new Error("URL de pagamento indisponivel.");
      }

      clearCart();
      window.location.href = checkoutUrl;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Nao foi possivel iniciar o pagamento.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Finalizar Pagamento</h1>
          <Link
            to="/carteira"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted/40"
          >
            <Wallet className="h-4 w-4 text-accent" />
            Minha Carteira
          </Link>
        </div>

        {normalizedItems.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="mb-4 text-muted-foreground">Sua sacola esta vazia.</p>
            <Button onClick={() => navigate("/")}>Voltar as compras</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <section className="space-y-5 lg:col-span-3">
              <PaymentMethodSelector selected={selectedMethod} onSelect={setSelectedMethod} />

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{methodDescriptions[selectedMethod]}</p>
              </div>

              {selectedMethod === "pix" && pixDiagnostic.checked && !pixDiagnostic.available ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{pixDiagnostic.message || "PIX indisponivel no momento."}</span>
                </div>
              ) : null}

              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button
                onClick={handleStartMercadoPago}
                disabled={isProcessing}
                className="h-12 w-full bg-rasta-green text-white hover:bg-rasta-green/90"
              >
                {isProcessing ? "Iniciando checkout..." : "Continuar no Mercado Pago"}
              </Button>
            </section>

            <div className="lg:col-span-2">
              <CheckoutSummary items={normalizedItems} total={totalPrice} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
