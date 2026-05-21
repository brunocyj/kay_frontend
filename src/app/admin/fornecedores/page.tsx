"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { Plus, Pencil, Power, X, Loader2, ExternalLink } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type Supplier = {
  id: number;
  name: string;
  contact_name: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  country: string | null;
  notes: string | null;
  is_active: boolean;
};

const EMPTY: Omit<Supplier, "id" | "is_active"> = {
  name: "", contact_name: "", whatsapp: "", email: "",
  website: "", country: "", notes: "",
};

export default function FornecedoresPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  async function fetchSuppliers() {
    const res = await fetch(`${API}/admin/suppliers?active_only=${!showAll}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSuppliers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { if (token) fetchSuppliers(); }, [token, showAll]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setError("");
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name, contact_name: s.contact_name ?? "",
      whatsapp: s.whatsapp ?? "", email: s.email ?? "",
      website: s.website ?? "", country: s.country ?? "",
      notes: s.notes ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const body = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
    );

    try {
      const res = await fetch(
        editing ? `${API}/admin/suppliers/${editing.id}` : `${API}/admin/suppliers`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Erro ao salvar");
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Supplier) {
    await fetch(`${API}/admin/suppliers/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    fetchSuppliers();
  }

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {key === "notes" ? (
        <textarea
          value={form[key] ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          rows={3}
          placeholder={placeholder}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key] ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
        />
      )}
    </div>
  );

  return (
    <>
      {/* Modal criar/editar */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 pointer-events-auto flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editing ? t.admin_sup_edit_title : t.admin_sup_new_title}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {field("name", t.admin_sup_field_name, "text", "Nome da empresa")}
                {field("contact_name", t.admin_sup_field_contact, "text", "Nome do responsável")}
                {field("whatsapp", t.admin_sup_field_whatsapp, "text", "+55 11 90000-0000")}
                {field("email", t.admin_sup_field_email, "email", "contato@empresa.com")}
                {field("website", t.admin_sup_field_website, "url", "https://...")}
                {field("country", t.admin_sup_field_country, "text", "China")}
                {field("notes", t.admin_sup_field_notes, "text", t.admin_sup_field_notes_ph)}
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.admin_sup_cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? t.admin_sup_saving : editing ? t.admin_sup_save : t.admin_sup_create}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Página */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t.admin_sup_title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t.admin_sup_subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="rounded"
              />
              {t.admin_sup_show_inactive}
            </label>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Plus size={15} />
              {t.admin_sup_new}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm">{t.admin_sup_none}</p>
            <button onClick={openCreate} className="mt-3 text-sm text-gray-900 underline underline-offset-2">
              {t.admin_sup_create_first}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${s.is_active ? "bg-green-400" : "bg-gray-200"}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    {s.country && (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                        {s.country}
                      </span>
                    )}
                    {!s.is_active && (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                        {t.admin_sup_inactive_badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    {s.contact_name && <span>{s.contact_name}</span>}
                    {s.whatsapp && <span>{s.whatsapp}</span>}
                    {s.email && <span>{s.email}</span>}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      title={t.admin_sup_open_website}
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(s)}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title={t.admin_sup_edit}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => toggleActive(s)}
                    className={`p-2 rounded-lg transition-colors ${
                      s.is_active
                        ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                        : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                    }`}
                    title={s.is_active ? t.admin_sup_deactivate : t.admin_sup_activate}
                  >
                    <Power size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
