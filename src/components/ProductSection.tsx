import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import type { Product } from "@/api/types";

interface ProductSectionProps {
  title: string;
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  isError?: boolean;
  errorMessage?: string;
  initialVisibleCount?: number;
}

const ProductSection = ({
  title,
  products,
  isLoading = false,
  emptyMessage = "Nenhum produto encontrado.",
  isError = false,
  errorMessage = "Nao foi possivel carregar os produtos.",
  initialVisibleCount = 4,
}: ProductSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  // Oculta produtos com estoque zerado (stockQty = 0), mantém os sem limite (null)
  const availableProducts = useMemo(
    () => products.filter((p) => p.stockQty === null || p.stockQty === undefined || p.stockQty > 0),
    [products]
  );

  useEffect(() => {
    setExpanded(false);
  }, [title, availableProducts.length]);

  const showEmpty = !isLoading && availableProducts.length === 0;
  const showError = !isLoading && isError;
  const visibleProducts = useMemo(
    () => (expanded ? availableProducts : availableProducts.slice(0, initialVisibleCount)),
    [expanded, availableProducts, initialVisibleCount]
  );
  const hasMore = availableProducts.length > initialVisibleCount;

  return (
    <section className="px-3 py-6 sm:px-4 md:px-6 md:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="flex w-full max-w-xl items-center gap-3 mb-5 sm:mb-6 md:mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-accent/60" />
          <h2 className="shrink-0 text-sm font-display font-semibold uppercase tracking-[0.2em] text-accent sm:text-base md:text-lg lg:text-xl lg:tracking-widest">
            {title}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-accent/30 to-accent/60" />
        </div>

        {showError ? (
          <div className="text-center text-sm text-muted-foreground">{errorMessage}</div>
        ) : showEmpty ? (
          <div className="text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <>
            {/* Mobile: 2 colunas com gap maior e respiro horizontal. Cards alinhados via auto-rows. */}
            <div className="grid w-full max-w-6xl grid-cols-2 gap-x-3 gap-y-4 px-1 auto-rows-fr justify-items-center sm:gap-3 md:grid-cols-3 md:gap-4 md:px-0 lg:grid-cols-4">
              {isLoading
                ? Array.from({ length: initialVisibleCount }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="card-product flex h-full w-full max-w-[240px] flex-col p-2.5 sm:p-3 md:max-w-[260px] md:p-4"
                    >
                      <Skeleton className="h-4 w-20 mb-3" />
                      <Skeleton className="flex-1 min-h-[120px] mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-6 w-24 mb-3" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))
                : visibleProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex w-full max-w-[240px] animate-in fade-in slide-in-from-bottom-2 duration-500 md:max-w-[260px]"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        discountLabel={product.discountLabel}
                        discountActive={product.discountActive}
                        image={product.image}
                        gallery={product.gallery}
                        category={product.category}
                        isNew={product.isNew}
                        stockQty={product.stockQty}
                        minStock={product.minStock}
                      />
                    </div>
                  ))}
            </div>

            {!isLoading && hasMore && (
              <Button
                type="button"
                variant="outline"
                className="mt-6 min-w-36"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "Ver menos" : "Ver mais"}
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
