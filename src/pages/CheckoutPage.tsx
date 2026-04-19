import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Copy, Tag, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import PaymentMethodSelector, { type CheckoutMethod } from "@/components/checkout/PaymentMethodSelector";
import OrderSuccessPopup from "@/components/OrderSuccessPopup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";
import { formatPrice } from "@/lib/priceFormatter";
import { notifyAbacaxiError } from "@/lib/abacaxiTI";

// Status transitions handled by the Mercado Pago webhook (server-side). The PIX
// polling loop below just watches these to decide when to celebrate.
const PAID_ORDER_STATUSES = new Set(["PAID", "CONFIRMED", "SHIPPED", "DELIVERED"]);
const CANCELLED_ORDER_STATUSES = new Set(["CANCELLED", "CANCELADO", "REFUNDED"]);

const BRAND_ICON = "/assets/branding/pineapple-icon.png";

const methodDescriptions: Record<CheckoutMethod, string> = {
  credit: "Voce sera redirecionado para o checkout do Mercado Pago e podera pagar no cartao de credito.",
  debit: "Voce sera redirecionado para o checkout do Mercado Pago e podera pagar no cartao de debito.",
  pix: "O PIX sera gerado aqui mesmo com QR Code e codigo copia e cola.",
  boleto: "Voce sera redirecionado para o checkout do Mercado Pago e podera pagar via boleto.",
};

const normalizeCartItem = (item: any) => ({
  id: Number(item.id) || 0,
  name: String(item.name || "Produto sem nome").trim(),
  price: Number(item.price || 0),
  image: String(item.image || "").trim(),
  quantity: Number(item.quantity || 1),
});

type PixPayload = {
  orderId: number;
  paymentId: string;
  amount: number;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt?: string | null;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: {
    error?: string;
    message?: string;
    cause?: Array<{ description?: string; code?: string; message?: string }>;
  } | null;
} | null;

type CheckoutSnapshot = {
  items: ReturnType<typeof normalizeCartItem>[];
  total: number;
};

