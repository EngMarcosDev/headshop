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

  useEffect(() => {
    setExpanded(false);
  }, [title, products.length]);

  const showEmpty = !isLoading && products.length === 0;
  const showError = !isLoading && isError;
  const visibleProducts = useMemo(
    () => (expanded ? products : products.slice(0, initialVisibleCount)),
    [expanded, products, initialVisibleCount]
  );
  const hasMore = products.length > initialVisibleCount;

  return (
    <section className="px-2.5 py-5 sm:px-4 md:px-6 md:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="mb-4 text-sm font-display font-semibold uppercase tracking-[0.2em] text-accent sm:mb-6 sm:text-base md:mb-8 md:text-lg lg:text-xl lg:tracking-widest">
          {title}
        </h2>

        {showError ? (
          <div className="text-center text-sm text-muted-foreground">{errorMessage}</div>
        ) : showEmpty ? (
          <div className="text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <>
            <div className="grid w-full max-w-6xl grid-cols-2 gap-2.5 justify-items-center sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
                      className="w-full max-w-[240px] animate-in fade-in slide-in-from-bottom-2 duration-500 md:max-w-[260px]"
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
