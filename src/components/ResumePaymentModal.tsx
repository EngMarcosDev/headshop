import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";
import OrderSuccessPopup from "./OrderSuccessPopup";

interface ResumePaymentModalProps {
  orderId: number;
  orderNumber?: string;
  onClose: () => void;
}

interface PixData {
  orderId: number;
  qrCode: string;
  qrCodeBase64: string;
}

const PAID_STATUSES = new Set(["pago", "PAID", "APPROVED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);

const ResumePaymentModal = ({ orderId, orderNumber, onClose }: ResumePaymentModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pix, setPix] = useState<PixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState<{ id: number; number?: string } | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  // Gera o PIX para o pedido existente
  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (user?.token) headers.Authorization = `Bearer ${user.token}`;
        const response = await fetch(joinUrl(API_BASE, "/payments/mercadopago/pix"), {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ orderId, payerEmail: user?.email }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || "Não foi possível gerar o PIX para este pedido.");
        }
        if (cancelled) return;
        setPix({
          orderId: Number(payload.orderId || orderId),
          qrCode: String(payload.qrCode || ""),
          qrCodeBase64: String(payload.qrCodeBase64 || ""),
        });
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Falha ao gerar PIX.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void generate();
    return () => {
      cancelled = true;
    };
  }, [orderId, user?.token, user?.email]);

  // Polling do status
  useEffect(() => {
    if (!pix || paid || error) return;
    let cancelled = false;
    const tokenHeader: Record<string, string> = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

    const poll = async () => {
      try {
        const response = await fetch(
          joinUrl(API_BASE, `/orders/${pix.orderId}/status`),
          { headers: { Accept: "application/json", ...tokenHeader }, credentials: "include" }
        );
        if (response.status === 401 || response.status === 403) {
          setError("Sua sessão expirou. Entre novamente para acompanhar o pagamento.");
          cancelled = true;
          return;
        }
        if (!response.ok) return;
        const data = (await response.json().catch(() => null)) as
          | { id?: number; orderNumber?: string; status?: string; paymentStatus?: string; paidAt?: string | null }
          | null;
        if (!data || cancelled) return;
        const status = String(data.status || "").toUpperCase();
        const ps = String(data.paymentStatus || "").toUpperCase();
        if (PAID_STATUSES.has(status) || PAID_STATUSES.has(ps) || ps === "PAID" || ps === "APPROVED" || data.paidAt) {
          setPaid({ id: Number(data.id ?? pix.orderId), number: data.orderNumber });
        }
      } catch {
        /* tenta de novo no próximo tick */
      }
    };

    void poll();
    const interval = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pix, user?.token, paid, error]);

  const copyCode = async () => {
    if (!pix?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* se clipboard bloqueado, ignora silenciosamente */
    }
  };

  if (paid) {
    return (
      <OrderSuccessPopup
        orderId={paid.number || paid.id}
        onClose={() => {
          setPaid(null);
          onClose();
        }}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
        <div className="relative p-5">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="mb-1 text-center text-lg font-display font-bold tracking-wide">Retomar pagamento</h2>
          <p className="mb-4 text-center text-xs text-muted-foreground">
            Pedido <span className="font-semibold text-foreground">{orderNumber || `#${orderId}`}</span>
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader className="mb-3 h-6 w-6 animate-spin" />
              Gerando PIX...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : pix ? (
            <>
              {pix.qrCodeBase64 ? (
                <div className="mx-auto mb-3 w-fit rounded-xl border border-border/60 bg-white p-3">
                  <img
                    src={`data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code do PIX"
                    className="h-44 w-44 object-contain"
                  />
                </div>
              ) : null}

              <p className="mb-2 text-center text-xs text-muted-foreground">
                Aponte o app do seu banco ou cole o código abaixo:
              </p>

              <div className="mb-3 break-all rounded-lg border border-border bg-muted/30 p-2.5 text-[11px] font-mono leading-relaxed text-foreground">
                {pix.qrCode}
              </div>

              <Button
                type="button"
                onClick={copyCode}
                className="w-full bg-rasta-green text-white hover:bg-rasta-green/90"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Código copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código PIX
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Aguardando confirmação automática do pagamento...
              </p>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ResumePaymentModal;