const extractApiErrorMessage = (payload: ApiErrorPayload, fallback: string) => {
  const causes = Array.isArray(payload?.details?.cause)
    ? payload.details?.cause
        .map((item) => String(item?.description || item?.message || item?.code || "").trim())
        .filter(Boolean)
    : [];

  return (
    causes[0] ||
    String(payload?.details?.message || payload?.details?.error || payload?.message || payload?.error || "").trim() ||
    fallback
  );
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<CheckoutMethod>("credit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixPayment, setPixPayment] = useState<PixPayload | null>(null);
  const [pixNow, setPixNow] = useState(() => Date.now());
  const [pixDiagnostic, setPixDiagnostic] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({
    checked: false,
    available: true,
  });
  const [orderSnapshot, setOrderSnapshot] = useState<CheckoutSnapshot | null>(null);
  // Holds the order ID + number to show the success popup after PIX confirmation
  // (or after a manual QR scan returns to the page).
  const [paidOrder, setPaidOrder] = useState<{ id: number; number?: string } | null>(null);
  const [pixCancelled, setPixCancelled] = useState(false);

  // Cupom
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string | null;
  } | null>(null);

  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map(normalizeCartItem).filter((item) => item.id > 0 && item.quantity > 0);
  }, [items]);

  const checkoutItems = normalizedItems.length > 0 ? normalizedItems : orderSnapshot?.items ?? [];
  const checkoutSubtotal =
    normalizedItems.length > 0
      ? totalPrice
      : orderSnapshot?.total ?? checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const checkoutTotal = Math.max(0, checkoutSubtotal - couponDiscount);

  const handleValidateCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await fetch(joinUrl(API_BASE, "/coupons/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: checkoutSubtotal }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setCouponError(data?.error || "Cupom inválido.");
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
        description: data.description,
      });
      setCouponInput("");
    } catch {
      setCouponError("Erro ao validar cupom. Tente novamente.");
    } finally {
      setCouponLoading(false);
    }
  };

  const pixExpiresAtMs = useMemo(() => {
    if (!pixPayment?.expiresAt) return null;
    const value = new Date(pixPayment.expiresAt).getTime();
    return Number.isFinite(value) ? value : null;
  }, [pixPayment?.expiresAt]);

  const pixRemainingMs = pixExpiresAtMs != null ? Math.max(pixExpiresAtMs - pixNow, 0) : null;
  const pixExpired = pixRemainingMs != null && pixRemainingMs <= 0;

  const formattedPixCountdown = useMemo(() => {
    if (pixRemainingMs == null) return "";
    const totalSeconds = Math.max(Math.floor(pixRemainingMs / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [pixRemainingMs]);

  useEffect(() => {
    if (!pixPayment?.expiresAt) return;
    setPixNow(Date.now());
    const timer = window.setInterval(() => setPixNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pixPayment?.expiresAt]);

  // Poll the backend for order status while a PIX QR code is outstanding. The
  // webhook flips paymentStatus → APPROVED; we show the success popup as soon as
  // that happens. Poll stops on payment, cancellation, QR expiration, or unmount.
  useEffect(() => {
    if (!pixPayment?.orderId || paidOrder) return;
    let cancelled = false;

    const tokenHeader = (() => {
      if (typeof window === "undefined") return {} as Record<string, string>;
      const token = window.localStorage.getItem("bacaxita:token") || "";
      return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
    })();

    const poll = async () => {
      try {
        const response = await fetch(
          joinUrl(API_BASE, `/orders/${pixPayment.orderId}/status`),
          { headers: { Accept: "application/json", ...tokenHeader }, credentials: "include" }
        );
        if (!response.ok) return;
        const payload = (await response.json().catch(() => null)) as
          | { id?: number; orderNumber?: string; status?: string; paymentStatus?: string; paidAt?: string | null }
          | null;
        if (!payload || cancelled) return;

        const status = String(payload.status || "").toUpperCase();
        const paymentStatus = String(payload.paymentStatus || "").toUpperCase();

        if (PAID_ORDER_STATUSES.has(status) || PAID_ORDER_STATUSES.has(paymentStatus) || paymentStatus === "APPROVED" || paymentStatus === "PAID" || payload.paidAt) {
          setPaidOrder({ id: Number(payload.id ?? pixPayment.orderId), number: payload.orderNumber });
          return;
        }

        if (CANCELLED_ORDER_STATUSES.has(status)) {
          setPixCancelled(true);
        }
      } catch {
        // Swallow errors — next tick will retry.
      }
    };

    void poll();
    const interval = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pixPayment?.orderId, paidOrder]);

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

  const handleStartPayment = async () => {
    setError(null);
    const activeItems = normalizedItems.length > 0 ? normalizedItems : orderSnapshot?.items ?? [];
    const activeTotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (activeItems.length === 0) {
      setError("Sua sacola esta vazia.");
      notifyAbacaxiError({ message: "Sua sacola esta vazia. Adicione itens para continuar." });
      return;
    }

    if (!user?.email) {
      setError("Faca login para continuar.");
      notifyAbacaxiError({ message: "Para finalizar, voce precisa entrar com sua conta." });
      window.dispatchEvent(new CustomEvent("bacaxita:login-popup", { detail: { mode: "login" } }));
      return;
    }

    if (selectedMethod === "pix" && pixDiagnostic.checked && !pixDiagnostic.available) {
      setError(pixDiagnostic.message || "PIX indisponivel no momento.");
      notifyAbacaxiError({
        message: pixDiagnostic.message || "O PIX esta temporariamente indisponivel. Tente novamente em instantes.",
      });
      return;
    }

    setOrderSnapshot({ items: activeItems, total: activeTotal });
    setIsProcessing(true);
    setPixNow(Date.now());

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
          items: activeItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          couponCode: appliedCoupon?.code ?? null,
        }),
      });

      if (!orderResponse.ok) {
        const body = await orderResponse.text();
        throw new Error(`Erro ao criar pedido: ${body}`);
      }

      const orderPayload = await orderResponse.json();
      const orderId = Number(orderPayload?.id);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        throw new Error("Pedido sem ID para iniciar pagamento.");
      }

      if (selectedMethod === "pix") {
        const pixResponse = await fetch(joinUrl(API_BASE, "/payments/mercadopago/pix"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          credentials: "include",
          body: JSON.stringify({
            orderId,
            payerEmail: user.email,
          }),
        });

        const pixPayload = (await pixResponse.json().catch(() => null)) as PixPayload | ApiErrorPayload;
        if (!pixResponse.ok) {
          throw new Error(extractApiErrorMessage(pixPayload as ApiErrorPayload, "Nao foi possivel gerar PIX."));
        }

        if (!pixPayload?.qrCode || !pixPayload?.qrCodeBase64) {
          throw new Error("PIX gerado sem QR Code.");
        }

        clearCart();
        setPixPayment(pixPayload as PixPayload);
        return;
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
          items: activeItems.map((item) => ({
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
      notifyAbacaxiError({ message });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixPayment?.qrCode || pixExpired) return;
    try {
      await navigator.clipboard.writeText(pixPayment.qrCode);
    } catch {
      setError("Nao foi possivel copiar o codigo PIX.");
      notifyAbacaxiError({ message: "Nao conseguimos copiar o codigo PIX agora. Tente novamente." });
    }
  };

  const pixDisabled = selectedMethod === "pix" && pixDiagnostic.checked && !pixDiagnostic.available;

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <button
          type="button"
          onClick={() => {
            const state = typeof window !== "undefined" ? (window.history.state as { idx?: number } | null) : null;
            if ((state?.idx ?? 0) > 0) navigate(-1);
            else navigate("/");
          }}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Finalizar Pagamento</h1>
        </div>

        {checkoutItems.length === 0 && !pixPayment ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="mb-4 text-muted-foreground">Sua sacola esta vazia.</p>
            <Button onClick={() => navigate("/")}>Voltar as compras</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-5">
              <PaymentMethodSelector selected={selectedMethod} onSelect={setSelectedMethod} />

              <div className="rounded-[24px] border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{methodDescriptions[selectedMethod]}</p>
              </div>

              {selectedMethod === "pix" ? (
                <div className="rounded-[24px] border border-amber-500/30 bg-gradient-to-br from-amber-500/14 to-amber-200/10 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-white/60">
                      <img src={BRAND_ICON} alt="Icone Bacaxita" className="h-7 w-7 object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 sm:text-base">
                        Faltam so alguns passos para finalizar seu pedido.
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-700 sm:text-sm">
                        Gere o QR Code, conclua o pagamento no app do banco e aguarde a confirmacao automatica.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedMethod === "pix" && pixDiagnostic.checked && !pixDiagnostic.available ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{pixDiagnostic.message || "PIX indisponivel no momento."}</span>
                </div>
              ) : null}

              {selectedMethod === "pix" && pixPayment ? (
                <div className="space-y-4 rounded-[24px] border border-border bg-card p-5">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
                      <img src={BRAND_ICON} alt="PIX Bacaxita" className="h-7 w-7 object-contain" />
                    </div>
                    <div>
                      <p className="font-semibold">PIX gerado com sucesso</p>
                      <p className="text-xs text-muted-foreground">Use o abacaxi como sinal visual do seu pagamento.</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="h-auto w-full max-w-[260px] rounded-2xl border border-border bg-white p-2 shadow-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      Valor:{" "}
                        <span className="font-semibold text-foreground">
                        {formatPrice(pixPayment.amount || checkoutTotal, { decimals: 2 })}
                      </span>
                    </p>
                    {pixPayment.expiresAt ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Expira em: {new Date(pixPayment.expiresAt).toLocaleString("pt-BR")}
                        </p>
                        <p className={`text-xs font-semibold ${pixExpired ? "text-destructive" : "text-accent"}`}>
                          {pixExpired ? "QR Code expirado" : `Tempo restante: ${formattedPixCountdown}`}
                        </p>
                      </>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 p-3">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Codigo copia e cola</p>
                    <p className="break-all text-xs text-foreground">{pixPayment.qrCode}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={copyPixCode}
                      disabled={pixExpired}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar codigo PIX
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Campo de cupom */}
              {!pixPayment ? (
                <div className="rounded-[24px] border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-accent" />
                    <span className="font-semibold text-sm">Cupom de desconto</span>
                  </div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-2">
                      <div>
                        <p className="text-sm font-semibold text-green-700">{appliedCoupon.code}</p>
                        {appliedCoupon.description ? (
                          <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                        ) : null}
                        <p className="text-xs text-green-600">
                          - {appliedCoupon.discountAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} aplicado
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponError(null); }}
                        className="text-green-500 hover:text-green-700"
                        aria-label="Remover cupom"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código do cupom"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleValidateCoupon(); }}
                        className="uppercase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!couponInput.trim() || couponLoading}
                        onClick={() => void handleValidateCoupon()}
                      >
                        {couponLoading ? "..." : "Aplicar"}
                      </Button>
                    </div>
                  )}
                  {couponError ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {couponError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button
                onClick={handleStartPayment}
                disabled={isProcessing || pixDisabled || checkoutItems.length === 0}
                className="h-12 w-full bg-rasta-green text-white hover:bg-rasta-green/90"
              >
                {isProcessing
                  ? "Processando..."
                  : selectedMethod === "pix"
                    ? pixPayment
                      ? pixExpired
                        ? "Gerar novo QR PIX"
                        : "Regerar QR PIX"
                      : "Gerar PIX"
                    : "Continuar no Mercado Pago"}
              </Button>
            </section>

            <div>
              <CheckoutSummary
                items={checkoutItems}
                total={checkoutTotal}
                discount={couponDiscount}
                couponCode={appliedCoupon?.code}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />

      {paidOrder ? (
        <OrderSuccessPopup
          orderId={paidOrder.number || paidOrder.id}
          onClose={() => {
            setPaidOrder(null);
            setPixPayment(null);
            navigate("/historico");
          }}
        />
      ) : null}

      {/* Popup de cancelamento por inatividade do pagamento PIX */}
      {pixCancelled && !paidOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl text-center space-y-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Pedido cancelado</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O pagamento não foi confirmado dentro do prazo e o pedido foi cancelado automaticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPixCancelled(false);
                  setPixPayment(null);
                  navigate("/");
                }}
              >
                Voltar à loja
              </Button>
              <Button
                className="flex-1 bg-rasta-green text-white hover:bg-rasta-green/90"
                onClick={() => {
                  setPixCancelled(false);
                  setPixPayment(null);
                }}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CheckoutPage;
