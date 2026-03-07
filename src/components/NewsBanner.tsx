import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/api/types";

interface NewsBannerProps {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
}

const AUTO_PLAY_MS = 5000;

const NewsBanner = ({ products, isLoading = false, isError = false }: NewsBannerProps) => {
  const slides = useMemo(
    () =>
      products
        .filter((product) => Boolean(product.bannerImage || product.image))
        .map((product) => ({
          id: product.id,
          name: product.name,
          image: product.bannerImage || product.image,
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
      <section className="px-3 sm:px-4 md:px-6 pt-6 md:pt-8">
        <div className="max-w-6xl mx-auto h-[160px] sm:h-[220px] md:h-[280px] rounded-2xl border border-border bg-muted/60 animate-pulse" />
      </section>
    );
  }

  if (isError || slides.length === 0) {
    return null;
  }

  return (
    <section className="px-3 sm:px-4 md:px-6 pt-6 md:pt-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm sm:text-base md:text-lg font-display font-bold uppercase tracking-[0.3em] text-foreground mb-3">
          Novidades
        </h2>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <div key={slide.id} className="w-full flex-shrink-0">
                <div
                  className="h-[160px] sm:h-[220px] md:h-[280px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                  role="img"
                  aria-label={slide.name}
                />
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {slides.map((slide, dotIndex) => (
              <button
                key={`dot-${slide.id}`}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2 rounded-full transition-all ${
                  dotIndex === index ? "w-8 bg-accent" : "w-2 bg-border"
                }`}
                aria-label={`Exibir banner ${dotIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsBanner;
