"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import {
  X, Loader2, MapPin, Package, ChevronDown, AlertCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ── Tipos ────────────────────────────────────────────────────────────────────

type OrderItem = {
  id: number; product_name: string; variation_label: string | null;
  unit_price: string; quantity: number; subtotal: string;
};

type Order = {
  id: number; status: string; user_id: number | null;
  total_price: string; cost_total: string | null;
  supplier_id: number | null; admin_notes: string | null;
  tracking_code: string | null; customer_notes: string | null;
  shipping_name: string; shipping_phone: string | null;
  shipping_zip_code: string; shipping_street: string; shipping_number: string;
  shipping_complement: string | null; shipping_neighborhood: string;
  shipping_city: string; shipping_state: string;
  items: OrderItem[]; created_at: string; updated_at: string;
};

type Supplier = { id: number; name: string };

// ── Constantes ───────────────────────────────────────────────────────────────

const STATUS_KEY: Record<string, string> = {
  pending: "admin_orders_status_pending",
  confirmed: "admin_orders_status_confirmed",
  paid: "admin_orders_status_paid",
  purchasing: "admin_orders_status_purchasing",
  shipped: "admin_orders_status_shipped",
  delivered: "admin_orders_status_delivered",
  cancelled: "admin_orders_status_cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  paid: "bg-cyan-50 text-cyan-600 border-cyan-100",
  purchasing: "bg-purple-50 text-purple-600 border-purple-100",
  shipped: "bg-indigo-50 text-indigo-600 border-indigo-100",
  delivered: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-gray-50 text-gray-400 border-gray-100",
};

const ALL_STATUSES = ["pending", "confirmed", "paid", "purchasing", "shipped", "delivered", "cancelled"];

