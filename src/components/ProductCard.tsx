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
}: ProductCardProps) => {
  const { addItem, items, updateQuantity } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;
  const primaryImage = gallery?.[0] || image;
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
    addItem({ id, name, price, image: primaryImage, category });
    setJustAdded(true);
    emitCartAdded();
  };

  const handleIncrement = () => {
    addItem({ id, name, price, image: primaryImage, category });
    emitCartAdded();
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(id, quantity - 1);
    }
  };

  const openDetails = () => {
    navigate(`/produto/${id}`);
  };

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1200);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  return (
    <div className="card-product group flex h-full min-h-[248px] flex-col p-2.5 sm:p-3 md:min-h-[270px] md:p-4">
      {isNew && (
        <div className="mb-1.5 sm:mb-2">
          <span className="badge-new">Lancamento</span>
        </div>
      )}

      <div
        className={`mb-2.5 flex h-[110px] items-center justify-center overflow-hidden rounded-md bg-muted/50 sm:h-[120px] md:mb-3 md:h-[140px] ${
          isMobile ? "cursor-pointer" : ""
        }`}
        onClick={isMobile ? openDetails : undefined}
      >
        <div className="relative h-full w-full">
          <img
            src={primaryImage}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-contain transition-all duration-300 sm:max-h-[110px] md:max-h-[130px] ${
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
              className="absolute inset-0 h-full w-full object-contain opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 sm:max-h-[110px] md:max-h-[130px]"
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
            className={`line-clamp-2 text-[11px] font-semibold leading-tight text-foreground sm:text-xs md:text-sm ${
              isMobile ? "cursor-pointer" : ""
            }`}
            onClick={isMobile ? openDetails : undefined}
          >
            {name}
          </h3>
          {hasDiscount ? (
            <div className="mt-1.5 flex items-center gap-2 md:mt-2">
              <span className="text-[11px] text-muted-foreground line-through sm:text-xs">{formattedOriginalPrice}</span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                {discountLabel || "Oferta"}
              </span>
            </div>
          ) : null}
          <p className="mt-1.5 text-base font-bold text-accent sm:text-lg md:mt-2 md:text-xl">{formattedPrice}</p>
        </div>
        <div className="mt-auto">
          {quantity === 0 ? (
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
