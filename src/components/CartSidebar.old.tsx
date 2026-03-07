import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, AlertCircle, Loader } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";
import PaymentPopup from "./PaymentPopup";

const CartSidebar = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentInitPoint, setPaymentInitPoint] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<number | string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleCheckout = async () => {
    setCheckoutError(null);
    
    if (items.length === 0) {
      setCheckoutError("Adicione produtos à sacola");
      return;
    }

    if (!user?.email) {
      window.dispatchEvent(
        new CustomEvent("bacaxita:login-popup", { detail: { force: true } })
      );
      return;
    }

    setCheckoutLoading(true);

    try {
      const displayName = user?.name?.trim() || user.email.split("@")[0];
      const orderPayload = {
        customer: {
          name: displayName || "Cliente",
          email: user.email,
        },
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };

      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      };

      // Create order
      const response = await fetch(joinUrl(API_BASE, "/orders"), {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro ao criar pedido" }));
        throw new Error(errorData?.error || "Falha ao registrar pedido");
      }

      const order = await response.json();
      const orderId = order?.id ?? order?.orderId;
      
      if (!orderId) {
        throw new Error("Pedido sem ID retornado");
      }

      // Get payment preference
      const prefResponse = await fetch(joinUrl(API_BASE, "/payments/mercadopago/preference"), {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify({
          orderId,
          payerEmail: user.email,
          items: items.map((item) => ({
            title: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      });

      if (!prefResponse.ok) {
        const errorData = await prefResponse.json().catch(() => ({ error: "Erro ao iniciar pagamento" }));
        throw new Error(errorData?.error || "Falha ao iniciar pagamento");
      }

      const pref = await prefResponse.json();
      const initPoint = pref?.init_point || pref?.sandbox_init_point;

      if (!initPoint) {
        throw new Error("Link de pagamento indisponível");
      }

      // Try to open in new window
      const paymentWindow = window.open(initPoint, "_blank", "noopener,noreferrer");
      if (paymentWindow) {
        setIsOpen(false);
        setCheckoutLoading(false);
        return;
      }

      // Fallback to popup
      setPaymentInitPoint(initPoint);
      setPaymentOrderId(orderId);
      setIsOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao processar pedido";
      setCheckoutError(message);
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isOpen && !paymentInitPoint) return null;

  return (
    <>
      {paymentInitPoint && paymentOrderId && (
        <PaymentPopup
          initPoint={paymentInitPoint}
          orderId={paymentOrderId}
          onClose={() => setPaymentInitPoint(null)}
        />
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card z-50 shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-header">
              <div className="flex items-center gap-2 text-header-foreground">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wide">Sacola</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-header-foreground hover:opacity-75"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="font-medium text-foreground mb-2">Sua sacola está vazia</p>
                  <p className="text-sm text-muted-foreground">Adicione produtos para continuar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-muted/30 rounded border border-border/50"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </h4>
                        <p className="text-accent font-bold text-sm mt-1">
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </p>

                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="w-6 h-6 flex items-center justify-center bg-background border border-border rounded hover:bg-muted"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-background border border-border rounded hover:bg-muted"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-destructive/60 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-4 bg-muted/20 space-y-3">
                {checkoutError && (
                  <div className="flex gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium">Total</span>
                  <span className="text-lg font-bold text-accent">
                    R$ {totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>

                <Button
                  className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || items.length === 0}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Finalizar Pedido"
                  )}
                </Button>

                <button
                  onClick={clearCart}
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-2"
                  disabled={checkoutLoading}
                >
                  Limpar sacola
                </button>
              </div>
            )}

            <div className="h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
          </div>
        </>
      )}
    </>
  );
};

export default CartSidebar;
