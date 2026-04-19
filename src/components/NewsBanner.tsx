import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/api/types";

interface NewsBannerProps {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
}

const AUTO_PLAY_MS = 5000;
const TRANSITION_MS = 700;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const NewsBanner = ({ products, isLoading = false, isError = false }: NewsBannerProps) => {
  const slides = useMemo(
    () =>
      products
        .filter((product) => Boolean(product.bannerImage || product.image))
        .map((product) => ({
          id: product.id,
          name: product.name,
          desktopImage: product.bannerImage || product.image,
          mobileImage: (product.image && product.image !== product.bannerImage) ? product.image : (product.bannerImage || product.image),
          price: Number(product.price || 0),
          showPrice: product.showBannerPrice === true,
        }))
        .slice(0, 8),
    [products]
  );

  // Virtual extra slide at the end for seamless infinite loop (same technique as PromoBanner)
  const extended = useMemo(
    () => (slides.length > 1 ? [...slides, slides[0]] : slides),
    [slides]
  );

  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);

  // Reset to first slide when slides change
  useEffect(() => {
    setIndex(0);
    setTransitioning(true);
  }, [slides.length]);

  // Auto-play: always increment forward; seamless reset handled in onTransitionEnd
  useEffect(() => {
    if (slides.length <= 1) return;
    intervalRef.current = window.setInterval(() => {
      setTransitioning(true);
      setIndex((prev) => prev + 1);
    }, AUTO_PLAY_MS);
    return () => {
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  // When a dot is clicked, restart interval from that position
  const goTo = (dotIndex: number) => {
    if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    setTransitioning(true);
    setIndex(dotIndex);
    intervalRef.current = window.setInterval(() => {
      setTransitioning(true);
      setIndex((prev) => prev + 1);
    }, AUTO_PLAY_MS);
  };

  if (isLoading) {
    return (
      <section className="news-banner">
        <div className="overflow-hidden border-y border-border/60 bg-muted/60 animate-pulse">
          <div className="min-h-[260px] w-full sm:min-h-[320px] md:min-h-[420px]" />
        </div>
      </section>
    );
  }

  if (isError || slides.length === 0) {
    return null;
  }

  const activeDot = index % slides.length;

  return (
    <section className="news-banner">
      {/* Section title — shown whenever there are active banner slides */}
      <div className="px-4 pt-5 pb-2 sm:px-6 md:px-10 lg:px-16">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Novidades</h2>
      </div>

      <div className="relative overflow-hidden border-y border-border/70 bg-card shadow-[0_24px_70px_-42px_rgba(55,32,12,0.55)]">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: transitioning ? `transform ${TRANSITION_MS}ms ease-out` : "none",
          }}
          onTransitionEnd={() => {
            // When we land on the virtual clone of slide[0], snap back instantly
            if (index === slides.length) {
              setTransitioning(false);
              setIndex(0);
              window.setTimeout(() => setTransitioning(true), 30);
            }
          }}
        >
          {extended.map((slide, i) => (
            <article
              key={`${slide.id}-${i}`}
              className="relative min-h-[260px] w-full flex-shrink-0 sm:min-h-[320px] md:min-h-[420px] lg:min-h-[500px]"
            >
              {/* Desktop */}
              <img
                src={slide.desktopImage}
                alt={slide.name}
                className="absolute inset-0 h-full w-full object-cover hidden md:block"
                loading="lazy"
                decoding="async"
              />
              {/* Mobile */}
              <img
                src={slide.mobileImage}
                alt={slide.name}
                className="absolute inset-0 h-full w-full object-cover block md:hidden"
                loading="lazy"
                decoding="async"
              />

              {slide.showPrice && slide.price > 0 ? (
                <div className="relative z-10 flex h-full items-end">
                  <div className="w-full px-4 py-5 sm:px-6 sm:py-6 md:px-10 md:py-8 lg:px-16 lg:py-10">
                    <div className="inline-flex w-fit items-center rounded-2xl border border-black/5 bg-white/95 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-xl">
                      {formatCurrency(slide.price)}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {slides.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2 px-4">
            {slides.map((slide, dotIndex) => (
              <button
                key={`dot-${slide.id}`}
                type="button"
                onClick={() => goTo(dotIndex)}
                className={`h-2.5 rounded-full border border-white/20 transition-all ${
                  dotIndex === activeDot ? "w-10 bg-white shadow-sm" : "w-2.5 bg-white/35 backdrop-blur-sm"
                }`}
                aria-label={`Exibir banner ${dotIndex + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default NewsBanner;
