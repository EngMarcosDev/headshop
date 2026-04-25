import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSitePopups, type SitePopup } from "@/api/sitePopups";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISS_PREFIX = "bacaxita:popup:dismissed:";
// Cooldown padrão: 24h. Se o admin editar o popup, `updatedAt` muda e a key
// também muda — então o popup reaparece automaticamente após uma edição.
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const popupOrder = (popup: SitePopup) => {
  if (popup.type === "FIRST") return 0;
  if (popup.type === "ALERT") return 1;
  return 2;
};

const dismissKey = (popup: Pick<SitePopup, "id" | "updatedAt">) =>
  `${DISMISS_PREFIX}${popup.id}:${popup.updatedAt || "static"}`;

const isDismissed = (popup: Pick<SitePopup, "id" | "updatedAt">) => {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(dismissKey(popup));
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return true;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
};

const dismiss = (popup: Pick<SitePopup, "id" | "updatedAt">) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(dismissKey(popup), String(Date.now()));
};

const resolvePopupImage = (popup: SitePopup) => {
  if (popup.imageUrl && popup.imageUrl.trim()) return popup.imageUrl;
  const iconName = popup.iconKey?.trim() || "icon_padrao";
  return `/assets/status-icons/${iconName}.png`;
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

// Circular countdown ("pizza" timer) used for popups the user cannot dismiss —
// it makes it obvious how long until the popup auto-closes.
const CountdownPizza = ({
  totalMs,
  remainingMs,
}: {
  totalMs: number;
  remainingMs: number;
}) => {
  const safeTotal = Math.max(1, totalMs);
  const clampedRemaining = Math.max(0, Math.min(remainingMs, safeTotal));
  const ratio = clampedRemaining / safeTotal;
  const size = 44;
  const radius = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);
  const secondsLeft = Math.ceil(clampedRemaining / 1000);
  return (
    <div className="relative inline-flex h-11 w-11 items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill="transparent"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={3}
        />
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
      </svg>
      <span className="relative text-xs font-semibold tabular-nums">
        {secondsLeft}
      </span>
    </div>
  );
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
    // Filtra qualquer popup ja descartado nesta janela de cooldown — independente
    // de `dismissible`. Isso evita que o popup volte toda vez que o usuario navega
    // entre paginas (login → categoria → home → popup, antes voltava sempre).
    const list = [...(popupsQuery.data ?? [])]
      .sort((a, b) => popupOrder(a) - popupOrder(b) || a.priority - b.priority)
      .filter((popup) => !isDismissed(popup));
    return list;
  }, [popupsQuery.data]);
  const queueSignature = useMemo(
    () => queue.map((popup) => `${popup.id}:${popup.updatedAt || "static"}:${popup.isActive}`).join("|"),
    [queue]
  );

  useEffect(() => {
    setIndex(0);
  }, [queueSignature]);

  const popup = queue[index];
  const isOpen = Boolean(popup);

  // Auto-close state: tracks the total/remaining milliseconds for the pizza timer.
  // Using refs to avoid re-creating the interval on every render.
  const displaySeconds = popup?.displaySeconds ?? 0;
  const totalMs = displaySeconds > 0 ? displaySeconds * 1000 : 0;
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const popupKeyRef = useRef<string | null>(null);

  const closePopup = () => {
    if (!popup) return;
    // Sempre persiste o dismissal (com cooldown) — antes só persistia se
    // `dismissible: true`, o que fazia popups non-dismissible reaparecerem
    // toda navegação. Agora qualquer fechamento conta.
    dismiss(popup);
    setIndex((current) => current + 1);
  };

  useEffect(() => {
    if (!popup) {
      popupKeyRef.current = null;
      return;
    }
    const key = `${popup.id}:${popup.updatedAt || "static"}`;
    if (popupKeyRef.current === key) return;
    popupKeyRef.current = key;
    setRemainingMs(totalMs);
  }, [popup, totalMs]);

  useEffect(() => {
    if (!popup || totalMs <= 0) return;

    const startedAt = Date.now();
    const startingRemaining = remainingMs > 0 ? remainingMs : totalMs;
    const endsAt = startedAt + startingRemaining;

    const tick = window.setInterval(() => {
      const left = Math.max(0, endsAt - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(tick);
        closePopup();
      }
    }, 250);

    return () => window.clearInterval(tick);
    // Intentionally tied to popup identity, not remainingMs — we restart
    // the interval only when the popup itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup, totalMs]);

  if (!popup) return null;

  const showPizza = totalMs > 0 && !popup.dismissible;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) return;
        // Forbid ESC / backdrop click closes when popup is non-dismissible.
        if (!popup.dismissible) return;
        closePopup();
      }}
    >
      <DialogContent
        className="max-w-lg border-border bg-card"
        onInteractOutside={(event) => {
          if (!popup.dismissible) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (!popup.dismissible) event.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <img
              src={resolvePopupImage(popup)}
              alt={popup.title}
              className="h-10 w-10 rounded-full border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${popupLevelColor[popup.level]}`}>
                {popup.level}
              </p>
              <DialogTitle className="mt-1 text-left text-base leading-snug break-words">{popup.title}</DialogTitle>
            </div>
            {showPizza ? (
              <div className="ml-auto text-primary">
                <CountdownPizza totalMs={totalMs} remainingMs={remainingMs} />
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line break-words">
          {popup.message}
        </p>
        <p className="text-xs text-muted-foreground">{popupTypeLabel[popup.type]}</p>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {popup.buttonLabel && popup.buttonUrl ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.open(popup.buttonUrl || "#", "_blank", "noopener,noreferrer");
                if (popup.dismissible) closePopup();
              }}
            >
              {popup.buttonLabel}
            </Button>
          ) : null}
          {popup.dismissible ? (
            <Button type="button" onClick={closePopup}>
              Fechar
            </Button>
          ) : showPizza ? (
            <Button type="button" disabled>
              Aguarde...
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
