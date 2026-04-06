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
          image: product.bannerImage || product.image,
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
      <section className="w-full pt-6 md:pt-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-[28px] border border-border bg-muted/60 animate-pulse">
            <div className="min-h-[340px] sm:min-h-[380px] md:min-h-[440px] w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || slides.length === 0) {
    return null;
  }

  return (
    <section className="w-full pt-6 md:pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-display font-bold uppercase tracking-[0.3em] text-foreground sm:text-base md:text-lg">
              Novidades
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vitrine responsiva, sem distorcer o banner e com leitura mais bonita em qualquer tela.
            </p>
          </div>
          {slides.length > 1 ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </p>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[30px] border border-border/70 bg-card shadow-[0_24px_70px_-45px_rgba(55,32,12,0.55)]">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <article
                key={slide.id}
                className="relative grid w-full flex-shrink-0 grid-cols-1 md:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.85fr)]"
              >
                <div className="order-2 flex flex-col justify-end p-4 sm:p-6 md:order-1 md:p-8 lg:p-10">
                  <span className="inline-flex w-fit items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                    Destaque Bacaxita
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-[2.4rem]">
                    {slide.name}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    O banner agora respeita o formato da arte, ganha apoio visual no fundo e continua elegante no celular.
                  </p>
                  {slide.showPrice && slide.price > 0 ? (
                    <div className="mt-5 inline-flex w-fit items-center rounded-2xl bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg">
                      {formatCurrency(slide.price)}
                    </div>
                  ) : null}
                </div>

                <div className="relative order-1 min-h-[250px] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(255,235,190,0.45)_40%,rgba(151,109,58,0.12)_100%)] md:order-2 md:min-h-[430px]">
                  <img
                    src={slide.image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl opacity-35"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-x-4 bottom-0 top-4 rounded-t-[26px] bg-white/45 blur-3xl md:inset-6" />
                  <img
                    src={slide.image}
                    alt={slide.name}
                    className="relative z-10 h-full w-full object-contain p-4 sm:p-6 md:p-8"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {slides.map((slide, dotIndex) => (
              <button
                key={`dot-${slide.id}`}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === index ? "w-10 bg-accent shadow-sm" : "w-2.5 bg-border"
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
