import { CreditCard, Landmark, Smartphone } from "lucide-react";
import type { ElementType } from "react";

// Boleto foi retirado a pedido do usuario - deixamos apenas PIX, debito e
// credito (os que ja estao validados no Mercado Pago). O type mantem
// "boleto" como opcao do lado do servidor por compat, mas a UI nao oferece
// mais essa escolha.
export type CheckoutMethod = "credit" | "debit" | "pix" | "boleto";

interface PaymentMethodSelectorProps {
  selected: CheckoutMethod;
  onSelect: (method: CheckoutMethod) => void;
}

const methods: Array<{
  id: Exclude<CheckoutMethod, "boleto">;
  label: string;
  description: string;
  icon: ElementType;
}> = [
  { id: "pix", label: "PIX", description: "QR Code gerado nesta tela", icon: Smartphone },
  { id: "credit", label: "Credito", description: "Parcelamento no checkout MP", icon: CreditCard },
  { id: "debit", label: "Debito", description: "Pagamento online", icon: Landmark },
];

const PaymentMethodSelector = ({ selected, onSelect }: PaymentMethodSelectorProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {methods.map((method) => {
        const isActive = selected === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
              isActive
                ? "border-accent bg-accent/10 shadow-sm"
                : "border-border bg-card hover:border-muted-foreground/30"
            }`}
          >
            <method.icon className={`h-5 w-5 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
            <span className={`text-sm font-semibold ${isActive ? "text-accent" : "text-foreground"}`}>
              {method.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{method.description}</span>
            {isActive ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" /> : null}
          </button>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
