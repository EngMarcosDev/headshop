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

// Contrast rule (user request): button text must always be legible against
// its own background. Green bg -> white text; white bg -> black text.
// Using SOLID colors (no /0.xx alpha) so content behind the popup never bleeds
// through and muddles contrast, which was the "botao bugado com transparencia"
// the user reported.
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
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-2 py-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-neutral-700"
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
            className="rounded-full p-1 text-white/80 transition hover:bg-neutral-700 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {open && (
        <section className="fixed bottom-16 left-4 right-4 z-50 w-auto max-w-sm overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 text-white shadow-2xl sm:right-auto">
          <div className="rasta-stripe" />

          <div className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white">Cookies no HeadShop</h3>
            <p className="mt-2 text-[12px] text-neutral-200">
              Escolha o nivel de privacidade para esta sessao.
            </p>
            <p className="mt-2 text-[11px] text-neutral-300">
              Ler cookies: usamos cookies necessarios para login, sacolinha e finalizacao de pedido.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {/* Fundo verde -> texto branco */}
              <button
                type="button"
                onClick={() => saveChoice("all")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-500"
              >
                Permitir Todos
              </button>
              {/* Fundo branco -> texto preto */}
              <button
                type="button"
                onClick={() => saveChoice("required")}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900 transition hover:bg-neutral-100"
              >
                Somente Necessarios
              </button>
            </div>

            {hasSavedChoice && (
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-neutral-300">
                Sua escolha pode ser alterada a qualquer momento.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
