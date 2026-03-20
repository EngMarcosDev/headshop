import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
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

        <section className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, marca, subcategoria ou material..."
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none ring-0 transition focus:border-accent"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
            >
              <option value="all">Todas as categorias</option>
              {categories.filter((category) => category.slug !== "banners").map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="mb-4 flex flex-wrap gap-2">
          {categories.filter((category) => category.slug !== "banners").map((category) => {
            const selected = categoryFilter === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => setCategoryFilter((current) => (current === category.slug ? "all" : category.slug))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all md:text-sm",
                  selected
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-card text-foreground/80 opacity-70 hover:opacity-100"
                )}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </button>
            );
          })}
        </div>

        {productsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando produtos...</p>
        ) : productsQuery.isError ? (
          <p className="text-sm text-muted-foreground">Nao foi possivel carregar os produtos.</p>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
                  category={product.category}
                  isNew={product.isNew}
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
