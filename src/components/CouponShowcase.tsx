import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Lock, Tag, TicketPercent } from "lucide-react";
import { fetchAvailableCoupons, type AvailableCoupon } from "@/api/coupons";
import { cn } from "@/lib/utils";

interface CouponShowcaseProps {
  /** Subtotal atual do carrinho (antes do desconto). */
  subtotal: number;
  /** Cupom já aplicado pelo cliente — pra destacar e desabilitar o botão "Aplicar". */
  appliedCode?: string | null;
  /** Callback quando o cliente clica em "Aplicar" num cupom destravado. */
  onApply: (coupon: AvailableCoupon) => void;
  /** Quando true, esconde no desktop e só aparece no mobile (regra do projeto). */
  mobileOnly?: boolean;
}

const formatBrl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDiscount = (coupon: AvailableCoupon) => {
  if (coupon.type === "PERCENT") return `${Number(coupon.value).toFixed(0)}% OFF`;
  return `${formatBrl(coupon.value)} OFF`;
};

/**
 * Vitrine gamificada de cupons (estilo iFood):
 * - Lista cupons ativos do backend
 * - Cada um mostra barra de progresso (subtotal / minOrderValue)
 * - Cupom com cadeado se ainda não destravou; "Aplicar" se já bateu o mínimo
 * - Cupom já aplicado vira "Aplicado" com check
 *
 * Reaproveita o sistema de cupons que já existe no ERP (Coupon.minOrderValue).
 * Frontend é puramente UX — toda a validação acontece no checkout.
 */
const CouponShowcase = ({ subtotal, appliedCode, onApply, mobileOnly = false }: CouponShowcaseProps) => {
  const couponsQuery = useQuery({
    queryKey: ["coupons", "available"],
    queryFn: fetchAvailableCoupons,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const coupons = couponsQuery.data ?? [];
  const visibleCoupons = useMemo(
    () =>
      // Ordena: aplicado primeiro, destravados depois, depois cadeado (mais perto de destravar primeiro).
      [...coupons].sort((a, b) => {
        const aMin = a.minOrderValue ?? 0;
        const bMin = b.minOrderValue ?? 0;
        const aApplied = appliedCode && a.code === appliedCode ? 0 : 1;
        const bApplied = appliedCode && b.code === appliedCode ? 0 : 1;
        if (aApplied !== bApplied) return aApplied - bApplied;
        const aUnlocked = subtotal >= aMin ? 0 : 1;
        const bUnlocked = subtotal >= bMin ? 0 : 1;
        if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
        return aMin - bMin;
      }),
    [coupons, subtotal, appliedCode]
  );

  if (couponsQuery.isLoading || visibleCoupons.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-[20px] border border-border bg-card p-3 sm:p-4",
        mobileOnly && "lg:hidden"
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <TicketPercent className="h-4 w-4 text-rasta-green" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Cupons disponíveis</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {visibleCoupons.length} {visibleCoupons.length === 1 ? "cupom" : "cupons"}
        </span>
      </div>

      <ul className="space-y-2.5">
        {visibleCoupons.map((coupon) => {
          const minValue = coupon.minOrderValue ?? 0;
          const isApplied = appliedCode && coupon.code === appliedCode;
          const isUnlocked = subtotal >= minValue;
          const remaining = Math.max(0, minValue - subtotal);
          const progress = minValue > 0
            ? Math.min(100, (subtotal / minValue) * 100)
            : 100;

          return (
            <li
              key={coupon.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border transition-all",
                isApplied
                  ? "border-rasta-green/60 bg-rasta-green/8"
                  : isUnlocked
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border bg-muted/30 opacity-90"
              )}
            >
              {/* Barra de progresso de fundo */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-all",
                  isApplied
                    ? "bg-rasta-green/15"
                    : isUnlocked
                      ? "bg-amber-500/12"
                      : "bg-amber-400/15"
                )}
                style={{ width: `${progress}%` }}
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-3 p-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isApplied
                      ? "bg-rasta-green text-white"
                      : isUnlocked
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isApplied ? <Check className="h-5 w-5" /> : isUnlocked ? <Tag className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{formatDiscount(coupon)}</p>
                    <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                      {coupon.code}
                    </p>
                  </div>
                  {coupon.description ? (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/75 sm:text-xs">
                      {coupon.description}
                    </p>
                  ) : null}
                  {!isUnlocked && minValue > 0 ? (
                    <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Adicione <strong>{formatBrl(remaining)}</strong> para destravar
                    </p>
                  ) : null}
                  {isUnlocked && !isApplied ? (
                    <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      ✨ Disponível! Subtotal mínimo de {formatBrl(minValue)} atingido
                    </p>
                  ) : null}
                  {isApplied ? (
                    <p className="mt-1 text-[11px] font-medium text-rasta-green">Cupom aplicado no pedido</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={!isUnlocked || Boolean(isApplied)}
                  onClick={() => onApply(coupon)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    isApplied
                      ? "cursor-default bg-rasta-green/20 text-rasta-green"
                      : isUnlocked
                        ? "bg-rasta-green text-white hover:bg-rasta-green/90"
                        : "cursor-not-allowed bg-muted text-muted-foreground"
                  )}
                >
                  {isApplied ? "Aplicado" : isUnlocked ? "Aplicar" : "Travado"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default CouponShowcase;
