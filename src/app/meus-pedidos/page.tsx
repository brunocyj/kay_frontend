"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Package, X, MapPin, ChevronRight, AlertCircle } from "lucide-react";
import PixInfo from "@/components/PixInfo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type OrderItem = {
  id: number;
  product_name: string;
  variation_label: string | null;
  unit_price: string;
  quantity: number;
  subtotal: string;
};

type Order = {
  id: number;
  status: string;
  total_price: string;
  shipping_name: string;
  shipping_street: string;
  shipping_number: string;
  shipping_city: string;
  shipping_state: string;
  tracking_code: string | null;
  customer_notes: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

const STATUS_KEY: Record<string, string> = {
  pending: "status_pending",
  confirmed: "status_confirmed",
  paid: "status_paid",
  processing: "status_processing",
  shipped: "status_shipped",
  delivered: "status_delivered",
  cancelled: "status_cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  paid: "bg-blue-50 text-blue-600 border-blue-100",
  processing: "bg-purple-50 text-purple-600 border-purple-100",
  shipped: "bg-indigo-50 text-indigo-600 border-indigo-100",
  delivered: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-gray-50 text-gray-400 border-gray-100",
};

function fmt(val: string | number) {
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MeusPedidosPage() {
  const { token, loading: authLoading, openLogin } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!authLoading && !token) {
      openLogin();
      router.replace("/");
    }
  }, [authLoading, token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [token]);

  async function handleCancel(order: Order) {
    setCancelling(true);
    setCancelError("");
    const res = await fetch(`${API}/orders/${order.id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const updated: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected(updated);
    } else {
      const err = await res.json().catch(() => ({}));
      setCancelError(err.detail ?? t.orders_cancel_error_default);
    }
    setCancelling(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <>
      {/* Modal de detalhe */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70]" onClick={() => { setSelected(null); setCancelError(""); }} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Pedido #{selected.id}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(selected.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[selected.status] ?? STATUS_STYLE.pending}`}>
                    {t[STATUS_KEY[selected.status] as keyof typeof t] ?? selected.status}
                  </span>
                  <button onClick={() => { setSelected(null); setCancelError(""); }} className="text-gray-300 hover:text-gray-700 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
                {/* Itens */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t.orders_modal_items}</p>
                  <ul className="flex flex-col gap-2">
                    {selected.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate">{item.product_name}</p>
                          {item.variation_label && (
                            <p className="text-xs text-gray-400">{item.variation_label}</p>
                          )}
                          <p className="text-xs text-gray-400">{fmt(item.unit_price)} × {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-gray-900 shrink-0">{fmt(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm font-semibold text-gray-900">
                    <span>{t.orders_modal_total}</span>
                    <span>{fmt(selected.total_price)}</span>
                  </div>
                </div>

                {/* Endereço */}
                <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                  <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{selected.shipping_name}</p>
                    <p>{selected.shipping_street}, {selected.shipping_number}</p>
                    <p>{selected.shipping_city} — {selected.shipping_state}</p>
                  </div>
                </div>

                {/* PIX — mostra apenas para pedidos aguardando */}
                {selected.status === "pending" && (
                  <PixInfo total={Number(selected.total_price)} />
                )}

                {/* Rastreio */}
                {selected.tracking_code && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-600 mb-1">{t.orders_modal_tracking}</p>
                    <p className="text-sm font-mono text-blue-800">{selected.tracking_code}</p>
                  </div>
                )}

                {/* Observações */}
                {selected.customer_notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t.orders_modal_notes}</p>
                    <p className="text-sm text-gray-600">{selected.customer_notes}</p>
                  </div>
                )}

                {/* Erro ao cancelar */}
                {cancelError && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle size={13} /> {cancelError}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => { setSelected(null); setCancelError(""); }}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {t.orders_modal_close}
                </button>
                {selected.status === "pending" && (
                  <button
                    onClick={() => handleCancel(selected)}
                    disabled={cancelling}
                    className="flex items-center gap-2 text-sm text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelling && <Loader2 size={13} className="animate-spin" />}
                    {t.orders_modal_cancel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">{t.orders_title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.orders_subtitle}</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center text-center gap-4">
            <Package size={40} className="text-gray-200" />
            <p className="text-sm text-gray-400">{t.orders_none}</p>
            <a href="/produtos" className="text-sm text-gray-900 underline underline-offset-2 hover:text-gray-700">
              {t.orders_see_products}
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => { setSelected(order); setCancelError(""); }}
                className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all text-left w-full"
              >
                {/* Data + número */}
                <div className="shrink-0 text-center w-12">
                  <p className="text-lg font-bold text-gray-900 leading-none">
                    {new Date(order.created_at).getDate().toString().padStart(2, "0")}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </p>
                </div>

                <div className="w-px h-10 bg-gray-100 shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{t.orders_order}{order.id}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[order.status] ?? STATUS_STYLE.pending}`}>
                      {t[STATUS_KEY[order.status] as keyof typeof t] ?? order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {order.items.length} {order.items.length === 1 ? t.orders_items_one : t.orders_items_many} ·{" "}
                    {order.shipping_city}, {order.shipping_state}
                    {order.tracking_code && ` · ${t.orders_tracking_available}`}
                  </p>
                </div>

                {/* Total + seta */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{fmt(order.total_price)}</span>
                  <ChevronRight size={15} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
