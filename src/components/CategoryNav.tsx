import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreCategories } from "@/api/categories";
import { HEADSHOP_CATEGORIES, HOME_CATEGORY_LIMIT, buildCategoryFromApi } from "@/lib/categoryCatalog";

const CategoryNav = () => {
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const categoriesQuery = useQuery({
    queryKey: ["categories", "site-nav"],
    queryFn: fetchStoreCategories,
    // Categorias mudam raríssimo — cache de 30min evita refetch a cada navegação
    // (cliente clica numa categoria, volta pra home, e a query não dispara de novo).
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Estados:
  //  - hasApiData: a query terminou e trouxe categorias do backend (com imagens) → renderiza real
  //  - isLoading: ainda buscando → renderiza skeleton (NÃO cai no fallback hardcoded — antes
  //    o fallback aparecia por 1 frame e dava o "flash" de ícones sem imagem)
  //  - isError ou empty: usa fallback hardcoded (último recurso)
  const apiCategories = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .map((entry) => buildCategoryFromApi(entry))
        .filter((category) => category.slug !== "banners")
        .slice(0, HOME_CATEGORY_LIMIT),
    [categoriesQuery.data]
  );

  const showSkeleton = categoriesQuery.isLoading && apiCategories.length === 0;
  const visibleCategories = apiCategories.length > 0
    ? apiCategories
    : HEADSHOP_CATEGORIES.filter((category) => category.slug !== "banners").slice(0, HOME_CATEGORY_LIMIT);
  const skeletonCount = HEADSHOP_CATEGORIES.filter((c) => c.slug !== "banners").length || 6;

  return (
    <section className="py-5 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* scrollbar invisivel no mobile, mantendo scroll funcional via touch/swipe */}
        <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:pb-0">
          <div className="flex min-w-max items-start gap-3.5 px-1 sm:gap-3 md:min-w-0 md:flex-wrap md:justify-center md:gap-6 lg:gap-8">
          {showSkeleton
            ? Array.from({ length: skeletonCount }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="flex w-[88px] shrink-0 flex-col items-center gap-2 sm:w-[84px] md:w-auto"
                >
                  <div className="h-14 w-14 animate-pulse rounded-full bg-muted/60 sm:h-[3.25rem] sm:w-[3.25rem] md:h-16 md:w-16 lg:h-18 lg:w-18" />
                  <div className="h-3 w-12 animate-pulse rounded bg-muted/60" />
                </div>
              ))
            : visibleCategories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.href}
                    className="group flex w-[88px] shrink-0 flex-col items-center gap-2 sm:w-[84px] md:w-auto md:shrink md:gap-2"
                >
                  {/* Ícone sempre renderizado imediatamente; imagem carrega por cima quando disponível */}
                  <div className="category-circle relative h-14 w-14 sm:h-[3.25rem] sm:w-[3.25rem] md:h-16 md:w-16 lg:h-18 lg:w-18 overflow-hidden">
                    <category.icon className="h-[22px] w-[22px] text-primary transition-colors group-hover:text-accent sm:h-[22px] sm:w-[22px] md:h-7 md:w-7" />
                    {category.image && !failedImages.has(category.slug) ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                        onError={() => setFailedImages((prev) => new Set(prev).add(category.slug))}
                      />
                    ) : null}
                  </div>
                    <span className="text-center text-[12px] font-medium text-foreground/80 transition-colors group-hover:text-accent sm:text-[11px] md:text-sm">
                    {category.name}
                  </span>
                </Link>
              ))}
        </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-6 sm:mt-8">
        <div className="h-px bg-border/60" />
      </div>
    </section>
  );
};

export default CategoryNav;
