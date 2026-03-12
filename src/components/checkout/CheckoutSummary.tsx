import type { CartItem } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/priceFormatter";
import { ShoppingBag } from "lucide-react";

interface CheckoutSummaryProps {
  items: CartItem[];
  total: number;
}

const CheckoutSummary = ({ items, total }: CheckoutSummaryProps) => {
  return (
    <aside className="sticky top-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-accent" />
        <h3 className="font-display text-lg font-bold">Resumo do Pedido</h3>
      </div>

      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={`checkout-item-${item.id}`} className="flex items-center gap-3">
            <img
              src={item.image}
              alt={item.name}
              className="h-11 w-11 rounded-md border border-border object-cover"
              loading="lazy"
            />
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
          <span>{formatPrice(total, { decimals: 2 })}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Frete</span>
          <span className="font-medium text-accent">Gratis</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-accent">{formatPrice(total, { decimals: 2 })}</span>
        </div>
      </div>
    </aside>
  );
};

export default CheckoutSummary;
