import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsByCategory } from "@/api/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HEADSHOP_CATEGORIES, getCategoryBySlug, normalizeCategorySlug } from "@/lib/categoryCatalog";

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
  const activeCategory = getCategoryBySlug(normalizedSlug);
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

  const products = productsQuery.data ?? [];

  const subcategoryOptions = useMemo(() => {
    const optionMap = new Map<string, string>();
    optionMap.set("all", "Todos");

    products.forEach((product) => {
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
            <h1 className="text-2xl font-display font-bold text-foreground">Categoria nao encontrada</h1>
            <Link to="/" className="mt-3 inline-block text-sm text-accent hover:underline">
              Voltar ao inicio
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
            Voltar ao inicio
          </Link>

          <section className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Categorias</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HEADSHOP_CATEGORIES.filter((category) => category.slug !== "banners").map((category) => {
                  const selected = category.slug === activeCategory.slug;
                  return (
                    <Link
                      key={category.slug}
                      to={category.href}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all md:text-sm",
                        selected
                          ? "border-accent bg-accent text-white opacity-100 shadow-md"
                          : "border-border bg-background text-foreground/80 opacity-50 hover:opacity-90"
                      )}
                    >
                      <category.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {category.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Subcategorias
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2 py-1">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Preco</span>
                  <select
                    value={priceSort}
                    onChange={(event) => setPriceSort(event.target.value as "none" | "asc" | "desc")}
                    className="bg-transparent text-xs text-foreground outline-none md:text-sm"
                  >
                    <option value="none">Sem ordem</option>
                    <option value="asc">Menor preco</option>
                    <option value="desc">Maior preco</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {subcategoryOptions.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    size="sm"
                    variant={subcategoryFilter === option.key ? "default" : "outline"}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs md:text-sm",
                      subcategoryFilter === option.key ? "bg-primary text-primary-foreground" : "opacity-80"
                    )}
                    onClick={() => setSubcategoryFilter(option.key)}
                  >
                    {option.label}
                  </Button>
                ))}
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
            <p className="mt-6 text-sm text-muted-foreground">Nao foi possivel carregar os produtos.</p>
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
