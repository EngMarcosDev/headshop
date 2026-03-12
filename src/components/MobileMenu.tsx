import { useEffect, useRef, useState } from "react";
import { Moon, Sun, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { applyTheme, readCurrentTheme, type ThemeMode } from "@/lib/theme";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuLinks = [
  { name: "Inicio", href: "/" },
  { name: "Produtos", href: "/produtos" },
  { name: "Sobre", href: "/sobre" },
  { name: "Contato", href: "/contato" },
];

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const links = [
    ...menuLinks,
    ...(user ? [{ name: "Historico de Compras", href: "/historico" }] : []),
  ];
  const erpLoginUrl = import.meta.env.VITE_ERP_URL || "https://erp.bacaxita.com.br/login";

  const selectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
  };

  const openAuth = (mode: "login" | "register") => {
    window.dispatchEvent(new CustomEvent("bacaxita:login-popup", { detail: { mode } }));
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    setTheme(readCurrentTheme());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed top-0 right-0 z-50 h-full w-[86vw] max-w-80 bg-header shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span id="mobile-menu-title" className="font-display text-lg font-bold tracking-widest text-header-foreground">
              MENU
            </span>
            <button onClick={onClose} aria-label="Fechar menu" className="p-1 text-header-foreground/80 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-full border border-white/15 bg-white/5 px-2 py-1.5">
            <span className="pl-2 text-[10px] uppercase tracking-[0.16em] text-header-foreground/70">Aparencia</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Modo claro"
                onClick={() => selectTheme("light")}
                className={`rounded-full p-1.5 transition ${
                  theme === "light"
                    ? "bg-rasta-yellow text-primary shadow"
                    : "text-header-foreground/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Modo noturno"
                onClick={() => selectTheme("dark")}
                className={`rounded-full p-1.5 transition ${
                  theme === "dark"
                    ? "bg-rasta-green text-white shadow"
                    : "text-header-foreground/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {!user?.email ? (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openAuth("register")}
                className="rounded-lg border border-rasta-yellow/35 bg-rasta-yellow/15 px-3 py-2 text-sm font-medium text-rasta-yellow transition hover:bg-rasta-yellow/25"
              >
                Sign up
              </button>
            </div>
          ) : null}

          {links.map((link, index) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={onClose}
              ref={index === 0 ? firstLinkRef : undefined}
              className="rounded-lg px-4 py-3 text-base font-medium text-header-foreground/90 transition-all hover:bg-white/10 hover:text-white"
            >
              {link.name}
            </Link>
          ))}

          {user?.isAdmin && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="px-4 py-1 text-[10px] uppercase tracking-[0.24em] text-header-foreground/55">Admin</p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = erpLoginUrl;
                  onClose();
                }}
                className="w-full rounded-lg border border-rasta-yellow/35 bg-rasta-yellow/10 px-4 py-3 text-left text-base font-semibold text-rasta-yellow transition-all hover:bg-rasta-yellow/20 hover:text-white"
              >
                ERP Bacaxita
              </button>
            </div>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
      </div>
    </>
  );
};

export default MobileMenu;
