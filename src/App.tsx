import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SignupPopup from "@/components/SignupPopup";
import CartSidebar from "@/components/CartSidebar";
import CookieConsent from "@/components/CookieConsent";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";
import HistoryPage from "./pages/HistoryPage";
import ErpAccessPage from "./pages/ErpAccessPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentErrorPage from "./pages/PaymentErrorPage";
import PaymentPendingPage from "./pages/PaymentPendingPage";
import CheckoutPage from "./pages/CheckoutPage";
import WalletPage from "./pages/WalletPage";
import { applyTheme, resolveInitialTheme } from "@/lib/theme";

const COOKIE_STORAGE_KEY = "bacaxita_cookie_preferences";
const LOGIN_PROMPT_SEEN_KEY = "bacaxita_login_prompt_seen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      staleTime: 120000,
    },
  },
});

const AppShell = () => {
  const { user } = useAuth();
  const [hasCookieChoice, setHasCookieChoice] = useState(false);
  const [hasSeenLoginPrompt, setHasSeenLoginPrompt] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [showSocialFloat, setShowSocialFloat] = useState(false);

  useEffect(() => {
    applyTheme(resolveInitialTheme());
  }, []);

  useEffect(() => {
    setHasCookieChoice(Boolean(window.localStorage.getItem(COOKIE_STORAGE_KEY)));
    setHasSeenLoginPrompt(Boolean(window.localStorage.getItem(LOGIN_PROMPT_SEEN_KEY)));
  }, []);

  useEffect(() => {
    const onCookieChoice = () => {
      setHasCookieChoice(true);
    };

    const onLoginPopupVisibility = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      const isOpen = Boolean(detail?.open);
      setIsLoginPopupOpen(isOpen);
      if (isOpen) {
        setHasSeenLoginPrompt(true);
      }
    };

    window.addEventListener("bacaxita:cookie-choice", onCookieChoice as EventListener);
    window.addEventListener("bacaxita:login-popup-visibility", onLoginPopupVisibility as EventListener);
    return () => {
      window.removeEventListener("bacaxita:cookie-choice", onCookieChoice as EventListener);
      window.removeEventListener("bacaxita:login-popup-visibility", onLoginPopupVisibility as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!hasCookieChoice || Boolean(user?.email) || hasSeenLoginPrompt || isLoginPopupOpen) return;
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("bacaxita:login-popup", { detail: { force: false } }));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [hasCookieChoice, hasSeenLoginPrompt, isLoginPopupOpen, user?.email]);

  useEffect(() => {
    const readyToShow = hasCookieChoice && (Boolean(user?.email) || hasSeenLoginPrompt) && !isLoginPopupOpen;
    if (!readyToShow) {
      setShowSocialFloat(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSocialFloat(true);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [hasCookieChoice, hasSeenLoginPrompt, isLoginPopupOpen, user?.email]);

  return (
    <>
      <Toaster />
      <Sonner />
      <CookieConsent />
      <SignupPopup />
      <CartSidebar />
      <WhatsAppFloat visible={showSocialFloat} />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categoria/:slug" element={<CategoryPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/erp" element={<ErpAccessPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/carteira" element={<WalletPage />} />
          <Route path="/pagamento/sucesso" element={<PaymentSuccessPage />} />
          <Route path="/pagamento/erro" element={<PaymentErrorPage />} />
          <Route path="/pagamento/pendente" element={<PaymentPendingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
