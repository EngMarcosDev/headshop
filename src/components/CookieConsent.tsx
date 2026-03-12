import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type CookieMode = "all" | "required";

const STORAGE_KEY = "bacaxita_cookie_preferences";

const applyMode = (mode: CookieMode) => {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `bacaxita_cookie_mode=${mode}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const dispatchCookieChoiceEvent = (mode: CookieMode) => {
  window.dispatchEvent(
    new CustomEvent("bacaxita:cookie-choice", {
      detail: { mode },
    })
  );
};

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [hasSavedChoice, setHasSavedChoice] = useState(false);
  const [launcherHidden, setLauncherHidden] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setOpen(true);
      setHasSavedChoice(false);
      return;
    }

    if (saved === "all" || saved === "required") {
      applyMode(saved);
      setHasSavedChoice(true);
    }
  }, []);

  const saveChoice = (mode: CookieMode) => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    applyMode(mode);
    setHasSavedChoice(true);
    setOpen(false);
    dispatchCookieChoiceEvent(mode);
  };

  const launcherVisible = useMemo(() => !launcherHidden, [launcherHidden]);

  return (
    <>
      {launcherVisible && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-white/30 bg-[hsl(var(--header))/0.86] px-2 py-1.5 text-white shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/15"
          >
            Preferencias
          </button>

          <button
            type="button"
            aria-label="Ocultar preferencias de cookies"
            onClick={() => {
              setLauncherHidden(true);
              setOpen(false);
            }}
            className="rounded-full p-1 text-white/65 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {open && (
        <section className="fixed bottom-16 left-4 right-4 z-50 w-auto max-w-sm overflow-hidden rounded-2xl border border-white/30 bg-[hsl(var(--header))/0.9] text-white shadow-2xl backdrop-blur-2xl sm:right-auto">
          <div className="rasta-stripe" />

          <div className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white">Cookies no HeadShop</h3>
            <p className="mt-2 text-[12px] text-white/75">
              Escolha o nivel de privacidade para esta sessao.
            </p>
            <p className="mt-2 text-[11px] text-white/70">
              Ler cookies: usamos cookies necessarios para login, sacolinha e finalizacao de pedido.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => saveChoice("all")}
                className="rounded-lg border border-emerald-700/20 bg-emerald-600/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-500"
              >
                Permitir Todos
              </button>
              <button
                type="button"
                onClick={() => saveChoice("required")}
                className="rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/25"
              >
                Somente Necessarios
              </button>
            </div>

            {hasSavedChoice && (
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-white/65">
                Sua escolha pode ser alterada a qualquer momento.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
