import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import SignupPopup from "@/components/SignupPopup";
import CartSidebar from "@/components/CartSidebar";
import CookieConsent from "@/components/CookieConsent";
import SitePopupManager from "@/components/SitePopupManager";
import AbacaxiTI from "@/components/AbacaxiTI";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PineappleLoader from "@/components/PineappleLoader";

const Index = lazy(() => import("./pages/Index"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ErpAccessPage = lazy(() => import("./pages/ErpAccessPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentErrorPage = lazy(() => import("./pages/PaymentErrorPage"));
const PaymentPendingPage = lazy(() => import("./pages/PaymentPendingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attempt) => Math.min(700 * 2 ** attempt, 2500),
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      staleTime: 300000,
      gcTime: 900000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AbacaxiTI />
            <SignupPopup />
            <CartSidebar />
            <CookieConsent />
            <WhatsAppFloat />
            <SitePopupManager />
            <Suspense fallback={<PineappleLoader fullScreen label="Carregando vitrine" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/categoria/:slug" element={<CategoryPage />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/produto/:id" element={<ProductPage />} />
                <Route path="/sobre" element={<AboutPage />} />
                <Route path="/contato" element={<ContactPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/carteira" element={<WalletPage />} />
                <Route path="/historico" element={<HistoryPage />} />
                <Route path="/erp" element={<ErpAccessPage />} />
                <Route path="/pagamento/sucesso" element={<PaymentSuccessPage />} />
                <Route path="/pagamento/erro" element={<PaymentErrorPage />} />
                <Route path="/pagamento/pendente" element={<PaymentPendingPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
