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
export function useHideOnScroll(opts: { threshold?: number; revealDelta?: number } = {}): boolean {
  const { threshold = 120, revealDelta = 8 } = opts;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;

        if (y < threshold) {
          setIsVisible(true);
        } else if (delta > 0) {
          // Rolando pra baixo — esconde
          setIsVisible(false);
        } else if (delta < -revealDelta) {
          // Rolando pra cima de forma intencional (>revealDelta) — reaparece
          setIsVisible(true);
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, revealDelta]);

  return isVisible;
}
