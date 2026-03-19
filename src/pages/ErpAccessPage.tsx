import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ErpAccessPage = () => {
  const navigate = useNavigate();
  const erpLoginUrl = import.meta.env.VITE_ERP_URL || "https://erp.bacaxita.com.br/login";

  useEffect(() => {
    window.location.href = erpLoginUrl;
  }, [erpLoginUrl]);

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="space-y-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <p>Redirecionando para o ERP...</p>
            <button
              onClick={() => (window.location.href = erpLoginUrl)}
              className="rounded-md bg-rasta-green px-3 py-2 text-xs font-semibold text-white"
            >
              Abrir ERP agora
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ErpAccessPage;
