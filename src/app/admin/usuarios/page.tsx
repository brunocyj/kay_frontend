"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { Power, Search, Building2, User as UserIcon } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type User = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  person_type: "PF" | "PJ";
  company_name: string | null;
  cnpj: string | null;
  role: "superadmin" | "admin" | "buyer";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

export default function UsuariosPage() {
  const { token } = useAuth();
  const { t } = useLanguage();

  const ROLE_LABEL: Record<string, string> = {
    buyer: t.admin_users_role_buyer_label,
    admin: t.admin_users_role_admin_label,
    superadmin: "Superadmin",
  };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<User | null>(null);

  async function fetchUsers() {
    const params = new URLSearchParams({ limit: "100" });
    if (roleFilter !== "all") params.append("role", roleFilter);
    if (statusFilter !== "all") params.append("is_active", statusFilter === "active" ? "true" : "false");

    const res = await fetch(`${API}/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { if (token) fetchUsers(); }, [token, roleFilter, statusFilter]);

  async function toggleActive(user: User) {
    await fetch(`${API}/admin/users/${user.id}/toggle-active`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSelected(null);
    fetchUsers();
  }

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Modal de detalhe */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSelected(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 pointer-events-auto flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  {selected.person_type === "PJ" ? <Building2 size={18} /> : <UserIcon size={18} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.full_name}</p>
                  <p className="text-xs text-gray-400">@{selected.username}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                <Row label={t.admin_users_label_email} value={selected.email} />
                <Row label={t.admin_users_label_type} value={selected.person_type === "PF" ? t.admin_users_type_pf : t.admin_users_type_pj} />
                {selected.company_name && <Row label={t.admin_users_label_company} value={selected.company_name} />}
                {selected.cnpj && <Row label="CNPJ" value={selected.cnpj} />}
                {selected.phone && <Row label={t.admin_users_label_phone} value={selected.phone} />}
                <Row label={t.admin_users_label_role} value={ROLE_LABEL[selected.role]} />
                <Row label={t.admin_users_label_verified} value={selected.is_verified ? t.admin_users_yes : t.admin_users_no} />
                <Row label={t.admin_users_label_status} value={selected.is_active ? t.admin_users_status_active : t.admin_users_status_inactive} />
                <Row label={t.admin_users_label_since} value={new Date(selected.created_at).toLocaleDateString("pt-BR")} />
              </div>

              {selected.role === "buyer" && (
                <button
                  onClick={() => toggleActive(selected)}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selected.is_active
                      ? "bg-red-50 text-red-500 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  <Power size={14} />
                  {selected.is_active ? t.admin_users_deactivate : t.admin_users_reactivate}
                </button>
              )}

              <button
                onClick={() => setSelected(null)}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors text-center"
              >
                {t.admin_users_close}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t.admin_users_title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.admin_users_subtitle}</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.admin_users_search}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 text-gray-600"
          >
            <option value="all">{t.admin_users_all_roles}</option>
            <option value="buyer">{t.admin_users_role_buyer}</option>
            <option value="admin">{t.admin_users_role_admin}</option>
            <option value="superadmin">{t.admin_users_role_superadmin}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 text-gray-600"
          >
            <option value="all">{t.admin_users_all_status}</option>
            <option value="active">{t.admin_users_active}</option>
            <option value="inactive">{t.admin_users_inactive}</option>
          </select>

          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} {filtered.length === 1 ? t.admin_users_count_one : t.admin_users_count_many}
          </span>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-14 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400">{t.admin_users_none}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelected(u)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                  {u.person_type === "PJ" ? <Building2 size={14} /> : <UserIcon size={14} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{u.full_name}</span>
                    {u.person_type === "PJ" && u.company_name && (
                      <span className="text-xs text-gray-400 truncate hidden sm:block">— {u.company_name}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{u.email}</span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    u.role === "buyer"
                      ? "border-gray-100 text-gray-400 bg-gray-50"
                      : "border-blue-100 text-blue-500 bg-blue-50"
                  }`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-green-400" : "bg-gray-200"}`} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 text-right">{value}</span>
    </div>
  );
}
