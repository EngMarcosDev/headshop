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
    <section className="py-6 md:py-10 lg:py-12 px-3 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-display font-semibold text-accent text-center mb-4 sm:mb-6 md:mb-8 uppercase tracking-widest">
          {title}
        </h2>

        {showError ? (
          <div className="text-center text-sm text-muted-foreground">{errorMessage}</div>
        ) : showEmpty ? (
          <div className="text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 justify-items-center w-full max-w-6xl">
              {isLoading
                ? Array.from({ length: initialVisibleCount }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="w-full max-w-[260px] card-product p-3 md:p-4 flex flex-col h-full"
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
                      className="w-full max-w-[260px] animate-in fade-in slide-in-from-bottom-2 duration-500"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        image={product.image}
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
