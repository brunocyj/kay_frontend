"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CartDrawer() {
  const { items, count, total, removeItem, updateQty, cartOpen, closeCart } = useCart();
  const { user, openLogin } = useAuth();

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen]);

  // Fecha com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeCart]);

  if (!cartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[70]"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={17} className="text-gray-700" />
            <h2 className="text-sm font-semibold text-gray-900">Carrinho</h2>
            {count > 0 && (
              <span className="text-xs bg-gray-900 text-white rounded-full px-2 py-0.5 font-medium">
                {count}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="text-gray-300 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingCart size={40} className="text-gray-100" />
              <p className="text-sm text-gray-400">Seu carrinho está vazio</p>
              <button
                onClick={closeCart}
                className="text-sm text-gray-700 underline underline-offset-2 hover:text-gray-900"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => {
                const itemKey = `${item.product_id}-${item.variation_id ?? "base"}`;
                return (
                  <li key={itemKey} className="flex gap-3">
                    {/* Imagem */}
                    <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200 text-xs">
                          sem imagem
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      {item.variation_label && (
                        <p className="text-xs text-gray-400">{item.variation_label}</p>
                      )}
                      <p className="text-sm font-semibold text-gray-900">{fmt(item.price * item.quantity)}</p>

                      {/* Quantidade */}
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => updateQty(item.product_id, item.variation_id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:border-gray-400 transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-medium text-gray-900 w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product_id, item.variation_id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:border-gray-400 transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                        <button
                          onClick={() => removeItem(item.product_id, item.variation_id)}
                          className="ml-2 text-gray-200 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold text-gray-900">{fmt(total)}</span>
            </div>

            {user ? (
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors text-sm"
              >
                Finalizar compra <ArrowRight size={15} />
              </Link>
            ) : (
              <button
                onClick={() => { closeCart(); openLogin(); }}
                className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors text-sm"
              >
                Entrar para finalizar <ArrowRight size={15} />
              </button>
            )}

            <button
              onClick={closeCart}
              className="text-xs text-gray-400 hover:text-gray-700 text-center transition-colors"
            >
              Continuar comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
