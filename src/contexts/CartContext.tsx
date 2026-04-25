import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
  stockQty?: number | null; // null = sem limite; number = limite real do estoque
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, maxQty?: number) => boolean;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const cartStorageKey = useMemo(() => {
    const normalizedEmail = user?.email?.trim().toLowerCase();
    return normalizedEmail ? `bacaxita_cart_${normalizedEmail}` : "bacaxita_cart_guest";
  }, [user?.email]);

  useEffect(() => {
    // One-time migration from legacy generic cart key.
    try {
      const legacy = window.localStorage.getItem("bacaxita_cart");
      if (!legacy) return;
      if (!window.localStorage.getItem("bacaxita_cart_guest")) {
        window.localStorage.setItem("bacaxita_cart_guest", legacy);
      }
      window.localStorage.removeItem("bacaxita_cart");
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(cartStorageKey);
      const parsed = saved ? (JSON.parse(saved) as CartItem[]) : [];
      const normalized = Array.isArray(parsed) ? parsed : [];

      // When a user logs in for the first time, migrate guest cart if user cart is empty.
      if (user?.email && normalized.length === 0) {
        const guestRaw = window.localStorage.getItem("bacaxita_cart_guest");
        const guestParsed = guestRaw ? (JSON.parse(guestRaw) as CartItem[]) : [];
        if (Array.isArray(guestParsed) && guestParsed.length > 0) {
          setItems(guestParsed);
          window.localStorage.setItem(cartStorageKey, JSON.stringify(guestParsed));
          return;
        }
      }

      setItems(normalized);
    } catch {
      setItems([]);
    }
  }, [cartStorageKey, user?.email]);

  const addItem = (newItem: Omit<CartItem, "quantity">, maxQty?: number): boolean => {
    // Limite SO se temos info clara: maxQty explicito (UI passou) ou newItem.stockQty number.
    // Se ambos vierem null/undefined, NAO bloqueamos no frontend — o backend valida
    // estoque ao criar o pedido (POST /orders consulta stockQty no banco e rejeita se faltar).
    const explicitMax =
      typeof maxQty === "number"
        ? maxQty
        : typeof newItem.stockQty === "number"
        ? newItem.stockQty
        : undefined;
    let allowed = true;
    setItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      const currentQty = existing ? existing.quantity : 0;
      if (typeof explicitMax === "number" && currentQty >= Math.max(0, Math.floor(explicitMax))) {
        allowed = false;
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    return allowed;
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        // So aplica cap se o item carrega stockQty conhecido; sem info, deixa passar.
        const cap = typeof item.stockQty === "number" ? Math.max(0, Math.floor(item.stockQty)) : null;
        const safeQty = cap !== null ? Math.min(quantity, cap) : quantity;
        return { ...item, quantity: safeQty };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      window.localStorage.removeItem(cartStorageKey);
    } catch {
      // Ignore storage errors.
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
    } catch {
      // Ignore storage errors to avoid breaking the app
    }
  }, [items, cartStorageKey]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
