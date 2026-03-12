import { Link, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const AdminControlPage = () => {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const erpLoginUrl = import.meta.env.VITE_ERP_URL || "https://erp.bacaxita.com.br/login";
  const apiUrl = import.meta.env.VITE_API_URL || "https://bacaxita.com.br/api/headshop";

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-3xl font-display font-bold text-accent uppercase tracking-widest">
              Controle
            </h1>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground space-y-3">
            <p>Portal administrativo reservado para a equipe Bacaxita.</p>
            <p>ERP Bacaxita conectado ao ambiente principal.</p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => window.open(erpLoginUrl, "_blank")}
                className="px-3 py-2 rounded-md bg-rasta-green text-white text-xs font-semibold"
              >
                Abrir ERP Bacaxita
              </button>
              <button
                onClick={() => window.open(apiUrl, "_blank")}
                className="px-3 py-2 rounded-md bg-muted text-foreground text-xs font-semibold"
              >
                Ver API
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminControlPage;
