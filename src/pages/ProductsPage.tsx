import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import PineappleLoader from "@/components/PineappleLoader";
import { fetchAllProducts } from "@/api/products";
import { fetchStoreCategories } from "@/api/categories";
import { HEADSHOP_CATEGORIES, buildCategoryFromApi } from "@/lib/categoryCatalog";
import { cn } from "@/lib/utils";

const normalizeText = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const ProductsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const productsQuery = useQuery({
    queryKey: ["products", "all-listing"],
    queryFn: fetchAllProducts,
    staleTime: 120000,
    retry: 1,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories", "products-page"],
    queryFn: fetchStoreCategories,
    staleTime: 120000,
    retry: 1,
  });

  const products = productsQuery.data ?? [];
  const categories = useMemo(() => {
    const fromApi = (categoriesQuery.data ?? []).map((entry) => buildCategoryFromApi(entry));
    return fromApi.length > 0 ? fromApi : HEADSHOP_CATEGORIES;
  }, [categoriesQuery.data]);

  const filteredProducts = useMemo(() => {
    const searchText = normalizeText(search);
    return products.filter((product) => {
      const inCategory = categoryFilter === "all" || product.category === categoryFilter;
      if (!inCategory) return false;

      if (!searchText) return true;
      const haystack = normalizeText(
        `${product.name} ${product.brand || ""} ${product.subcategory || ""} ${product.material || ""}`
      );
      return haystack.includes(searchText);
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="mb-6 space-y-3">
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Todos os produtos</h1>
          <p className="text-sm text-muted-foreground">
            Encontre sedas, piteiras, kits e acessorios da Bacaxita em um so lugar.
          </p>
        </div>

        {/* Filtros: somente busca textual + chips de categoria (igual a CategoryPage).
            ANTES tinha um <select> redundante de categoria — removido conforme pedido. */}
        <section className="mb-5 space-y-4 rounded-xl border border-border bg-card p-4">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, marca, subcategoria ou material..."
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-0 transition focus:border-accent"
          />

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Categorias
            </p>
            {/* Grid responsivo: 3 / 5 / 6 / 10 cols (com 1 a mais por causa do "Todas"). */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 md:gap-2.5 lg:grid-cols-10">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-[11px] font-semibold transition-all md:gap-2 md:px-2.5 md:text-sm",
                  categoryFilter === "all"
                    ? "border-accent bg-accent text-white opacity-100 shadow-md"
                    : "border-border bg-background text-foreground/80 opacity-50 hover:opacity-90"
                )}
              >
                <span className="truncate">Todas</span>
              </button>
              {categories.filter((category) => category.slug !== "banners").map((category) => {
                const selected = categoryFilter === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => setCategoryFilter((current) => (current === category.slug ? "all" : category.slug))}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-[11px] font-semibold transition-all md:gap-2 md:px-2.5 md:text-sm",
                      selected
                        ? "border-accent bg-accent text-white opacity-100 shadow-md"
                        : "border-border bg-background text-foreground/80 opacity-50 hover:opacity-90"
                    )}
                  >
                    <category.icon className="h-3 w-3 shrink-0 md:h-4 md:w-4" />
                    <span className="truncate">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {productsQuery.isLoading ? (
          <PineappleLoader label="Carregando produtos" compact />
        ) : productsQuery.isError ? (
          <p className="text-sm text-muted-foreground">Nao foi possivel carregar os produtos.</p>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          // Mesmo grid e wrappers do ProductSection (Mais Vendidos) pra ficar
          // visualmente uniforme com o restante do site.
          <div className="grid grid-cols-2 gap-2.5 justify-items-center sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {filteredProducts.map((product, index) => (
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
                  stockQty={product.stockQty}
                  minStock={product.minStock}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductsPage;
