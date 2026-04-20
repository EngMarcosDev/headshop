import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  discountLabel?: string | null;
  discountActive?: boolean;
  image: string;
  gallery?: string[];
  category?: string;
  isNew?: boolean;
  stockQty?: number | null;
  minStock?: number | null;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  discountLabel,
  discountActive,
  image,
  gallery,
  category,
  isNew = false,
  stockQty,
  minStock = 10,
}: ProductCardProps) => {
  const { addItem, items, updateQuantity } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [justAdded, setJustAdded] = useState(false);
  const [stockLimit, setStockLimit] = useState(false);

  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;
  const primaryImage = gallery?.[0] || image;

  // ── Estoque ────────────────────────────────────────────────────────────────
  const stock = typeof stockQty === "number" ? stockQty : null;
  const threshold = typeof minStock === "number" ? minStock : 10;
  const outOfStock = stock !== null && stock <= 0;
  const lastUnits = stock !== null && stock > 0 && stock <= 2;
  const lowStock = stock !== null && stock > 2 && stock <= threshold;
  const secondaryImage = gallery?.[1] || null;
  const hasDiscount =
    discountActive === true &&
    typeof originalPrice === "number" &&
    Number.isFinite(originalPrice) &&
    originalPrice > price;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
  const formattedOriginalPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(originalPrice || 0));
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price * quantity);

  const emitCartAdded = () => {
    window.dispatchEvent(
      new CustomEvent("bacaxita:cart-added", {
        detail: { category: String(category || "").toLowerCase() },
      })
    );
  };

  const handleAddToCart = () => {
    const ok = addItem({ id, name, price, image: primaryImage, category }, stock ?? undefined);
    if (ok) { setJustAdded(true); emitCartAdded(); }
    else { setStockLimit(true); window.setTimeout(() => setStockLimit(false), 2500); }
  };

  const handleIncrement = () => {
    const ok = addItem({ id, name, price, image: primaryImage, category }, stock ?? undefined);
    if (ok) { emitCartAdded(); }
    else { setStockLimit(true); window.setTimeout(() => setStockLimit(false), 2500); }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(id, quantity - 1);
    }
  };

  const openDetails = () => {
    const targetPath = `/produto/${id}`;
    if (isMobile) {
      window.open(targetPath, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(targetPath);
  };

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1200);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  return (
    <div className={`card-product group flex h-full min-h-[248px] flex-col p-2.5 sm:p-3 md:min-h-[270px] md:p-4 ${outOfStock ? "opacity-70" : ""}`}>
      {/* Badge "Lançamento" fica no topo — único que aparece acima da imagem */}
      {isNew && !outOfStock && (
        <div className="mb-1.5 sm:mb-2">
          <span className="badge-new">Lancamento</span>
        </div>
      )}

      <div
        className="mb-2.5 flex min-h-[132px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(248,234,193,0.52)_38%,rgba(141,101,57,0.14)_100%)] sm:min-h-[148px] md:mb-3 md:min-h-[170px]"
        onClick={openDetails}
      >
        <div className="relative h-full w-full">
          <img
            src={primaryImage}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${
              secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-105"
            }`}
            onError={(event) => {
              event.currentTarget.src = "/placeholder.svg";
            }}
          />
          {secondaryImage ? (
            <img
              src={secondaryImage}
              alt={`${name} imagem 2`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.src = primaryImage || "/placeholder.svg";
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-2">
        <div>
          <h3
            className="line-clamp-2 cursor-pointer text-[11px] font-semibold leading-tight text-foreground sm:text-xs md:text-sm"
            onClick={openDetails}
          >
            {name}
          </h3>
          {/* Desconto e preço — badges de estoque ficam logo após, nunca sobrepõem */}
          {hasDiscount ? (
            <div className="mt-1.5 flex items-center gap-2 md:mt-2">
              <span className="text-[11px] text-muted-foreground line-through sm:text-xs">{formattedOriginalPrice}</span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                {discountLabel || "Oferta"}
              </span>
            </div>
          ) : null}
          <p className="mt-1.5 text-base font-bold text-accent dark:text-white sm:text-lg md:mt-2 md:text-xl">{formattedPrice}</p>
          {/* Badge de disponibilidade — abaixo do preço, nunca acima da imagem */}
          {outOfStock && (
            <span className="mt-1 inline-block rounded-full bg-neutral-400/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
              Indisponível
            </span>
          )}
          {(lastUnits || lowStock) && !outOfStock && (
            <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-600">
              Últimas unidades
            </span>
          )}
        </div>
        <div className="mt-auto">
          {stockLimit && (
            <p className="mb-1 text-[9px] font-semibold text-rasta-red sm:text-[10px]">
              Limite de estoque atingido
            </p>
          )}
          {outOfStock ? (
            <Button
              size="sm"
              disabled
              className="h-8 w-full cursor-not-allowed bg-neutral-200 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500"
            >
              Indisponível
            </Button>
          ) : quantity === 0 ? (
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="h-8 w-full bg-rasta-green text-[10px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-rasta-green/90 md:text-xs md:tracking-wider"
            >
              <ShoppingBag className="mr-1 h-3.5 w-3.5" />
              {justAdded ? "Adicionado" : "Adicionar"}
            </Button>
          ) : (
            <>
              <div className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-muted sm:gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDecrement}
                  className="h-7 w-7 text-rasta-red hover:bg-rasta-red/20"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-[24px] text-center text-sm font-bold text-foreground">{quantity}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleIncrement}
                  className="h-7 w-7 text-rasta-green hover:bg-rasta-green/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {quantity > 0 && <p className="mt-1.5 text-[10px] text-muted-foreground sm:mt-2 sm:text-[11px]">Total: {formattedTotal}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
