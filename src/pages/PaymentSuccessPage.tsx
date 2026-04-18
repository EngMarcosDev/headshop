import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderSuccessPopup from "@/components/OrderSuccessPopup";
import PineappleLoader from "@/components/PineappleLoader";
import { useCart } from "@/contexts/CartContext";
import { API_BASE, joinUrl } from "@/api/client";

// Mercado Pago redirects here after card/boleto checkout. It passes back several
// query parameters — `external_reference` holds our internal order ID, so we use
// that to fetch the friendly order number for the success popup.
const MP_ORDER_ID_PARAMS = ["orderId", "external_reference", "preference_id"] as const;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const [orderLabel, setOrderLabel] = useState<string | null>(null);
  const [orderResolved, setOrderResolved] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let rawId: string | null = null;
    for (const key of MP_ORDER_ID_PARAMS) {
      const value = params.get(key);
      if (value && value.trim()) {
        rawId = value.trim();
        break;
      }
    }

    clearCart();

    if (!rawId) {
      setOrderResolved(true);
      return;
    }

    const numericId = Number(rawId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setOrderLabel(rawId);
      setOrderResolved(true);
      return;
    }

    let cancelled = false;

    const fetchFriendlyNumber = async () => {
      try {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("bacaxita:token") || "" : "";
        const response = await fetch(joinUrl(API_BASE, `/orders/${numericId}/status`), {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (cancelled) return;
        if (response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { orderNumber?: string; id?: number }
            | null;
          if (!cancelled) {
            setOrderLabel(payload?.orderNumber || String(payload?.id || numericId));
          }
        } else {
          if (!cancelled) setOrderLabel(String(numericId));
        }
      } catch {
        if (!cancelled) setOrderLabel(String(numericId));
      } finally {
        if (!cancelled) setOrderResolved(true);
      }
    };

    void fetchFriendlyNumber();
    return () => {
      cancelled = true;
    };
  }, [location.search, clearCart]);

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          {orderResolved && !orderLabel ? (
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-card px-6 py-8 shadow-sm">
              <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Pagamento recebido</h1>
              <p className="text-sm">
                Se voce veio do Mercado Pago, seu pedido ja foi registrado. Confira em seu historico.
              </p>
              <button
                type="button"
                onClick={() => navigate("/historico")}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-rasta-green px-4 py-2 text-sm font-semibold text-white hover:bg-rasta-green/90"
              >
                Ver historico
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <PineappleLoader />
              <p>Finalizando pagamento...</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {orderLabel ? (
        <OrderSuccessPopup
          orderId={orderLabel}
          onClose={() => {
            setOrderLabel(null);
            navigate("/historico");
          }}
        />
      ) : null}
    </div>
  );
};

export default PaymentSuccessPage;
