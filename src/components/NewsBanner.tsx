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
      <section className="w-full pt-6 md:pt-8">
        <div className="h-[200px] sm:h-[260px] md:h-[360px] w-full border-y border-border bg-muted/60 animate-pulse" />
      </section>
    );
  }

  if (isError || slides.length === 0) {
    return null;
  }

  return (
    <section className="w-full pt-6 md:pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-3 text-sm font-display font-bold uppercase tracking-[0.3em] text-foreground sm:text-base md:text-lg">
          Novidades
        </h2>
      </div>

      <div className="relative w-full overflow-hidden border-y border-border bg-card shadow-lg">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full flex-shrink-0">
              <img
                src={slide.image}
                alt={slide.name}
                className="h-[200px] w-full object-cover sm:h-[260px] md:h-[360px]"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mx-auto mt-3 flex max-w-6xl items-center justify-center gap-2 px-4">
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
    </section>
  );
};

export default NewsBanner;
