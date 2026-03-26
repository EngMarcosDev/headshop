import { X } from "lucide-react";
import { CONTACT_WHATSAPP_URL } from "@/lib/socialLinks";
import { Button } from "./ui/button";

const ORDER_SUCCESS_IMAGE = "/assets/branding/bacaxito-pedido-ok.png";

interface OrderSuccessPopupProps {
  orderId: number | string;
  onClose: () => void;
}

const OrderSuccessPopup = ({ orderId, onClose }: OrderSuccessPopupProps) => {
  const handleTrack = () => {
    const message = encodeURIComponent(`Ola, solicito o rastreio do meu pedido de numero: ${orderId}`);
    window.open(`${CONTACT_WHATSAPP_URL}?text=${message}`, "_blank");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 animate-in fade-in bg-black/70 backdrop-blur-sm duration-300"
        onClick={onClose}
      />

      <div className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="h-1.5 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />

        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="mb-4 text-center text-2xl font-display font-bold tracking-wider text-foreground">
            Pedido realizado!
          </h2>

          <div className="mb-4 overflow-hidden rounded-xl border border-border/60 bg-muted/30">
            <img
              src={ORDER_SUCCESS_IMAGE}
              alt="Pedido realizado com sucesso"
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>

          <p className="mb-4 text-center text-sm text-muted-foreground">
            Numero do pedido: <span className="font-semibold text-foreground">{orderId}</span>
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={handleTrack}
              className="w-full bg-rasta-green font-semibold text-white hover:bg-rasta-green/90"
            >
              Rastrear pedido
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full border-border hover:bg-muted"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccessPopup;
