import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, Moon, ShoppingBag, Sun, User } from "lucide-react";
import { Button } from "./ui/button";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { applyTheme, readCurrentTheme, type ThemeMode } from "@/lib/theme";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";

const BRAND_ICON = "/assets/branding/logo-headshop.png";

interface HeaderProps {
  /**
   * Conteudo opcional renderizado abaixo do menu (ex: <PromoBanner />).
   * Quando passado, ele acompanha o header no efeito hide-on-scroll,
   * sumindo e reaparecendo junto.
   */
  bannerSlot?: ReactNode;
}

const Header = ({ bannerSlot }: HeaderProps = {}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlightCartBadge, setHighlightCartBadge] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const { totalItems, setIsOpen } = useCart();
  const { user } = useAuth();
  // Threshold ~120px: usuario rola um cartao de produto antes do header sumir.
  const isHeaderVisible = useHideOnScroll({ threshold: 120, revealDelta: 8 });

  const toggleTheme = () => {
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  };

  useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  useEffect(() => {
    const handleCartAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{ category?: string }>;
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
      <header
        className={`sticky top-0 z-40 w-full transform-gpu transition-transform duration-300 ease-out ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="bg-header">
          {/* Mobile com mais respiro vertical (py-2.5) e logo maior (h-9) pra dar destaque ao branding. */}
          <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
            <Link to="/" className="flex items-center gap-2 sm:gap-2 text-lg font-display font-bold text-header-foreground tracking-[0.22em] sm:text-2xl sm:tracking-widest hover:opacity-85 transition-opacity">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-sm sm:h-9 sm:w-9">
                <img src={BRAND_ICON} alt="HeadShop Bacaxita" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/40 sm:h-8 sm:w-8" />
              </span>
              <span>ABACAXITA</span>
            </Link>

            <div className="flex items-center gap-0 sm:gap-1">
              {user?.email ? (
                <Link
                  to="/conta/configuracoes"
                  className="hidden items-center gap-1.5 sm:flex h-8 px-2 text-[11px] uppercase tracking-[0.1em] text-header-foreground/80 hover:text-header-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  Minha Conta
                </Link>
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

              {/* Botão tema — visível no mobile, destaque na home */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Ativar modo noturno" : "Ativar modo claro"}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-white/15 bg-white/8 text-header-foreground/90 transition hover:bg-white/15 hover:text-white sm:flex"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-rasta-yellow" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="relative h-8 w-8 sm:h-9 sm:w-9 text-header-foreground/80 hover:bg-white/5 hover:text-header-foreground"
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
                className="h-8 w-8 sm:h-9 sm:w-9 text-header-foreground/80 hover:bg-white/5 hover:text-header-foreground"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </nav>

        <div className="rasta-stripe" />
        {bannerSlot}
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Header;
