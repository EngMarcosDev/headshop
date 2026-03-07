import { useEffect, useState, useMemo } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/priceFormatter";

/**
 * NORMALIZADOR DE ITENS
 * Garante que todos os items tenham tipos corretos e valores válidos
 */
const normalizeCartItem = (item: any) => ({
  id: Number(item.id) || 0,
  name: String(item.name || item.productName || "Produto sem nome").trim(),
  price: Number(item.price || item.unitPrice || item.value || 0),
  image: String(item.image || item.imageUrl || item.imageLink || "").trim(),
  quantity: Number(item.quantity || 1),
});

const CartSidebar = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalizar todos os items garantindo tipos corretos
  const normalizedItems = useMemo(() => {
    try {
      if (!Array.isArray(items)) return [];
      return items
        .map((item) => {
          try {
            return normalizeCartItem(item);
          } catch (e) {
            console.error("[CartSidebar] Erro ao normalizar item:", item, e);
            return null;
          }
        })
        .filter((item) => item !== null && item.id > 0);
    } catch (e) {
      console.error("[CartSidebar] Erro ao normalizar items", e);
      return [];
    }
  }, [items]);

  // Calcular total de forma segura
  const totalPrice = useMemo(() => {
    try {
      return normalizedItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        return sum + itemTotal;
      }, 0);
    } catch (e) {
      console.error("[CartSidebar] Erro ao calcular total", e);
      return 0;
    }
  }, [normalizedItems]);

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

    if (normalizedItems.length === 0) {
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
          items: normalizedItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      });

      if (!orderResponse.ok) {
        const errText = await orderResponse.text();
        throw new Error(`Erro ao criar pedido: ${errText}`);
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
          items: normalizedItems.map((item) => ({
            title: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      });

      if (!paymentResponse.ok) {
        const errText = await paymentResponse.text();
        throw new Error(`Erro ao gerar link: ${errText}`);
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
      console.error("[CartSidebar] Checkout error:", err);
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
          {normalizedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="font-medium text-foreground mb-2">Sua sacola está vazia</p>
              <p className="text-sm text-muted-foreground">
                Adicione produtos para continuar suas compras
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {normalizedItems.map((item) => (
                <div
                  key={`cart-item-${item.id}`}
                  className="flex gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 hover:border-accent/30 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted/60 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Product Info */}
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
                        disabled={isProcessing}
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
                        disabled={isProcessing}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-destructive/60 hover:text-destructive transition-colors p-1"
                        aria-label="Remover item"
                        disabled={isProcessing}
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
        {normalizedItems.length > 0 && (
          <div className="border-t border-border p-4 bg-muted/20 space-y-3">
            {error && (
              <div className="flex gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Subtotal - Debugging */}
            {normalizedItems.length > 0 && (
              <div className="text-xs text-muted-foreground/70 space-y-1">
                <p>
                  {normalizedItems.length} item(s) • Preço unit: {formatPrice(
                    normalizedItems[0].price,
                    { decimals: 2 }
                  )}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Total:</span>
              <span className="text-lg font-bold text-accent">
                {formatPrice(totalPrice, { decimals: 2 })}
              </span>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full bg-rasta-green hover:bg-rasta-green/90 text-white font-semibold disabled:opacity-50"
              onClick={handleCheckout}
              disabled={isProcessing || normalizedItems.length === 0}
            >
              {isProcessing ? "Processando..." : "Finalizar Pedido"}
            </Button>

            {/* Clear Cart Button */}
            <button
              onClick={() => {
                clearCart();
                setIsOpen(false);
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors disabled:opacity-50"
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
