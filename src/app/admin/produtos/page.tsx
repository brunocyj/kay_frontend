"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Plus, Pencil, Power, X, Loader2, Package,
  Truck, Layers, Star, ChevronDown, Trash2, ImageIcon, Upload, FolderPlus,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Category = { id: number; name: string; children: Category[] };

type Supplier = { id: number; name: string };

type Variation = {
  id: number; name: string; value: string;
  price_modifier: string; stock: number; sku: string | null; is_active: boolean;
};

type ProductSupplier = {
  id: number; supplier_id: number; cost_price: string;
  supplier_sku: string | null; notes: string | null; is_preferred: boolean;
};

type ProductImage = {
  id: number; url: string; alt_text: string | null; order: number; is_cover: boolean;
};

type Product = {
  id: number; name: string; slug: string;
  short_description: string | null; description: string | null;
  category_id: number | null; price: string; units_per_box: number | null;
  is_active: boolean; is_featured: boolean;
  images: ProductImage[]; variations: Variation[]; suppliers: ProductSupplier[];
  created_at: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");
}

function fmt(val: string | number) {
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function ProdutosPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function fetchAll() {
    const headers = { Authorization: `Bearer ${token}` };
    const [p, c, s] = await Promise.all([
      fetch(`${API}/admin/products?limit=100`, { headers }).then((r) => r.json()),
      fetch(`${API}/categories`).then((r) => r.json()),
      fetch(`${API}/admin/suppliers`, { headers }).then((r) => r.json()),
    ]);
    setProducts(Array.isArray(p) ? p : []);
    setCategories(Array.isArray(c) ? c : []);
    setSuppliers(Array.isArray(s) ? s : []);
    setLoading(false);
  }

  useEffect(() => { if (token) fetchAll(); }, [token]);

  function openCreate() { setSelected(null); setModalOpen(true); }
  function openEdit(p: Product) { setSelected(p); setModalOpen(true); }

  async function toggleActive(p: Product) {
    await fetch(`${API}/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    fetchAll();
  }

  async function deletePermanent(p: Product) {
    if (!confirm(t.admin_prod_delete_confirm.replace("{name}", p.name))) return;
    await fetch(`${API}/admin/products/${p.id}?permanent=true`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  }

  // Achata categorias para o select
  const flatCategories: { id: number; label: string }[] = [];
  function flattenCats(cats: Category[], depth = 0) {
    cats.forEach((c) => {
      flatCategories.push({ id: c.id, label: "  ".repeat(depth) + c.name });
      if (c.children?.length) flattenCats(c.children, depth + 1);
    });
  }
  flattenCats(categories);

  const catMap = Object.fromEntries(flatCategories.map((c) => [c.id, c.label.trim()]));
  const supMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  return (
    <>
      {modalOpen && (
        <ProductModal
          token={token!}
          product={selected}
          categories={flatCategories}
          suppliers={suppliers}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchAll(); }}
        />
      )}

      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t.admin_prod_title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t.admin_prod_subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/produtos/massa"
              className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FolderPlus size={15} /> {t.admin_bulk_new}
            </Link>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Plus size={15} /> {t.admin_prod_new}
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <Package size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">{t.admin_prod_none}</p>
            <button onClick={openCreate} className="mt-4 text-sm text-gray-700 underline underline-offset-2 hover:text-gray-900">
              {t.admin_prod_new}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {products.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${!p.is_active ? "opacity-50" : ""}`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                    {p.is_featured && <Star size={12} className="text-amber-400 shrink-0" fill="currentColor" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{catMap[p.category_id ?? -1] ?? t.admin_prod_no_category}</span>
                    {p.suppliers.length > 0 && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Truck size={10} /> {p.suppliers.length} fornecedor{p.suppliers.length > 1 ? "es" : ""}
                      </span>
                    )}
                    {p.variations.length > 0 && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Layers size={10} /> {p.variations.length} variação{p.variations.length > 1 ? "ões" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preço */}
                <span className="text-sm font-semibold text-gray-900 shrink-0">{fmt(p.price)}</span>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title={t.admin_prod_edit}>
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`p-1.5 rounded-lg transition-colors ${p.is_active ? "text-gray-300 hover:text-red-500 hover:bg-red-50" : "text-gray-300 hover:text-green-600 hover:bg-green-50"}`}
                    title={p.is_active ? t.admin_cat_deactivate : t.admin_cat_activate}
                  >
                    <Power size={13} />
                  </button>
                  <button
                    onClick={() => deletePermanent(p)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t.admin_prod_delete}
                  >
                    <Trash2 size={13} />
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

// ── Modal com abas ───────────────────────────────────────────────────────────

type Tab = "info" | "images" | "suppliers" | "variations";

function ProductModal({
  token, product, categories, suppliers, onClose, onSaved,
}: {
  token: string;
  product: Product | null;
  categories: { id: number; label: string }[];
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const isEdit = !!product;
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Dados básicos ──────────────────────────────────────────────────────────
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [unitsPerBox, setUnitsPerBox] = useState(product?.units_per_box ? String(product.units_per_box) : "");
  const [shortDesc, setShortDesc] = useState(product?.short_description ?? "");
  const [desc, setDesc] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(String(product?.category_id ?? ""));
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  // ── Imagens ────────────────────────────────────────────────────────────────
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [uploadingImg, setUploadingImg] = useState(false);

  // ── Fornecedores ───────────────────────────────────────────────────────────
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>(product?.suppliers ?? []);
  const [newSupplierId, setNewSupplierId] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newSupplierSku, setNewSupplierSku] = useState("");
  const [addingSupplier, setAddingSupplier] = useState(false);

  // ── Variações ──────────────────────────────────────────────────────────────
  const [variations, setVariations] = useState<Variation[]>(product?.variations ?? []);
  const [varName, setVarName] = useState("");
  const [varValue, setVarValue] = useState("");
  const [varPrice, setVarPrice] = useState("0");
  const [varStock, setVarStock] = useState("0");
  const [varSku, setVarSku] = useState("");
  const [addingVar, setAddingVar] = useState(false);

  // Produto criado nesta sessão (para adicionar fornecedores/variações após criar)
  const [createdProductId, setCreatedProductId] = useState<number | null>(product?.id ?? null);

  function handleNameChange(v: string) {
    setName(v);
    if (!isEdit) setSlug(slugify(v));
  }

  async function saveInfo() {
    if (!name.trim() || !slug.trim() || !price) { setError("Nome, slug e preço são obrigatórios."); return; }
    setSaving(true); setError("");

    const body: Record<string, unknown> = {
      name: name.trim(), slug: slug.trim(),
      short_description: shortDesc.trim() || null,
      description: desc.trim() || null,
      category_id: categoryId ? Number(categoryId) : null,
      price: Number(price),
      units_per_box: unitsPerBox ? Number(unitsPerBox) : null,
      is_featured: isFeatured,
    };
    if (isEdit) body.is_active = isActive;

    const url = createdProductId
      ? `${API}/admin/products/${createdProductId}`
      : `${API}/admin/products`;

    const res = await fetch(url, {
      method: createdProductId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.detail ?? "Erro ao salvar produto.");
      setSaving(false); return;
    }

    const saved: Product = await res.json();
    setCreatedProductId(saved.id);
    setSaving(false);

    if (!isEdit) {
      setTab("suppliers");
    } else {
      onSaved();
    }
  }

  async function addSupplier() {
    if (!newSupplierId || !newCostPrice) return;
    setAddingSupplier(true);
    const res = await fetch(`${API}/admin/products/${createdProductId}/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        supplier_id: Number(newSupplierId),
        cost_price: Number(newCostPrice),
        supplier_sku: newSupplierSku.trim() || null,
        is_preferred: productSuppliers.length === 0,
      }),
    });
    if (res.ok) {
      const data: ProductSupplier = await res.json();
      setProductSuppliers((prev) => [...prev, data]);
      setNewSupplierId(""); setNewCostPrice(""); setNewSupplierSku("");
    }
    setAddingSupplier(false);
  }

  async function removeSupplier(supplierId: number) {
    await fetch(`${API}/admin/products/${createdProductId}/suppliers/${supplierId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setProductSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  }

  async function addVariation() {
    if (!varName.trim() || !varValue.trim()) return;
    setAddingVar(true);
    const res = await fetch(`${API}/admin/products/${createdProductId}/variations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: varName.trim(), value: varValue.trim(),
        price_modifier: Number(varPrice),
        stock: Number(varStock),
        sku: varSku.trim() || null,
      }),
    });
    if (res.ok) {
      const data: Variation = await res.json();
      setVariations((prev) => [...prev, data]);
      setVarName(""); setVarValue(""); setVarPrice("0"); setVarStock("0"); setVarSku("");
    }
    setAddingVar(false);
  }

  async function removeVariation(varId: number) {
    await fetch(`${API}/admin/products/${createdProductId}/variations/${varId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setVariations((prev) => prev.filter((v) => v.id !== varId));
  }

  // ── Imagens ────────────────────────────────────────────────────────────────

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>, asCover: boolean) {
    const file = e.target.files?.[0];
    if (!file || !createdProductId) return;
    setUploadingImg(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    // Vira capa se foi solicitado ou se ainda não existe nenhuma capa
    const makeCover = asCover || !images.some((i) => i.is_cover);
    fd.append("is_cover", String(makeCover));
    try {
      const res = await fetch(`${API}/admin/products/${createdProductId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const img: ProductImage = await res.json();
        setImages((prev) =>
          makeCover
            ? [...prev.map((i) => ({ ...i, is_cover: false })), img]
            : [...prev, img]
        );
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail ?? `Erro ${res.status} ao enviar imagem.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de conexão ao enviar imagem.");
    }
    setUploadingImg(false);
    e.target.value = "";
  }

  async function handleDeleteImage(imgId: number) {
    await fetch(`${API}/admin/products/${createdProductId}/images/${imgId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  }

  async function handleSetCover(imgId: number) {
    const res = await fetch(`${API}/admin/products/${createdProductId}/images/${imgId}/set-cover`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setImages((prev) => prev.map((i) => ({ ...i, is_cover: i.id === imgId })));
    }
  }

  const supMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));
  const availableSuppliers = suppliers.filter((s) => !productSuppliers.some((ps) => ps.supplier_id === s.id));

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-xl pointer-events-auto flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-sm font-semibold text-gray-900">
              {isEdit ? t.admin_prod_edit_title : t.admin_prod_new_title}
            </h2>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors"><X size={18} /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0 px-6">
            {(["info", "images", "suppliers", "variations"] as Tab[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => { if (tabKey !== "info" && !createdProductId) return; setTab(tabKey); }}
                disabled={tabKey !== "info" && !createdProductId}
                className={`px-1 py-3 mr-5 text-xs font-medium border-b-2 transition-colors ${
                  tab === tabKey ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {tabKey === "info" ? t.admin_prod_tab_basic
                  : tabKey === "images" ? t.admin_prod_tab_images
                  : tabKey === "suppliers" ? t.admin_prod_tab_suppliers
                  : t.admin_prod_tab_variations}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">

            {/* ── Tab: Informações ── */}
            {tab === "info" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t.admin_prod_field_name} className="col-span-2">
                    <input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nome do produto" className="inp" />
                  </Field>
                  <Field label={t.admin_prod_field_slug}>
                    <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="nome-do-produto" className="inp font-mono text-xs" />
                  </Field>
                  <Field label={t.admin_prod_field_price}>
                    <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="inp" />
                  </Field>
                  <Field label={t.admin_prod_field_units_per_box}>
                    <input type="number" step="1" min="1" value={unitsPerBox} onChange={(e) => setUnitsPerBox(e.target.value)} placeholder="0" className="inp" />
                  </Field>
                  <Field label={t.admin_prod_field_category} className="col-span-2">
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="inp">
                      <option value="">{t.admin_prod_no_category}</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label={t.admin_prod_field_short_desc} className="col-span-2">
                    <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Resumo para listagem" className="inp" />
                  </Field>
                  <Field label={t.admin_prod_field_desc} className="col-span-2">
                    <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição detalhada..." rows={3} className="inp resize-none" />
                  </Field>
                </div>

                <div className="flex gap-6">
                  <Toggle label={t.admin_prod_field_featured} value={isFeatured} onChange={setIsFeatured} />
                  {isEdit && <Toggle label={t.admin_prod_field_active} value={isActive} onChange={setIsActive} />}
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              </div>
            )}

            {/* ── Tab: Imagens ── */}
            {tab === "images" && (
              <div className="flex flex-col gap-6">
                {(() => {
                  const coverImg = images.find((i) => i.is_cover) ?? null;
                  const galleryImgs = images.filter((i) => !i.is_cover);
                  return (
                    <>
                      {/* ── Capa ── */}
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <Star size={12} className="text-amber-400" fill="currentColor" />
                          {t.admin_prod_img_cover_section}
                        </p>
                        <p className="text-[11px] text-gray-400 -mt-1">{t.admin_prod_img_cover_hint}</p>

                        {coverImg ? (
                          <div className="relative group w-40 rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50">
                            <img src={coverImg.url} alt={coverImg.alt_text ?? ""} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => handleDeleteImage(coverImg.id)}
                                title={t.admin_prod_img_delete}
                                className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className={`w-40 aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${uploadingImg ? "opacity-50 pointer-events-none" : "border-gray-200 hover:border-gray-400"}`}>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, true)} disabled={uploadingImg} />
                            {uploadingImg ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <Upload size={20} className="text-gray-300" />}
                            <span className="text-[11px] text-gray-400 text-center px-2">{t.admin_prod_img_cover_upload}</span>
                          </label>
                        )}
                      </div>

                      {/* ── Galeria ── */}
                      <div className="flex flex-col gap-2 border-t border-gray-100 pt-5">
                        <p className="text-xs font-semibold text-gray-700">{t.admin_prod_img_gallery_section}</p>
                        <p className="text-[11px] text-gray-400 -mt-1">{t.admin_prod_img_gallery_hint}</p>

                        <div className="grid grid-cols-4 gap-3 mt-1">
                          {galleryImgs.map((img) => (
                            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square bg-gray-50">
                              <img src={img.url} alt={img.alt_text ?? ""} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSetCover(img.id)}
                                  title={t.admin_prod_img_set_cover}
                                  className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Star size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteImage(img.id)}
                                  title={t.admin_prod_img_delete}
                                  className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Botão adicionar à galeria */}
                          <label className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${uploadingImg ? "opacity-50 pointer-events-none" : "border-gray-200 hover:border-gray-400"}`}>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, false)} disabled={uploadingImg} />
                            {uploadingImg ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Plus size={18} className="text-gray-300" />}
                          </label>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <p className="text-[10px] text-gray-300">JPEG, PNG, WebP · máx 5 MB</p>

                {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              </div>
            )}

            {/* ── Tab: Fornecedores ── */}
            {tab === "suppliers" && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-400">Informe de qual fornecedor você comprará este produto e o seu preço de custo.</p>

                {productSuppliers.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {productSuppliers.map((ps) => (
                      <div key={ps.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{supMap[ps.supplier_id] ?? `#${ps.supplier_id}`}</p>
                          <p className="text-xs text-gray-400">Custo: {fmt(ps.cost_price)}{ps.supplier_sku ? ` · SKU: ${ps.supplier_sku}` : ""}{ps.is_preferred ? " · Preferencial" : ""}</p>
                        </div>
                        <button onClick={() => removeSupplier(ps.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {availableSuppliers.length > 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-xs font-medium text-gray-500">{t.admin_prod_sup_add}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t.admin_orders_supplier} className="col-span-2">
                        <select value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)} className="inp">
                          <option value="">Selecionar...</option>
                          {availableSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </Field>
                      <Field label={t.admin_prod_sup_cost}>
                        <input type="number" step="0.01" min="0" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder="0,00" className="inp" />
                      </Field>
                      <Field label="SKU">
                        <input value={newSupplierSku} onChange={(e) => setNewSupplierSku(e.target.value)} placeholder="Opcional" className="inp" />
                      </Field>
                    </div>
                    <button
                      onClick={addSupplier}
                      disabled={addingSupplier || !newSupplierId || !newCostPrice}
                      className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                    >
                      {addingSupplier ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {t.admin_prod_sup_add}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">Todos os fornecedores já foram vinculados.</p>
                )}
              </div>
            )}

            {/* ── Tab: Variações ── */}
            {tab === "variations" && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-400">Adicione variações como cores, tamanhos ou modelos. O preço final = preço base + modificador.</p>

                {variations.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {variations.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{v.name}: <span className="font-normal">{v.value}</span></p>
                          <p className="text-xs text-gray-400">
                            Modificador: {Number(v.price_modifier) >= 0 ? "+" : ""}{fmt(v.price_modifier)} · Estoque: {v.stock}
                            {v.sku ? ` · SKU: ${v.sku}` : ""}
                          </p>
                        </div>
                        <button onClick={() => removeVariation(v.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-medium text-gray-500">{t.admin_prod_var_add}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.admin_prod_var_name}>
                      <input value={varName} onChange={(e) => setVarName(e.target.value)} placeholder="Cor" className="inp" />
                    </Field>
                    <Field label={t.admin_prod_var_value}>
                      <input value={varValue} onChange={(e) => setVarValue(e.target.value)} placeholder="Azul" className="inp" />
                    </Field>
                    <Field label={t.admin_prod_var_price_mod}>
                      <input type="number" step="0.01" value={varPrice} onChange={(e) => setVarPrice(e.target.value)} className="inp" />
                    </Field>
                    <Field label={t.admin_prod_var_stock}>
                      <input type="number" min="0" value={varStock} onChange={(e) => setVarStock(e.target.value)} className="inp" />
                    </Field>
                    <Field label="SKU" className="col-span-2">
                      <input value={varSku} onChange={(e) => setVarSku(e.target.value)} placeholder="Opcional" className="inp" />
                    </Field>
                  </div>
                  <button
                    onClick={addVariation}
                    disabled={addingVar || !varName.trim() || !varValue.trim()}
                    className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                  >
                    {addingVar ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {t.admin_prod_var_add}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
            {tab !== "info" && createdProductId && !isEdit ? (
              <>
                <button onClick={() => setTab(tab === "suppliers" ? "info" : "suppliers")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
                  <ChevronDown size={14} className="rotate-90" /> ←
                </button>
                <div className="flex gap-2">
                  {tab === "suppliers" && (
                    <button onClick={() => setTab("variations")} className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                      {t.admin_prod_tab_variations} →
                    </button>
                  )}
                  <button onClick={onSaved} className="bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
                    {t.admin_prod_save}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  {t.admin_prod_cancel}
                </button>
                <button
                  onClick={saveInfo}
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? t.admin_prod_saving : isEdit ? t.admin_prod_save : `${t.admin_prod_create} →`}
                </button>
              </>
            )}
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

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div onClick={() => onChange(!value)} className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${value ? "bg-gray-900" : "bg-gray-200"}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}
