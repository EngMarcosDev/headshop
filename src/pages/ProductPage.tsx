import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchProductById } from "@/api/products";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

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

  if (!Number.isFinite(productId) || productId <= 0) {
    return (
      <div className="paper-bg flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Produto inválido</h1>
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
          <p className="text-sm text-muted-foreground">Produto não encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-3">
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
            </section>

            <section className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{product.name}</h1>
              {product.description ? <p className="text-sm text-muted-foreground">{product.description}</p> : null}

              {hasDiscount ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground line-through">{formatCurrency(Number(product.originalPrice || 0))}</p>
                  <p className="text-3xl font-bold text-accent">{formatCurrency(product.price)}</p>
                </div>
              ) : (
                <p className="text-3xl font-bold text-accent">{formatCurrency(product.price)}</p>
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
                  className="h-11 w-full bg-rasta-green text-white hover:bg-rasta-green/90"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Adicionar à sacola
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-10 items-center justify-center gap-2 rounded-md bg-muted">
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
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
