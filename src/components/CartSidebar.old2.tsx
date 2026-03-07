import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, sanitizePrice, calculateTotal } from "@/lib/priceFormatter";

const CartSidebar = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    setError(null);

    if (items.length === 0) {
      setError("Sua sacola está vazia");
      return;
    }

    if (!user?.email) {
      // Trigger login popup
      window.dispatchEvent(
        new CustomEvent("bacaxita:login-popup", { detail: { force: true } })
      );
      return;
    }

    setIsProcessing(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050/api/headshop";

      // Create order
      const orderResponse = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          customer: {
            name: user.name || user.email.split("@")[0],
            email: user.email,
          },
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: sanitizePrice(item.price, 0),
          })),
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Erro ao criar pedido");
      }

      const order = await orderResponse.json();
      const orderId = order.id;

      if (!orderId) {
        throw new Error("Pedido sem ID");
      }

      // Get payment link
      const paymentResponse = await fetch(`${API_BASE}/payments/mercadopago/preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
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

      if (!paymentResponse.ok) {
        throw new Error("Erro ao gerar link de pagamento");
      }

      const pref = await paymentResponse.json();
      const checkoutUrl = pref.init_point || pref.sandbox_init_point;

      if (!checkoutUrl) {
        throw new Error("URL de pagamento não disponível");
      }

      // Open payment in new window
      window.open(checkoutUrl, "_blank");
      setIsOpen(false);
      clearCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar pedido";
      setError(message);
      console.error("Checkout error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Cart Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-header">
          <div className="flex items-center gap-2 text-header-foreground">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-display font-bold tracking-wider text-lg">SACOLA</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-header-foreground hover:opacity-75 transition-opacity"
            aria-label="Fechar sacola"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="font-medium text-foreground mb-2">Sua sacola está vazia</p>
              <p className="text-sm text-muted-foreground">
                Adicione produtos para continuar suas compras
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 hover:border-accent/30 transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {item.name}
                    </h3>
                    <p className="text-accent font-bold text-sm mt-1">
                      {formatPrice(item.price, { decimals: 2 })}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-background border border-border rounded hover:bg-muted transition-colors"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-background border border-border rounded hover:bg-muted transition-colors"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-destructive/60 hover:text-destructive transition-colors p-1"
                        aria-label="Remover item"
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
            {error && (
              <div className="flex gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Total:</span>
              <span className="text-lg font-bold text-accent">
                {formatPrice(calculateTotal(items), { decimals: 2 })}
              </span>
            </div>

            <Button
              className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold"
              onClick={handleCheckout}
              disabled={isProcessing || items.length === 0}
            >
              {isProcessing ? "Processando..." : "Finalizar Pedido"}
            </Button>

            <button
              onClick={() => {
                clearCart();
                setIsOpen(false);
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              disabled={isProcessing}
            >
              Limpar sacola
            </button>
          </div>
        )}

        {/* Rasta stripe accent */}
        <div className="h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
      </div>
    </>
  );
};

export default CartSidebar;
