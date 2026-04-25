import { useEffect, useState } from "react";

/**
 * Returns whether a sticky element (e.g. the page header) should currently
 * be visible. The element STAYS visible while the user is near the top of
 * the page (`scrollY < threshold`); HIDES as soon as they scroll down past
 * that point; and RE-APPEARS the moment they scroll up by at least
 * `revealDelta` pixels — mirroring the iFood / Instagram pattern.
 *
 * Uses `requestAnimationFrame` throttling to stay smooth on mobile.
 */
export function useHideOnScroll(opts: {
  threshold?: number;
  hideDelta?: number;
  revealDelta?: number;
} = {}): boolean {
  // Threshold mais cedo (80px), com hysteresis: precisa rolar 24px pra esconder
  // e 16px pra reaparecer. Evita flicker em micro-scrolls do touch e fica fluido.
  const { threshold = 80, hideDelta = 24, revealDelta = 16 } = opts;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastDirChangeY = window.scrollY;
    let lastDir: "up" | "down" | null = null;
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        const dir: "up" | "down" | null = delta > 0 ? "down" : delta < 0 ? "up" : null;

        // Acima do threshold = sempre visivel
        if (y < threshold) {
          setIsVisible(true);
          lastDir = null;
          lastDirChangeY = y;
        } else if (dir && dir !== lastDir) {
          // Mudou direcao — começa a contar a partir daqui
          lastDir = dir;
          lastDirChangeY = y;
        } else if (dir === "down") {
          // Acumulou hideDelta rolando pra baixo desde a ultima inversao? Esconde.
          if (y - lastDirChangeY >= hideDelta) {
            setIsVisible(false);
          }
        } else if (dir === "up") {
          // Acumulou revealDelta rolando pra cima? Reaparece.
          if (lastDirChangeY - y >= revealDelta) {
            setIsVisible(true);
          }
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, hideDelta, revealDelta]);

  return isVisible;
}
