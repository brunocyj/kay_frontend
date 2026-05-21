"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShoppingBag, Users, Package, TrendingUp, Clock, CheckCircle } from "lucide-react";

type Overview = {
  total_users: number;
  total_products: number;
  total_orders: number;
  pending_orders: number;
  awaiting_payment: number;
  awaiting_payment_confirmation: number;
  gross_revenue: string;
  total_cost: string;
  estimated_profit: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export default function AdminDashboard() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/dashboard/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setOverview)
      .finally(() => setLoading(false));
  }, [token]);

  const fmt = (v: string | number) =>
    `R$ ${parseFloat(String(v)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const cards = overview
    ? [
        { label: t.admin_dash_customers, value: overview.total_users, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
        { label: t.admin_dash_products, value: overview.total_products, icon: Package, color: "text-purple-500", bg: "bg-purple-50" },
        { label: t.admin_dash_total_orders, value: overview.total_orders, icon: ShoppingBag, color: "text-gray-600", bg: "bg-gray-100" },
        { label: t.admin_dash_pending, value: overview.pending_orders, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
        { label: t.admin_dash_awaiting_pay, value: overview.awaiting_payment, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
        { label: t.admin_dash_to_review, value: overview.awaiting_payment_confirmation, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        { label: t.admin_dash_revenue, value: fmt(overview.gross_revenue), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: t.admin_dash_profit, value: fmt(overview.estimated_profit), icon: TrendingUp, color: "text-emerald-700", bg: "bg-emerald-50" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t.admin_dash_title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t.admin_dash_subtitle}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
              <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center`}>
                <c.icon size={16} className={c.color} />
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{c.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
