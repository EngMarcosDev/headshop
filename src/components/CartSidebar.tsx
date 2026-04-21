import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, AlertCircle, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const CartSidebar = () => {
  const navigate = useNavigate();
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
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
      setCheckoutError("Adicione produtos a sacola.");
      return;
    }

    if (!user?.email) {
      window.dispatchEvent(new CustomEvent("bacaxita:login-popup", { detail: { force: true } }));
      return;
    }

    setCheckoutLoading(true);
    setIsOpen(false);
    navigate("/checkout");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} />

      <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border bg-header p-4">
          <div className="flex items-center gap-2 text-header-foreground">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-bold uppercase tracking-wide">Sacola</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-header-foreground hover:opacity-75">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="mb-2 font-medium text-foreground">Sua sacola esta vazia</p>
              <p className="text-sm text-muted-foreground">Adicione produtos para continuar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded border border-border/50 bg-muted/30 p-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-foreground">{item.name}</h4>
                    <p className="mt-1 text-sm font-bold text-accent">R$ {item.price.toFixed(2).replace(".", ",")}</p>

                    <div className="mt-2 flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-destructive/60 hover:text-destructive"
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

        {items.length > 0 && (
          <div className="space-y-3 border-t border-border bg-muted/20 p-4">
            {checkoutError && (
              <div className="flex gap-2 rounded border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total</span>
              <span className="text-lg font-bold text-accent">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
            </div>

            <Button
              className="w-full bg-rasta-green font-semibold text-white hover:bg-rasta-green/90"
              onClick={handleCheckout}
              disabled={checkoutLoading || items.length === 0}
            >
              {checkoutLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Indo para pagamento...
                </>
              ) : (
                "Finalizar Pedido"
              )}
            </Button>

            <button
              onClick={clearCart}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={checkoutLoading}
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
