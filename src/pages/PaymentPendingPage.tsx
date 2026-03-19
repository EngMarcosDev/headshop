import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PaymentPendingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("orderId");
    if (id) setOrderId(id);
  }, [location.search]);

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="max-w-md text-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <h1 className="mb-2 text-2xl font-display font-bold text-foreground">Pagamento pendente</h1>
          <p className="text-sm text-muted-foreground">
            Seu pagamento esta em analise. Assim que for aprovado, seu pedido sera atualizado.
          </p>
          {orderId ? <p className="mt-2 text-xs text-muted-foreground">Pedido #{orderId}</p> : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentPendingPage;
