import { apiGet } from "./client";

export type AvailableCoupon = {
  id: number;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderValue: number | null;
  expiresAt: string | null;
};

/**
 * Lista cupons ativos pra exibir na "vitrine" estilo iFood.
 * Backend valida `minOrderValue` no momento de aplicar — exibir tudo aqui é
 * seguro (mesmo se um usuario pegar o code, o checkout rejeita se nao bater).
 */
export async function fetchAvailableCoupons(): Promise<AvailableCoupon[]> {
  try {
    const data = await apiGet<AvailableCoupon[]>("/coupons/available");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
