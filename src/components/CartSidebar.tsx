import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/priceFormatter";

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

  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        try {
          return normalizeCartItem(item);
        } catch {
          return null;
        }
      })
      .filter((item) => item !== null && item.id > 0);
  }, [items]);

  const totalPrice = useMemo(
    () => normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [normalizedItems]
  );

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
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleCheckout = async () => {
    setError(null);

    if (normalizedItems.length === 0) {
      setError("Sua sacola esta vazia");
      return;
    }

    if (!user?.email) {
      window.dispatchEvent(new CustomEvent("bacaxita:login-popup", { detail: { force: true } }));
      return;
    }

    setIsProcessing(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5050/api/headshop";

      const orderResponse = await fetch(`${apiBase}/orders`, {
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
      if (!orderId) throw new Error("Pedido sem ID");

      const paymentResponse = await fetch(`${apiBase}/payments/mercadopago/preference`, {
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

      const preference = await paymentResponse.json();
      const checkoutUrl = preference.init_point || preference.sandbox_init_point;
      if (!checkoutUrl) throw new Error("URL de pagamento indisponivel");

      window.open(checkoutUrl, "_blank");
      setIsOpen(false);
      clearCart();
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Erro ao processar pedido";
      setError(message);
      console.error("[CartSidebar] Checkout error:", checkoutError);
    } finally {
      setIsProcessing(false);
    }
  };

  const goToCheckoutPage = () => {
    setIsOpen(false);
    window.location.href = "/checkout";
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-header p-4">
          <div className="flex items-center gap-2 text-header-foreground">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold tracking-wider">SACOLA</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-header-foreground transition-opacity hover:opacity-75"
            aria-label="Fechar sacola"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {normalizedItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/20" />
              <p className="mb-2 font-medium text-foreground">Sua sacola esta vazia</p>
              <p className="text-sm text-muted-foreground">Adicione produtos para continuar suas compras</p>
            </div>
          ) : (
            <div className="space-y-3">
              {normalizedItems.map((item) => (
                <div
                  key={`cart-item-${item.id}`}
                  className="flex gap-3 rounded-lg border border-border/50 bg-muted/40 p-3 transition-colors hover:border-accent/30"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-foreground">{item.name}</h3>
                    <p className="mt-1 text-sm font-bold text-accent">{formatPrice(item.price, { decimals: 2 })}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background transition-colors hover:bg-muted"
                        aria-label="Diminuir quantidade"
                        disabled={isProcessing}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background transition-colors hover:bg-muted"
                        aria-label="Aumentar quantidade"
                        disabled={isProcessing}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-1 text-destructive/60 transition-colors hover:text-destructive"
                        aria-label="Remover item"
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {normalizedItems.length > 0 && (
          <div className="space-y-3 border-t border-border bg-muted/20 p-4">
            {error ? (
              <div className="flex gap-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total:</span>
              <span className="text-lg font-bold text-accent">{formatPrice(totalPrice, { decimals: 2 })}</span>
            </div>

            <Button
              className="w-full bg-rasta-green font-semibold text-white hover:bg-rasta-green/90 disabled:opacity-50"
              onClick={handleCheckout}
              disabled={isProcessing || normalizedItems.length === 0}
            >
              {isProcessing ? "Processando..." : "Finalizar Pedido"}
            </Button>

            <Button
              variant="outline"
              onClick={goToCheckoutPage}
              disabled={isProcessing || normalizedItems.length === 0}
              className="w-full"
            >
              Escolher forma de pagamento
            </Button>

            <button
              onClick={() => {
                clearCart();
                setIsOpen(false);
              }}
              className="w-full py-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              disabled={isProcessing}
            >
              Limpar sacola
            </button>
          </div>
        )}

        <div className="h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
      </div>
    </>
  );
};

export default CartSidebar;
