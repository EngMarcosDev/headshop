import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Repeat, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResumePaymentModal from "@/components/ResumePaymentModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { API_BASE, joinUrl } from "@/api/client";
import { formatPrice } from "@/lib/priceFormatter";
import { fetchAllProducts } from "@/api/products";

type HistoryOrderItem = {
  productId: number;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
};

type HistoryOrder = {
  id: number;
  orderNumber?: string;
  total: number;
  createdAt: string;
  status: "pendente" | "pago" | "enviado" | "cancelado";
  paymentStatus?: string;
  items?: HistoryOrderItem[];
};

// Resultado do "Pedir de novo" — quais entraram, quais não couberam por estoque/inativacao.
type ReorderResult = {
  orderRef: string;
  added: Array<{ name: string; quantity: number }>;
  partial: Array<{ name: string; requested: number; added: number; available: number }>;
  unavailable: Array<{ name: string; reason: string }>;
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

const HistoryPage = () => {
  const { user } = useAuth();
  const { addItem, items: cartItems, setIsOpen: openCart } = useCart();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "pendente" | "pago" | "enviado" | "cancelado">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [resumePayment, setResumePayment] = useState<{ id: number; orderNumber?: string } | null>(null);
  const [reorderResult, setReorderResult] = useState<ReorderResult | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["orders", user?.email],
    queryFn: async () => {
      const response = await fetch(joinUrl(API_BASE, `/users/${encodeURIComponent(user?.email ?? "")}/orders`));
      if (!response.ok) {
        throw new Error("Erro ao carregar histórico");
      }
      return (await response.json()) as HistoryOrder[];
    },
    enabled: Boolean(user?.email),
  });

  // Catálogo atual — usado pelo "Pedir de novo" pra checar estoque, imagem e
  // categoria atuais (o pedido antigo só guarda nome/preco/quantidade).
  // Mesma queryKey de ProductsPage, então compartilha cache.
  const catalogQuery = useQuery({
    queryKey: ["products", "all-listing"],
    queryFn: fetchAllProducts,
    staleTime: 120000,
  });

  const handleReorder = (order: HistoryOrder) => {
    const itemsRequested = Array.isArray(order.items) ? order.items : [];
    if (itemsRequested.length === 0) {
      setReorderResult({
        orderRef: order.orderNumber || `#${order.id}`,
        added: [],
        partial: [],
        unavailable: [{ name: "Pedido sem itens", reason: "O pedido não possui produtos para repetir." }],
      });
      return;
    }

    const catalog = catalogQuery.data ?? [];
    const catalogById = new Map(catalog.map((p) => [p.id, p]));
    const cartByProduct = new Map(cartItems.map((item) => [item.id, item.quantity]));

    const result: ReorderResult = {
      orderRef: order.orderNumber || `#${order.id}`,
      added: [],
      partial: [],
      unavailable: [],
    };

    for (const item of itemsRequested) {
      const requested = Math.max(1, Number(item.quantity || 1));
      const product = catalogById.get(item.productId);
      const displayName = item.productName || product?.name || `Produto #${item.productId}`;

      if (!product) {
        result.unavailable.push({ name: displayName, reason: "Produto não está mais disponível na loja." });
        continue;
      }

      const stock = typeof product.stockQty === "number" ? product.stockQty : null;
      const alreadyInCart = cartByProduct.get(product.id) || 0;

      // Sem estoque ou estoque zerado
      if (stock !== null && stock <= 0) {
        result.unavailable.push({ name: displayName, reason: "Indisponível no momento (sem estoque)." });
        continue;
      }

      // Quantidade que ainda cabe respeitando o que ja esta no carrinho
      const remainingCapacity = stock === null ? requested : Math.max(0, stock - alreadyInCart);
      const toAdd = Math.min(requested, remainingCapacity);

      if (toAdd <= 0) {
        result.unavailable.push({
          name: displayName,
          reason: `Limite de estoque atingido (você já tem ${alreadyInCart} no carrinho).`,
        });
        continue;
      }

      // Faz N chamadas ao addItem (cada chamada incrementa 1)
      let actuallyAdded = 0;
      for (let i = 0; i < toAdd; i += 1) {
        const ok = addItem(
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || "/placeholder.svg",
            category: product.category,
            stockQty: stock,
          },
          stock ?? undefined
        );
        if (!ok) break;
        actuallyAdded += 1;
      }

      if (actuallyAdded === requested) {
        result.added.push({ name: displayName, quantity: actuallyAdded });
      } else if (actuallyAdded > 0) {
        result.partial.push({
          name: displayName,
          requested,
          added: actuallyAdded,
          available: stock ?? actuallyAdded,
        });
      } else {
        result.unavailable.push({ name: displayName, reason: "Sem estoque disponível." });
      }
    }

    setReorderResult(result);
  };

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
              Histórico de Compras
            </h1>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar
            </Link>
          </div>

          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Área restrita de pagamento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Para segurança, sua carteira de pagamento fica disponível dentro do histórico e exige senha para abrir.
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
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Código do pedido
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex: BAC-1777..."
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
                >
                  <option value="all">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="enviado">Enviado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              {/* Inputs de data com rotulo + estilo consistente. ANTES ficavam
                  brancos/transparentes e o usuário mal via. */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  De
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-accent [color-scheme:dark] dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Até
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-accent [color-scheme:dark] dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-6">
            {ordersQuery.isLoading ? <p className="text-sm text-muted-foreground">Carregando histórico...</p> : null}
            {ordersQuery.isError ? <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico.</p> : null}
            {!ordersQuery.isLoading && !ordersQuery.isError && filteredOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido encontrado com os filtros selecionados.</p>
            ) : null}

            {visibleOrders.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  Exibindo {visibleOrders.length} de {filteredOrders.length} pedido(s)
                  {filteredOrders.length > 10 ? " (máximo 10 por vez)." : "."}
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
                          <th className="py-2 pr-3">Total</th>
                          <th className="py-2 text-right">Ação</th>
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
                            <td className="py-3 pr-3 font-semibold text-foreground">
                              {formatPrice(Number(order.total || 0), { decimals: 2 })}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {order.status === "pendente" ? (
                                  <Button
                                    size="sm"
                                    className="h-8 bg-rasta-green text-white hover:bg-rasta-green/90"
                                    onClick={() => setResumePayment({ id: order.id, orderNumber: order.orderNumber })}
                                  >
                                    Pagar
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1.5"
                                  onClick={() => handleReorder(order)}
                                >
                                  <Repeat className="h-3.5 w-3.5" />
                                  Pedir de novo
                                </Button>
                              </div>
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
                      <div className="mt-3 flex flex-col gap-2">
                        {order.status === "pendente" ? (
                          <Button
                            size="sm"
                            className="h-9 w-full bg-rasta-green text-white hover:bg-rasta-green/90"
                            onClick={() => setResumePayment({ id: order.id, orderNumber: order.orderNumber })}
                          >
                            Pagar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-full gap-1.5"
                          onClick={() => handleReorder(order)}
                        >
                          <Repeat className="h-3.5 w-3.5" />
                          Pedir de novo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />

      {resumePayment ? (
        <ResumePaymentModal
          orderId={resumePayment.id}
          orderNumber={resumePayment.orderNumber}
          onClose={() => {
            setResumePayment(null);
            void ordersQuery.refetch();
          }}
        />
      ) : null}

      {reorderResult ? (
        <ReorderResultModal
          result={reorderResult}
          onClose={() => setReorderResult(null)}
          onGoToCart={() => {
            setReorderResult(null);
            openCart(true);
          }}
        />
      ) : null}
    </div>
  );
};

interface ReorderResultModalProps {
  result: ReorderResult;
  onClose: () => void;
  onGoToCart: () => void;
}

const ReorderResultModal = ({ result, onClose, onGoToCart }: ReorderResultModalProps) => {
  const totalAdded =
    result.added.reduce((sum, entry) => sum + entry.quantity, 0) +
    result.partial.reduce((sum, entry) => sum + entry.added, 0);
  const hasIssues = result.partial.length + result.unavailable.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-rasta-green via-rasta-yellow to-rasta-red" />
        <div className="relative max-h-[80vh] overflow-y-auto p-5">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="mb-1 text-center text-lg font-display font-bold tracking-wide">
            {hasIssues ? "Pedido repetido (com avisos)" : "Pedido adicionado à sacola"}
          </h2>
          <p className="mb-4 text-center text-xs text-muted-foreground">
            Pedido <span className="font-semibold text-foreground">{result.orderRef}</span>
          </p>

          {totalAdded > 0 ? (
            <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                {totalAdded} {totalAdded === 1 ? "item adicionado" : "itens adicionados"} ao carrinho
              </p>
              {result.added.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5 text-xs text-foreground/80">
                  {result.added.map((entry) => (
                    <li key={entry.name}>• {entry.quantity}x {entry.name}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {result.partial.length > 0 ? (
            <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Adicionados parcialmente
              </p>
              <p className="mt-1 text-[11px] text-foreground/75">
                Estes produtos não tinham estoque suficiente para a quantidade pedida originalmente.
                Adicionamos a quantidade disponível agora:
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-foreground/85">
                {result.partial.map((entry) => (
                  <li key={entry.name}>
                    • <strong>{entry.name}</strong> — pediu {entry.requested}, adicionamos {entry.added}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.unavailable.length > 0 ? (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Não foi possível repetir
              </p>
              <p className="mt-1 text-[11px] text-foreground/75">
                Estes itens não estão disponíveis no momento. Você ainda pode comprar o restante.
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-foreground/85">
                {result.unavailable.map((entry) => (
                  <li key={entry.name}>
                    • <strong>{entry.name}</strong> — {entry.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Continuar comprando
            </Button>
            {totalAdded > 0 ? (
              <Button className="flex-1 bg-rasta-green text-white hover:bg-rasta-green/90" onClick={onGoToCart}>
                Ver sacola
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoryPage;
