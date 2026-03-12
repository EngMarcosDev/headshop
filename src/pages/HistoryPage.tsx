import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, joinUrl } from "@/api/client";
import { formatPrice } from "@/lib/priceFormatter";

type HistoryOrder = {
  id: number;
  orderNumber?: string;
  total: number;
  createdAt: string;
  status: "pendente" | "pago" | "enviado" | "cancelado";
  paymentStatus?: string;
  items?: Array<{ productName?: string; quantity?: number }>;
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

const HistoryPage = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "pendente" | "pago" | "enviado" | "cancelado">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["orders", user?.email],
    queryFn: async () => {
      const response = await fetch(joinUrl(API_BASE, `/users/${encodeURIComponent(user?.email ?? "")}/orders`));
      if (!response.ok) {
        throw new Error("Erro ao carregar historico");
      }
      return (await response.json()) as HistoryOrder[];
    },
    enabled: Boolean(user?.email),
  });

  const filteredOrders = useMemo(() => {
    const raw = Array.isArray(ordersQuery.data) ? ordersQuery.data : [];
    return raw.filter((order) => {
      const lowerQuery = query.trim().toLowerCase();
      const createdAt = new Date(order.createdAt);
      const matchText =
        !lowerQuery ||
        String(order.id).includes(lowerQuery) ||
        String(order.orderNumber || "").toLowerCase().includes(lowerQuery);
      const matchStatus = status === "all" || order.status === status;
      const matchFrom = !fromDate || createdAt >= new Date(`${fromDate}T00:00:00`);
      const matchTo = !toDate || createdAt <= new Date(`${toDate}T23:59:59`);
      return matchText && matchStatus && matchFrom && matchTo;
    });
  }, [ordersQuery.data, query, status, fromDate, toDate]);

  const visibleOrders = useMemo(() => filteredOrders.slice(0, 10), [filteredOrders]);
  const hasScrollableList = visibleOrders.length > 5;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col paper-bg">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10">
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
              Para seguranca, sua carteira de pagamento fica disponivel dentro do historico e exige senha para abrir.
            </p>
            <Link
              to="/carteira"
              state={{ fromHistory: true }}
              className="mt-3 inline-flex rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground hover:bg-muted/70"
            >
              Abrir Minha Carteira
            </Link>
          </div>

          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Codigo do pedido"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="enviado">Enviado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-6">
            {ordersQuery.isLoading ? <p className="text-sm text-muted-foreground">Carregando historico...</p> : null}
            {ordersQuery.isError ? <p className="text-sm text-muted-foreground">Nao foi possivel carregar o historico.</p> : null}
            {!ordersQuery.isLoading && !ordersQuery.isError && filteredOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido encontrado com os filtros selecionados.</p>
            ) : null}

            {visibleOrders.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  Exibindo {visibleOrders.length} de {filteredOrders.length} pedido(s)
                  {filteredOrders.length > 10 ? " (maximo 10 por vez)." : "."}
                </p>

                <div className="hidden overflow-x-auto md:block">
                  <div className={hasScrollableList ? "max-h-[320px] overflow-y-auto pr-1" : ""}>
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-3">Pedido</th>
                          <th className="py-2 pr-3">Data</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Itens</th>
                          <th className="py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border/60 last:border-0">
                            <td className="py-3 pr-3 font-medium text-foreground">
                              {order.orderNumber || `#${order.id}`}
                            </td>
                            <td className="py-3 pr-3 text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString("pt-BR")}
                            </td>
                            <td className="py-3 pr-3">
                              <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                                {statusLabel[order.status] || order.status}
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-muted-foreground">
                              {Array.isArray(order.items)
                                ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                                : 0}
                            </td>
                            <td className="py-3 font-semibold text-foreground">
                              {formatPrice(Number(order.total || 0), { decimals: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`grid grid-cols-1 gap-3 md:hidden ${hasScrollableList ? "max-h-[540px] overflow-y-auto pr-1" : ""}`}>
                  {visibleOrders.map((order) => (
                    <div key={order.id} className="rounded-lg border border-border p-3">
                      <p className="font-medium text-foreground">{order.orderNumber || `Pedido #${order.id}`}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("pt-BR")}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Status: {statusLabel[order.status] || order.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Itens: {Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatPrice(Number(order.total || 0), { decimals: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HistoryPage;
