import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/api/types";

interface NewsBannerProps {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
}

const AUTO_PLAY_MS = 5000;
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
          // Desktop: bannerImage (paisagem larga). Mobile: image (recortada/vertical).
          // Se mobile nao tiver imagem separada, usa a mesma do desktop.
          desktopImage: product.bannerImage || product.image,
          mobileImage: (product.image && product.image !== product.bannerImage) ? product.image : (product.bannerImage || product.image),
          price: Number(product.price || 0),
          showPrice: product.showBannerPrice === true,
        }))
        .slice(0, 8),
    [products]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

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

  return (
    <section className="news-banner">
      <div className="relative overflow-hidden border-y border-border/70 bg-card shadow-[0_24px_70px_-42px_rgba(55,32,12,0.55)]">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <article key={slide.id} className="relative min-h-[260px] w-full flex-shrink-0 sm:min-h-[320px] md:min-h-[420px] lg:min-h-[500px]">
              {/* Desktop: imagem larga (≥ md) */}
              <img
                src={slide.desktopImage}
                alt={slide.name}
                className="absolute inset-0 h-full w-full object-cover hidden md:block"
                loading="lazy"
                decoding="async"
              />
              {/* Mobile: imagem recortada (< md) */}
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
                    {/* Preco no banner: bg branco e HARD-CODED, entao o texto
                        precisa de cor fixa (nao usar text-primary pois ele
                        vira quase branco no modo noturno -> branco em branco). */}
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
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 rounded-full border border-white/20 transition-all ${
                  dotIndex === index ? "w-10 bg-white shadow-sm" : "w-2.5 bg-white/35 backdrop-blur-sm"
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
