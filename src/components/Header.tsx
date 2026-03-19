import { useEffect, useState } from "react";
import { Menu, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import pineappleIcon from "@/assets/pineapple-icon.png";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlightCartBadge, setHighlightCartBadge] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleCartAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{ category?: string }>;
      const category = String(customEvent.detail?.category || "").toLowerCase();
      if (category !== "bacakits") return;

      setHighlightCartBadge(true);
      window.setTimeout(() => setHighlightCartBadge(false), 1300);
    };

    window.addEventListener("bacaxita:cart-added", handleCartAdded as EventListener);
    return () => {
      window.removeEventListener("bacaxita:cart-added", handleCartAdded as EventListener);
    };
  }, []);

  const triggerAuth = (mode: "login" | "register") => {
    window.dispatchEvent(new CustomEvent("bacaxita:login-popup", { detail: { mode } }));
  };

  return (
    <>
      <header className="w-full">
        <nav className="bg-header">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
            <h1 className="flex items-center gap-2 text-lg font-display font-bold text-header-foreground tracking-[0.2em] sm:text-2xl sm:tracking-widest">
              <img src={pineappleIcon} alt="Abacaxi Bacaxita" className="h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8" />
              <span>ABACAXITA</span>
            </h1>

            <div className="flex items-center gap-0.5 sm:gap-1">
              {user?.email ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="h-8 px-1.5 text-[10px] uppercase tracking-[0.12em] text-header-foreground/80 hover:bg-white/5 hover:text-header-foreground sm:px-2 sm:text-[11px] sm:tracking-wider"
                >
                  Sair
                </Button>
              ) : (
                <div className="hidden items-center gap-1 sm:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => triggerAuth("login")}
                    className="h-8 px-2 text-[11px] uppercase tracking-[0.1em] text-header-foreground/80 hover:bg-white/5 hover:text-header-foreground"
                  >
                    Login
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => triggerAuth("register")}
                    className="h-8 px-2 text-[11px] uppercase tracking-[0.1em] text-header-foreground/80 hover:bg-white/5 hover:text-header-foreground"
                  >
                    Sign up
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="relative h-9 w-9 text-header-foreground/80 hover:bg-white/5 hover:text-header-foreground"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rasta-green text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 ${
                      highlightCartBadge ? "cart-badge-glow" : ""
                    }`}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className="h-9 w-9 text-header-foreground/80 hover:bg-white/5 hover:text-header-foreground"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </nav>

        <div className="rasta-stripe" />
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Header;
