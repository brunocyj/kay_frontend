"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";

export type CartItem = {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variation_id: number | null;
  variation_label: string | null;
  price: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: number, variationId: number | null) => void;
  updateQty: (productId: number, variationId: number | null, qty: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "bb_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Carrega do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Persiste no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const key = (productId: number, variationId: number | null) =>
    `${productId}-${variationId ?? "base"}`;

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const k = key(item.product_id, item.variation_id);
      const existing = prev.find((i) => key(i.product_id, i.variation_id) === k);
      if (existing) {
        return prev.map((i) =>
          key(i.product_id, i.variation_id) === k
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setCartOpen(true);
  }, []);

  const removeItem = useCallback((productId: number, variationId: number | null) => {
    setItems((prev) =>
      prev.filter((i) => key(i.product_id, i.variation_id) !== key(productId, variationId))
    );
  }, []);

  const updateQty = useCallback((productId: number, variationId: number | null, qty: number) => {
    if (qty <= 0) {
      removeItem(productId, variationId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        key(i.product_id, i.variation_id) === key(productId, variationId)
          ? { ...i, quantity: qty }
          : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, count, total,
      addItem, removeItem, updateQty, clearCart,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
