/**
 * Utilitários robustos para manipulação e formatação de preços
 * Evita erros com .toFixed() quando o valor não é um número
 */

/**
 * Normaliza um preço para número seguro
 * @param price - Valor que pode ser string, número, null ou undefined
 * @param fallback - Valor padrão se inválido (padrão: 0)
 * @returns número seguro
 */
export const sanitizePrice = (price: any, fallback = 0): number => {
  // Se já é número válido, retorna
  if (typeof price === "number" && !isNaN(price)) {
    return Math.max(0, price); // Garante não-negativo
  }

  // Se é string, tenta converter
  if (typeof price === "string") {
    const parsed = parseFloat(price.trim());
    if (!isNaN(parsed)) {
      return Math.max(0, parsed);
    }
  }

  // Se null, undefined ou inválido
  if (price == null) {
    return fallback;
  }

  // Último recurso: fallback
  console.warn(`[priceFormatter] Preço inválido recebido:`, price, `Usando fallback: ${fallback}`);
  return fallback;
};

/**
 * Formata preço para exibição em BRL com 2 casas decimais
 * @param price - Valor que pode ser string, número, null ou undefined
 * @param options - Opções de formatação
 * @returns String formatada "R$ XX,XX"
 */
export const formatPrice = (
  price: any,
  options: {
    includeCurrency?: boolean; // Inclui "R$ " (padrão: true)
    decimals?: number; // Casas decimais (padrão: 2)
    useComma?: boolean; // Usa "," como separador decimal (padrão: true para pt-BR)
  } = {}
): string => {
  const {
    includeCurrency = true,
    decimals = 2,
    useComma = true,
  } = options;

  const sanitizedPrice = sanitizePrice(price, 0);
  const formatted = sanitizedPrice.toFixed(decimals);
  
  // Substitui "." por "," para pt-BR
  const displayValue = useComma ? formatted.replace(".", ",") : formatted;
  
  return includeCurrency ? `R$ ${displayValue}` : displayValue;
};

/**
 * Formata preço apenas com número (sem prefixo "R$")
 * @param price - Valor que pode ser string, número, null ou undefined
 * @param decimals - Casas decimais (padrão: 2)
 * @returns String formatada "XX,XX"
 */
export const formatPriceOnly = (price: any, decimals = 2): string => {
  return formatPrice(price, { includeCurrency: false, decimals });
};

/**
 * Formata múltiplos preços a uma vez (útil em .map())
 * @param items - Array de objetos com propriedade 'price'
 * @param priceKey - Chave da propriedade de preço (padrão: 'price')
 * @returns Array com preços normalizados
 */
export const sanitizePrices = <T extends Record<string, any>>(
  items: T[],
  priceKey: string = "price"
): (T & { [key: string]: number })[] => {
  return items.map((item) => ({
    ...item,
    [priceKey]: sanitizePrice(item[priceKey]),
  }));
};

/**
 * Valida se um valor é um preço válido
 * @param price - Valor a validar
 * @returns boolean
 */
export const isValidPrice = (price: any): boolean => {
  if (typeof price === "number") {
    return !isNaN(price) && price >= 0;
  }
  if (typeof price === "string") {
    const parsed = parseFloat(price.trim());
    return !isNaN(parsed) && parsed >= 0;
  }
  return false;
};

/**
 * Calcula total de múltiplos itens com preço e quantidade
 * @param items - Array com propriedades 'price' e 'quantity'
 * @returns Total calculado
 */
export const calculateTotal = (
  items: Array<{ price: any; quantity: any }>
): number => {
  return items.reduce((sum, item) => {
    const price = sanitizePrice(item.price, 0);
    const qty = typeof item.quantity === "number" && !isNaN(item.quantity)
      ? Math.max(0, item.quantity)
      : 0;
    return sum + price * qty;
  }, 0);
};

/**
 * Exemplo de uso em .map() para listas:
 * 
 * ✅ CORRETO (com validação):
 * ```tsx
 * items.map((item) => (
 *   <p>R$ {formatPrice(item.price, { includeCurrency: false })}</p>
 * ))
 * ```
 * 
 * ✅ SEGURO (com normalização prévia):
 * ```tsx
 * const normalizedItems = sanitizePrices(items);
 * normalizedItems.map((item) => (
 *   <p>R$ {item.price.toFixed(2)}</p>
 * ))
 * ```
 * 
 * ❌ ERRADO (sem validação):
 * ```tsx
 * items.map((item) => (
 *   <p>R$ {item.price.toFixed(2)}</p>  // ❌ Erro se price for string!
 * ))
 * ```
 */
