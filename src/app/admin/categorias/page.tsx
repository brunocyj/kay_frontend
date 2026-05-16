"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Plus, Pencil, ChevronRight, FolderOpen, Folder, Power, X, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  parent_id: number | null;
  is_active: boolean;
  children: Category[];
};

type FormData = {
  name: string;
  slug: string;
  description: string;
  icon_url: string;
  parent_id: string;
  is_active: boolean;
};

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  description: "",
  icon_url: "",
  parent_id: "",
  is_active: true,
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function CategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  async function fetchCategories() {
    const res = await fetch(`${API}/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  function openCreate(parentId?: number) {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parent_id: parentId ? String(parentId) : "" });
    setError("");
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      icon_url: cat.icon_url ?? "",
      parent_id: cat.parent_id ? String(cat.parent_id) : "",
      is_active: cat.is_active,
    });
    setError("");
    setModalOpen(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: editing ? f.slug : slugify(name),
    }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Nome e slug são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      icon_url: form.icon_url.trim() || null,
    };

    if (!editing) {
      body.parent_id = form.parent_id ? Number(form.parent_id) : null;
    } else {
      body.is_active = form.is_active;
    }

    const url = editing
      ? `${API}/admin/categories/${editing.id}`
      : `${API}/admin/categories`;

    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.detail ?? "Erro ao salvar categoria.");
      setSaving(false);
      return;
    }

    await fetchCategories();
    setModalOpen(false);
    setSaving(false);
  }

  async function toggleActive(cat: Category) {
    await fetch(`${API}/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: !cat.is_active }),
    });
    fetchCategories();
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Todas as categorias raiz para o select de pai
  const rootCategories = categories.filter((c) => c.parent_id === null);

  return (
    <>
      {/* Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 pointer-events-auto flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editing ? "Editar categoria" : "Nova categoria"}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Nome *">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Eletrônicos"
                    className="input"
                  />
                </Field>

                <Field label="Slug *">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="Ex: eletronicos"
                    className="input font-mono text-xs"
                  />
                </Field>

                <Field label="Descrição">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descrição opcional..."
                    rows={2}
                    className="input resize-none"
                  />
                </Field>

                {!editing && (
                  <Field label="Categoria pai">
                    <select
                      value={form.parent_id}
                      onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                      className="input"
                    >
                      <option value="">Nenhuma (categoria raiz)</option>
                      {rootCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {editing && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div
                      onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                      className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_active ? "bg-gray-900" : "bg-gray-200"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                    <span className="text-sm text-gray-600">Ativa</span>
                  </label>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Categorias</h1>
            <p className="text-sm text-gray-400 mt-0.5">Organize os produtos em categorias e subcategorias</p>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={15} />
            Nova categoria
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-14 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <FolderOpen size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Nenhuma categoria cadastrada.</p>
            <button
              onClick={() => openCreate()}
              className="mt-4 text-sm text-gray-700 underline underline-offset-2 hover:text-gray-900"
            >
              Criar primeira categoria
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                depth={0}
                expanded={expanded}
                onToggleExpand={toggleExpand}
                onEdit={openEdit}
                onToggleActive={toggleActive}
                onAddChild={(id) => openCreate(id)}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #9ca3af;
        }
      `}</style>
    </>
  );
}

function CategoryRow({
  cat, depth, expanded, onToggleExpand, onEdit, onToggleActive, onAddChild,
}: {
  cat: Category;
  depth: number;
  expanded: Set<number>;
  onToggleExpand: (id: number) => void;
  onEdit: (cat: Category) => void;
  onToggleActive: (cat: Category) => void;
  onAddChild: (parentId: number) => void;
}) {
  const hasChildren = cat.children.length > 0;
  const isExpanded = expanded.has(cat.id);

  return (
    <>
      <div
        className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${!cat.is_active ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${20 + depth * 24}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => hasChildren && onToggleExpand(cat.id)}
          className={`w-5 h-5 flex items-center justify-center text-gray-300 transition-transform shrink-0 ${hasChildren ? "hover:text-gray-600 cursor-pointer" : "cursor-default"}`}
        >
          {hasChildren ? (
            <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          ) : (
            <span className="w-1 h-1 rounded-full bg-gray-200 block" />
          )}
        </button>

        {/* Ícone */}
        <div className="text-gray-300 shrink-0">
          {hasChildren ? <FolderOpen size={15} /> : <Folder size={15} />}
        </div>

        {/* Nome */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-900 font-medium">{cat.name}</span>
          <span className="ml-2 text-xs text-gray-400 font-mono">{cat.slug}</span>
          {cat.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{cat.description}</p>
          )}
        </div>

        {/* Badge filhos */}
        {hasChildren && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
            {cat.children.length} {cat.children.length === 1 ? "subcategoria" : "subcategorias"}
          </span>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          {depth === 0 && (
            <button
              onClick={() => onAddChild(cat.id)}
              title="Adicionar subcategoria"
              className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus size={13} />
            </button>
          )}
          <button
            onClick={() => onEdit(cat)}
            title="Editar"
            className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onToggleActive(cat)}
            title={cat.is_active ? "Desativar" : "Ativar"}
            className={`p-1.5 rounded-lg transition-colors ${
              cat.is_active
                ? "text-gray-300 hover:text-red-500 hover:bg-red-50"
                : "text-gray-300 hover:text-green-600 hover:bg-green-50"
            }`}
          >
            <Power size={13} />
          </button>
        </div>
      </div>

      {/* Filhos */}
      {isExpanded && cat.children.map((child) => (
        <CategoryRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onAddChild={onAddChild}
        />
      ))}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}
