import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import pineappleIcon from "@/assets/pineapple-icon.png";

type PopupState = {
  open: boolean;
  title: string;
  message: string;
};

const DEFAULT_STATE: PopupState = {
  open: false,
  title: "AbacaxiTI em acao",
  message: "",
};

const FALLBACK_MESSAGE =
  "Encontramos um erro inesperado. Atualize a pagina e tente novamente. Se continuar, fale com nosso suporte.";

const AbacaxiTI = () => {
  const [state, setState] = useState<PopupState>(DEFAULT_STATE);
  const lastEventAtRef = useRef(0);

  useEffect(() => {
    const openPopup = (payload: { title?: string; message?: string }) => {
      const now = Date.now();
      if (now - lastEventAtRef.current < 1200) return;
      lastEventAtRef.current = now;

      setState({
        open: true,
        title: payload.title?.trim() || "AbacaxiTI em acao",
        message: payload.message?.trim() || FALLBACK_MESSAGE,
      });
    };

    const customHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; message?: string }>).detail || {};
      openPopup(detail);
    };

    const errorHandler = () => {
      openPopup({
        title: "AbacaxiTI detectou um problema",
        message: FALLBACK_MESSAGE,
      });
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = String((event.reason as any)?.message || event.reason || "").trim();
      openPopup({
        title: "AbacaxiTI detectou um problema",
        message: reason || FALLBACK_MESSAGE,
      });
    };

    window.addEventListener("bacaxita:error", customHandler as EventListener);
    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    return () => {
      window.removeEventListener("bacaxita:error", customHandler as EventListener);
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  return (
    <Dialog open={state.open} onOpenChange={(open) => setState((previous) => ({ ...previous, open }))}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <img src={pineappleIcon} alt="AbacaxiTI" className="h-7 w-7 rounded-full object-cover" />
            {state.title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">{state.message}</p>
        <div className="mt-2 flex justify-end">
          <Button type="button" onClick={() => setState((previous) => ({ ...previous, open: false }))}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbacaxiTI;
