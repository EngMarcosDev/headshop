import { CreditCard, FileText, Landmark, Smartphone } from "lucide-react";
import type { ElementType } from "react";

export type CheckoutMethod = "credit" | "debit" | "pix" | "boleto";

interface PaymentMethodSelectorProps {
  selected: CheckoutMethod;
  onSelect: (method: CheckoutMethod) => void;
}

const methods: Array<{
  id: CheckoutMethod;
  label: string;
  description: string;
  icon: ElementType;
}> = [
  { id: "credit", label: "Credito", description: "Parcelamento no checkout MP", icon: CreditCard },
  { id: "debit", label: "Debito", description: "Pagamento online", icon: Landmark },
  { id: "pix", label: "PIX", description: "QR Code gerado nesta tela", icon: Smartphone },
  { id: "boleto", label: "Boleto", description: "Pagamento em ate 3 dias", icon: FileText },
];

const PaymentMethodSelector = ({ selected, onSelect }: PaymentMethodSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
