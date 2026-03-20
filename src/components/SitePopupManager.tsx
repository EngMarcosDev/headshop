import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSitePopups, type SitePopup } from "@/api/sitePopups";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISS_PREFIX = "bacaxita:popup:dismissed:";

const popupOrder = (popup: SitePopup) => {
  if (popup.type === "FIRST") return 0;
  if (popup.type === "ALERT") return 1;
  return 2;
};

const isDismissed = (popupId: number) => {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(`${DISMISS_PREFIX}${popupId}`));
};

const dismiss = (popupId: number) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${DISMISS_PREFIX}${popupId}`, String(Date.now()));
};

const resolvePopupImage = (popup: SitePopup) => {
  if (popup.imageUrl && popup.imageUrl.trim()) return popup.imageUrl;
  const iconName = popup.iconKey?.trim() || "icon_padrao";
  return `/assets/Abacaxita/Icons/${iconName}.PNG`;
};

const popupTypeLabel: Record<SitePopup["type"], string> = {
  FIRST: "Primeiro popup",
  ALERT: "Alarme",
  NEWS: "Novidade",
};

const popupLevelColor: Record<SitePopup["level"], string> = {
  INFO: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-emerald-100 text-emerald-800",
  WARNING: "bg-amber-100 text-amber-900",
  ERROR: "bg-red-100 text-red-800",
};

const SitePopupManager = () => {
  const [index, setIndex] = useState(0);
  const popupsQuery = useQuery({
    queryKey: ["site", "popups"],
    queryFn: fetchSitePopups,
    staleTime: 20000,
    refetchInterval: 45000,
  });

  const queue = useMemo(() => {
    const list = [...(popupsQuery.data ?? [])]
      .sort((a, b) => popupOrder(a) - popupOrder(b) || a.priority - b.priority)
      .filter((popup) => !popup.dismissible || !isDismissed(popup.id));
    return list;
  }, [popupsQuery.data]);

  useEffect(() => {
    setIndex(0);
  }, [queue.length]);

  const popup = queue[index];
  const isOpen = Boolean(popup);

  const closePopup = () => {
    if (!popup) return;
    if (popup.dismissible) dismiss(popup.id);
    setIndex((current) => current + 1);
  };

  useEffect(() => {
    if (!popup || !popup.displaySeconds || popup.displaySeconds <= 0) return;
    const timer = window.setTimeout(closePopup, popup.displaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [popup]);

  if (!popup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? closePopup() : undefined)}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src={resolvePopupImage(popup)}
              alt={popup.title}
              className="h-10 w-10 rounded-full border object-cover"
            />
            <div>
              <p className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${popupLevelColor[popup.level]}`}>
                {popup.level}
              </p>
              <DialogTitle className="mt-1 text-left text-base">{popup.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm leading-relaxed text-muted-foreground">{popup.message}</p>
        <p className="text-xs text-muted-foreground">{popupTypeLabel[popup.type]}</p>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {popup.buttonLabel && popup.buttonUrl ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.open(popup.buttonUrl || "#", "_blank", "noopener,noreferrer");
                closePopup();
              }}
            >
              {popup.buttonLabel}
            </Button>
          ) : null}
          {popup.dismissible ? (
            <Button type="button" onClick={closePopup}>
              Fechar
            </Button>
          ) : (
            <Button type="button" onClick={closePopup}>
              Entendi
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SitePopupManager;
