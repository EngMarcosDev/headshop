import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsByCategory } from "@/api/products";
import { fetchStoreCategories } from "@/api/categories";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  HEADSHOP_CATEGORIES,
  buildCategoryFromApi,
  getCategoryBySlug,
  normalizeCategorySlug,
} from "@/lib/categoryCatalog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const normalizeText = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatNumber = new Intl.NumberFormat("pt-BR");

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = normalizeCategorySlug(slug);
  const categoriesQuery = useQuery({
    queryKey: ["categories", "category-page"],
    queryFn: fetchStoreCategories,
    staleTime: 120000,
  });
  const siteCategories = useMemo(() => {
    const fromApi = (categoriesQuery.data ?? []).map((entry) => buildCategoryFromApi(entry));
    return fromApi.length > 0 ? fromApi : HEADSHOP_CATEGORIES;
  }, [categoriesQuery.data]);
  const activeCategory = getCategoryBySlug(normalizedSlug, siteCategories);
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");

  const productsQuery = useQuery({
    queryKey: ["products", "category", normalizedSlug],
    queryFn: () => fetchProductsByCategory(normalizedSlug),
    enabled: Boolean(activeCategory),
    staleTime: 120000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Oculta produtos com estoque zerado (stockQty = 0); null = sem limite de estoque
  const products = (productsQuery.data ?? []).filter(
    (p) => p.stockQty === null || p.stockQty === undefined || p.stockQty > 0
  );

  const subcategoryOptions = useMemo(() => {
    const optionMap = new Map<string, string>();
    optionMap.set("all", "Todos");

    products.forEach((product) => {
      const subcategory = String(product.subcategory || "").trim();
      if (subcategory) {
        optionMap.set(`subcategory:${normalizeText(subcategory)}`, `Subcategoria: ${subcategory}`);
      }

      const brand = String(product.brand || "").trim();
      if (brand) {
        optionMap.set(`brand:${normalizeText(brand)}`, `Marca: ${brand}`);
      }

      const material = String(product.material || "").trim();
      if (material) {
        optionMap.set(`material:${normalizeText(material)}`, `Material: ${material}`);
      }
    });

    return Array.from(optionMap.entries()).map(([key, label]) => ({ key, label }));
  }, [products]);

  useEffect(() => {
    setSubcategoryFilter("all");
    setPriceSort("none");
  }, [normalizedSlug]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (subcategoryFilter.startsWith("brand:")) {
      const expected = subcategoryFilter.replace("brand:", "");
      list = list.filter((product) => normalizeText(product.brand) === expected);
    } else if (subcategoryFilter.startsWith("material:")) {
      const expected = subcategoryFilter.replace("material:", "");
      list = list.filter((product) => normalizeText(product.material) === expected);
    } else if (subcategoryFilter.startsWith("subcategory:")) {
      const expected = subcategoryFilter.replace("subcategory:", "");
      list = list.filter((product) => normalizeText(product.subcategory) === expected);
    }

    if (priceSort === "asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (priceSort === "desc") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, subcategoryFilter, priceSort]);

  if (!activeCategory) {
    return (
      <div className="paper-bg flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground">Categoria não encontrada</h1>
            <Link to="/" className="mt-3 inline-block text-sm text-accent hover:underline">
              Voltar ao início
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <div className="category-banner">
        <div className="category-banner-bg py-3 md:py-4">
          <div className="flex items-center justify-center gap-2 md:gap-3 animate-in fade-in zoom-in-95 duration-500">
            <activeCategory.icon className="h-6 w-6 text-white drop-shadow-lg md:h-8 md:w-8" />
            <h1 className="text-lg font-display font-bold uppercase tracking-widest text-white drop-shadow-lg md:text-xl lg:text-2xl">
              {activeCategory.name}
            </h1>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>

          <section className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Categorias</p>
              {/* Grid responsivo SEMPRE — alinhamento perfeito em qualquer largura.
                  Mobile: 3 col / sm: 5 / md: 6 / lg: 9 (todas em uma linha). */}
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 md:gap-2.5 lg:grid-cols-9">
                {siteCategories.filter((category) => category.slug !== "banners").map((category) => {
                  const selected = category.slug === activeCategory.slug;
                  return (
                    <Link
                      key={category.slug}
                      to={category.href}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-[11px] font-semibold transition-all md:gap-2 md:px-2.5 md:text-sm",
                        selected
                          ? "border-accent bg-accent text-white opacity-100 shadow-md"
                          : "border-border bg-background text-foreground/80 opacity-50 hover:opacity-90"
                      )}
                    >
                      <category.icon className="h-3 w-3 shrink-0 md:h-4 md:w-4" />
                      <span className="truncate">{category.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Filtros: subcategoria + preco lado a lado em selects compactos.
                Antes eram chips desorganizados que poluiam a tela. */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Filtrar por</p>
                <Select value={subcategoryFilter} onValueChange={(value) => setSubcategoryFilter(value)}>
                  <SelectTrigger className="h-9 w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Todos os filtros" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 bg-card text-foreground">
                    {subcategoryOptions.map((option) => (
                      <SelectItem key={option.key} value={option.key} className="text-xs sm:text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Ordenar por preço</p>
                <Select
                  value={priceSort}
                  onValueChange={(value) => setPriceSort(value as "none" | "asc" | "desc")}
                >
                  <SelectTrigger className="h-9 w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Sem ordem" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground">
                    <SelectItem value="none">Sem ordem</SelectItem>
                    <SelectItem value="asc">Menor preço</SelectItem>
                    <SelectItem value="desc">Maior preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatNumber.format(filteredProducts.length)} produto(s) em {activeCategory.name}
            </p>
          </div>

          {productsQuery.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Carregando produtos...</p>
          ) : productsQuery.isError ? (
            <p className="mt-6 text-sm text-muted-foreground">Não foi possível carregar os produtos.</p>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Nenhum produto encontrado para essa subcategoria.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="w-full max-w-[260px] justify-self-center animate-in fade-in slide-in-from-bottom-2 duration-500"
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
                    category={product.category || normalizedSlug}
                    isNew={product.isNew}
                    stockQty={product.stockQty}
                    minStock={product.minStock}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
