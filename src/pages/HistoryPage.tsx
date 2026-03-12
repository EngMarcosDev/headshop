import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";

const HistoryPage = () => {
  const { user } = useAuth();
  const ordersQuery = useQuery({
    queryKey: ["orders", user?.email],
    queryFn: async () => {
      const response = await fetch(joinUrl(API_BASE, `/users/${encodeURIComponent(user?.email ?? "")}/orders`));
      if (!response.ok) {
        throw new Error("Erro ao carregar historico");
      }
      return response.json();
    },
    enabled: Boolean(user?.email),
  });

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl md:text-3xl font-display font-bold text-accent uppercase tracking-widest">
              Historico de Compras
            </h1>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar
            </Link>
          </div>

          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Area restrita de pagamento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Para seguranca, sua carteira de pagamento fica disponivel dentro do historico.
            </p>
            <Link
              to="/carteira"
              className="mt-3 inline-flex rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground hover:bg-muted/70"
            >
              Abrir Minha Carteira
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground space-y-2">
            {ordersQuery.isLoading && <p>Carregando historico...</p>}
            {ordersQuery.isError && <p>Nao foi possivel carregar o historico.</p>}
            {!ordersQuery.isLoading && !ordersQuery.isError && ordersQuery.data?.length === 0 && (
              <p>Nenhum pedido encontrado.</p>
            )}
            {(ordersQuery.data ?? []).map((order: any) => (
              <div key={order.id} className="rounded-md border border-border p-3">
                <p>Pedido #{order.id}</p>
                <p className="text-xs">Total: R$ {Number(order.total).toFixed(2).replace(".", ",")}</p>
                <p className="text-xs">Data: {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HistoryPage;