function fmt(val: string | number) {
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function AdminPedidosPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  async function fetchOrders(status?: string) {
    const params = new URLSearchParams({ limit: "100" });
    if (status && status !== "all") params.set("status_filter", status);
    const res = await fetch(`${API}/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchOrders(statusFilter),
      fetch(`${API}/admin/suppliers`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).then((d) => setSuppliers(Array.isArray(d) ? d : [])),
    ]);
  }, [token]);

  useEffect(() => {
    if (token) fetchOrders(statusFilter);
  }, [statusFilter]);

  const supMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  return (
    <>
      {selected && (
        <OrderModal
          order={selected}
          token={token!}
          suppliers={suppliers}
          supMap={supMap}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelected(updated);
          }}
          onRefetch={() => fetchOrders(statusFilter)}
          statusKey={STATUS_KEY}
        />
      )}

      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t.admin_orders_title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t.admin_orders_subtitle}</p>
          </div>
          <span className="text-xs text-gray-400">{orders.length} {orders.length === 1 ? t.admin_orders_item : t.admin_orders_items}</span>
        </div>

        {/* Filtros de status */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === "all" ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            {t.admin_orders_all}
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === s ? "bg-gray-900 text-white border-gray-900" : `${STATUS_STYLE[s]} hover:opacity-80`}`}
            >
              {t[STATUS_KEY[s] as keyof typeof t]}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <Package size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">{t.admin_orders_none}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="shrink-0 w-10 text-center">
                  <p className="text-sm font-bold text-gray-900">#{order.id}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{order.shipping_name}</p>
                  <p className="text-xs text-gray-400">
                    {order.items.length} {order.items.length === 1 ? t.admin_orders_item : t.admin_orders_items} · {order.shipping_city}, {order.shipping_state}
                  </p>
                </div>

                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLE[order.status] ?? ""}`}>
                  {t[STATUS_KEY[order.status] as keyof typeof t] ?? order.status}
                </span>

                <span className="text-sm font-semibold text-gray-900 shrink-0">{fmt(order.total_price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Modal de gestão ───────────────────────────────────────────────────────────

function OrderModal({
  order, token, suppliers, supMap, onClose, onUpdated, onRefetch, statusKey,
}: {
  order: Order; token: string; suppliers: Supplier[];
  supMap: Record<number, string>;
  onClose: () => void;
  onUpdated: (o: Order) => void;
  onRefetch: () => void;
  statusKey: Record<string, string>;
}) {
  const { t } = useLanguage();
  const [newStatus, setNewStatus] = useState(order.status);
  const [trackingCode, setTrackingCode] = useState(order.tracking_code ?? "");
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? "");
  const [supplierId, setSupplierId] = useState(order.supplier_id ? String(order.supplier_id) : "");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true); setError("");
    const body: Record<string, unknown> = {};
    if (newStatus !== order.status) body.status = newStatus;
    if (trackingCode !== (order.tracking_code ?? "")) body.tracking_code = trackingCode.trim() || null;
    if (adminNotes !== (order.admin_notes ?? "")) body.admin_notes = adminNotes.trim() || null;
    if (supplierId !== (order.supplier_id ? String(order.supplier_id) : "")) {
      body.supplier_id = supplierId ? Number(supplierId) : null;
    }

    if (Object.keys(body).length === 0) { setSaving(false); return; }

    const res = await fetch(`${API}/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated: Order = await res.json();
      onUpdated(updated);
      onRefetch();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.detail ?? t.admin_orders_err_update);
    }
    setSaving(false);
  }

  async function handleCancel() {
    setCancelling(true); setError("");
    const res = await fetch(`${API}/admin/orders/${order.id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const updated: Order = await res.json();
      onUpdated(updated);
      onRefetch();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.detail ?? t.admin_orders_err_cancel);
    }
    setCancelling(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pedido #{order.id}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(order.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[order.status]}`}>
                {t[statusKey[order.status] as keyof typeof t] ?? order.status}
              </span>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-5">
              {/* Itens */}
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t.admin_orders_modal_items}</p>
                <ul className="flex flex-col gap-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                        {item.variation_label && <p className="text-xs text-gray-400">{item.variation_label}</p>}
                        <p className="text-xs text-gray-400">{fmt(item.unit_price)} × {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-gray-900 shrink-0">{fmt(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-100 mt-3 pt-3">
                  <span>{t.admin_orders_customer_total}</span>
                  <span>{fmt(order.total_price)}</span>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-gray-50 rounded-xl p-4 flex gap-3 col-span-2 sm:col-span-1">
                <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{order.shipping_name}</p>
                  {order.shipping_phone && <p className="text-xs text-gray-400">{order.shipping_phone}</p>}
                  <p>{order.shipping_street}, {order.shipping_number}{order.shipping_complement ? ` — ${order.shipping_complement}` : ""}</p>
                  <p>{order.shipping_neighborhood}</p>
                  <p>{order.shipping_city} — {order.shipping_state} · {order.shipping_zip_code}</p>
                </div>
              </div>

              {/* Notas do cliente */}
              {order.customer_notes && (
                <div className="col-span-2 sm:col-span-1 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-600 mb-1">{t.admin_orders_customer_notes}</p>
                  <p className="text-sm text-amber-800">{order.customer_notes}</p>
                </div>
              )}
            </div>

            {/* Campos de gestão */}
            <div className="border-t border-gray-100 pt-5 flex flex-col gap-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin_orders_manage}</p>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t.admin_orders_status}>
                  <div className="relative">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="inp appearance-none pr-8"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{t[statusKey[s] as keyof typeof t]}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label={t.admin_orders_supplier}>
                  <div className="relative">
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="inp appearance-none pr-8"
                    >
                      <option value="">{t.admin_orders_no_supplier}</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label={t.admin_orders_tracking} className="col-span-2">
                  <input
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="inp"
                    placeholder={t.admin_orders_tracking_placeholder}
                  />
                </Field>

                <Field label={t.admin_orders_internal_notes} className="col-span-2">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="inp resize-none"
                    placeholder={t.admin_orders_internal_placeholder}
                  />
                </Field>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
            {order.status !== "cancelled" ? (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 text-sm text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelling && <Loader2 size={13} className="animate-spin" />}
                {t.admin_orders_cancel}
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button onClick={onClose} className="border border-gray-200 text-gray-600 text-sm px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                {t.admin_orders_close}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? t.admin_orders_saving : t.admin_orders_save}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .inp {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s;
          background: white;
        }
        .inp:focus { border-color: #9ca3af; }
      `}</style>
    </>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}
