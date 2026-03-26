import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchProductById } from "@/api/products";
import { fetchStoreCategories } from "@/api/categories";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { HEADSHOP_CATEGORIES, buildCategoryFromApi, getCategoryBySlug } from "@/lib/categoryCatalog";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const ProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = Number(id || 0);
  const { addItem, items, updateQuantity } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProductById(productId),
    enabled: Number.isFinite(productId) && productId > 0,
    staleTime: 120000,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories", "product-page"],
    queryFn: fetchStoreCategories,
    staleTime: 120000,
  });

  const product = productQuery.data;
  const gallery = useMemo(() => {
    const list = [product?.image, ...(product?.gallery || [])].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [product?.image, product?.gallery]);
  const selectedImage = gallery[selectedImageIndex] || product?.image || "/placeholder.svg";
  const cartItem = items.find((item) => item.id === product?.id);
  const quantity = cartItem?.quantity || 0;
  const hasDiscount =
    product?.discountActive === true &&
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;
  const categoryList = useMemo(() => {
    const fromApi = (categoriesQuery.data ?? []).map((entry) => buildCategoryFromApi(entry));
    return fromApi.length > 0 ? fromApi : HEADSHOP_CATEGORIES;
  }, [categoriesQuery.data]);
  const categoryLabel = product?.category
    ? getCategoryBySlug(product.category, categoryList)?.name || product.category
    : "";
  const productDetails = [
    { label: "Categoria", value: categoryLabel },
    { label: "Subcategoria", value: product?.subcategory },
    { label: "Marca", value: product?.brand },
    { label: "Material", value: product?.material },
    { label: "Fotos", value: gallery.length > 0 ? `${gallery.length} imagem(ns)` : "" },
  ].filter((item) => Boolean(item.value));

  if (!Number.isFinite(productId) || productId <= 0) {
    return (
      <div className="paper-bg flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Produto invalido</h1>
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {productQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando produto...</p>
        ) : !product ? (
          <p className="text-sm text-muted-foreground">Produto nao encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <div className="rounded-[28px] border border-border bg-card p-3 shadow-sm">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-[320px] w-full rounded-lg object-contain md:h-[440px]"
                  onError={(event) => {
                    event.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>

              {gallery.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {gallery.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-16 w-16 overflow-hidden rounded-md border ${
                        index === selectedImageIndex ? "border-accent" : "border-border"
                      }`}
                    >
                      <img src={image} alt={`${product.name} miniatura ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground">Toque em qualquer miniatura para trocar a imagem principal.</p>
            </section>

            <section className="space-y-4">
              <div className="rounded-[28px] border border-border bg-white/85 p-5 shadow-sm">
                <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{product.name}</h1>
                {product.description ? <p className="mt-3 text-sm text-muted-foreground">{product.description}</p> : null}
              </div>

              {product.details ? (
                <div className="rounded-[28px] border border-border bg-white/85 p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Detalhes do produto
                  </p>
                  <div className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">
                    {product.details}
                  </div>
                </div>
              ) : null}

              {productDetails.length > 0 ? (
                <div className="rounded-[28px] border border-border bg-white/85 p-5 shadow-sm">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {productDetails.map((detail) => (
                      <div key={detail.label} className="rounded-2xl border border-border bg-muted/20 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{detail.label}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[28px] border border-border bg-white/85 p-5 shadow-sm">
                {hasDiscount ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground line-through">{formatCurrency(Number(product.originalPrice || 0))}</p>
                    <p className="text-3xl font-bold text-accent dark:text-white">{formatCurrency(product.price)}</p>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-accent dark:text-white">{formatCurrency(product.price)}</p>
                )}

                {quantity === 0 ? (
                  <Button
                    onClick={() =>
                      addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                      })
                    }
                    className="mt-4 h-11 w-full rounded-2xl bg-rasta-green text-white hover:bg-rasta-green/90"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Adicionar a sacola
                  </Button>
                ) : (
                  <div className="mt-4 space-y-2">
                    <div className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-muted">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rasta-red hover:bg-rasta-red/20"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[28px] text-center text-base font-semibold">{quantity}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rasta-green hover:bg-rasta-green/20"
                        onClick={() =>
                          addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image,
                            category: product.category,
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Total: {formatCurrency(product.price * quantity)}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;

