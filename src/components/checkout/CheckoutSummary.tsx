import type { CartItem } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/priceFormatter";
import { ShoppingBag } from "lucide-react";

interface CheckoutSummaryProps {
  items: CartItem[];
  total: number;
  discount?: number;
  couponCode?: string | null;
}

const CheckoutSummary = ({ items, total, discount = 0, couponCode }: CheckoutSummaryProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = discount > 0 ? Math.max(0, subtotal - discount) : total;

  return (
    <aside className="rounded-[24px] border border-border bg-card p-5 xl:sticky xl:top-6">
      <div className="mb-4 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-accent" />
        <h3 className="font-display text-lg font-bold">Resumo do Pedido</h3>
      </div>

      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={`checkout-item-${item.id}`} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/35 p-1.5">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity}x {formatPrice(item.price, { decimals: 2 })}
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatPrice(item.price * item.quantity, { decimals: 2 })}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal, { decimals: 2 })}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Frete</span>
          <span className="font-medium text-accent">Grátis</span>
        </div>
        {discount > 0 && couponCode ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600">Cupom {couponCode}</span>
            <span className="font-medium text-green-600">- {formatPrice(discount, { decimals: 2 })}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-accent dark:text-white">{formatPrice(finalTotal, { decimals: 2 })}</span>
        </div>
      </div>
    </aside>
  );
};

export default CheckoutSummary;
