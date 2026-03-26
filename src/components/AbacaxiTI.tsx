import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BRAND_ICON = "/assets/branding/pineapple-icon.png";

type PopupState = {
  open: boolean;
  title: string;
  message: string;
  level: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  iconKey: string;
};

const DEFAULT_STATE: PopupState = {
  open: false,
  title: "AbacaxiTI em acao",
  message: "",
  level: "INFO",
  iconKey: "icon_padrao",
};

const FALLBACK_MESSAGE =
  "Encontramos um erro inesperado. Atualize a pagina e tente novamente. Se continuar, fale com nosso suporte.";

const levelLabel: Record<PopupState["level"], string> = {
  INFO: "Info",
  SUCCESS: "Sucesso",
  WARNING: "Aviso",
  ERROR: "Erro",
};

const levelBadgeClass: Record<PopupState["level"], string> = {
  INFO: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-emerald-100 text-emerald-800",
  WARNING: "bg-amber-100 text-amber-900",
  ERROR: "bg-red-100 text-red-800",
};

const resolveIconUrl = (iconKey: string) => {
  if (!iconKey?.trim()) return BRAND_ICON;
  return `/assets/status-icons/${iconKey.trim()}.png`;
};

const AbacaxiTI = () => {
  const [state, setState] = useState<PopupState>(DEFAULT_STATE);
  const lastEventAtRef = useRef(0);

  useEffect(() => {
    const openPopup = (payload: {
      title?: string;
      message?: string;
      level?: PopupState["level"];
      iconKey?: string;
    }) => {
      const now = Date.now();
      if (now - lastEventAtRef.current < 1200) return;
      lastEventAtRef.current = now;

      setState({
        open: true,
        title: payload.title?.trim() || "AbacaxiTI em acao",
        message: payload.message?.trim() || FALLBACK_MESSAGE,
        level: payload.level || "INFO",
        iconKey: payload.iconKey?.trim() || "icon_padrao",
      });
    };

    const customHandler = (event: Event) => {
      const detail = (event as CustomEvent<{
        title?: string;
        message?: string;
        level?: PopupState["level"];
        iconKey?: string;
      }>).detail || {};
      openPopup(detail);
    };

    const errorHandler = () => {
      openPopup({
        title: "AbacaxiTI detectou um problema",
        message: FALLBACK_MESSAGE,
        level: "ERROR",
        iconKey: "icon_confuso",
      });
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = String((event.reason as any)?.message || event.reason || "").trim();
      openPopup({
        title: "AbacaxiTI detectou um problema",
        message: reason || FALLBACK_MESSAGE,
        level: "ERROR",
        iconKey: "icon_confuso",
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
          <div className="flex items-center gap-2">
            <img
              src={resolveIconUrl(state.iconKey)}
              alt="AbacaxiTI"
              className="h-8 w-8 rounded-full border object-cover"
              onError={(event) => {
                event.currentTarget.src = BRAND_ICON;
              }}
            />
            <div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${levelBadgeClass[state.level]}`}>
                {levelLabel[state.level]}
              </span>
              <DialogTitle className="mt-1 text-lg">{state.title}</DialogTitle>
            </div>
          </div>
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
