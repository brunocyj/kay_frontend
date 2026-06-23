"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Plus, Trash2, FolderOpen, Loader2, Star,
  CheckCircle2, XCircle, Images, ImagePlus, X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Category = { id: number; name: string; children: Category[] };
type Supplier = { id: number; name: string };

type Row = {
  uid: string;
  name: string;
  price: string;
  category_id: string;
  short_description: string;
  description: string;
  supplier_id: string;
  cost_price: string;
  supplier_sku: string;
  is_featured: boolean;
  files: File[];
};

type ItemResult = {
  index: number; name: string; success: boolean;
  product_id?: number | null; error?: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif",
};

function imageMime(file: File): string | null {
  if (file.type) {
    const t = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (ALLOWED.includes(t)) return t;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? null;
}

function newRow(): Row {
  return {
    uid: Math.random().toString(36).slice(2),
    name: "", price: "", category_id: "", short_description: "",
    description: "", supplier_id: "", cost_price: "", supplier_sku: "",
    is_featured: false, files: [],
  };
}

async function runWithConcurrency<T>(
  items: T[], limit: number, worker: (item: T, idx: number) => Promise<void>,
) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const cur = i++;
      await worker(items[cur], cur);
    }
  });
  await Promise.all(runners);
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function BulkProductsPage() {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<{ id: number; label: string }[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rows, setRows] = useState<Row[]>([newRow()]);

  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"idle" | "validating" | "uploading" | "creating">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [results, setResults] = useState<ItemResult[] | null>(null);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/categories`).then((r) => r.json()),
      fetch(`${API}/admin/suppliers`, { headers }).then((r) => r.json()),
    ]).then(([c, s]) => {
      const flat: { id: number; label: string }[] = [];
      const walk = (cats: Category[], depth = 0) => {
        (cats || []).forEach((cat) => {
          flat.push({ id: cat.id, label: "\u00A0\u00A0".repeat(depth) + cat.name });
          if (cat.children?.length) walk(cat.children, depth + 1);
        });
      };
      walk(Array.isArray(c) ? c : []);
      setCategories(flat);
      setSuppliers(Array.isArray(s) ? s : []);
    });
  }, [token]);

  function update(uid: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  }

  function addFiles(uid: string, fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((f) => imageMime(f) !== null);
    if (incoming.length === 0) return;
    setRows((rs) => rs.map((r) => {
      if (r.uid !== uid) return r;
      // Mescla com as imagens já escolhidas, evitando duplicatas (nome + tamanho)
      const map = new Map<string, File>();
      [...r.files, ...incoming].forEach((f) => map.set(`${f.name}_${f.size}`, f));
      const merged = Array.from(map.values())
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      return { ...r, files: merged };
    }));
  }

  function removeFile(uid: string, idx: number) {
    setRows((rs) => rs.map((r) =>
      r.uid === uid ? { ...r, files: r.files.filter((_, i) => i !== idx) } : r));
  }

  function clearFiles(uid: string) {
    update(uid, { files: [] });
  }

  function addRow() { setRows((rs) => [...rs, newRow()]); }
  function removeRow(uid: string) {
    setRows((rs) => (rs.length === 1 ? [newRow()] : rs.filter((r) => r.uid !== uid)));
  }

  async function submit() {
    setError("");
    setResults(null);

    const filled = rows.filter((r) => r.name.trim() || r.price.trim() || r.files.length);
    if (filled.length === 0) { setError(t.admin_bulk_err_no_products); return; }
    if (filled.some((r) => !r.name.trim() || !r.price.trim())) {
      setError(t.admin_bulk_err_missing); return;
    }

    setSubmitting(true);
    try {
      // 1. Lista achatada de todos os arquivos
      setPhase("validating");
      const flat: { rowIdx: number; file: File; mime: string }[] = [];
      filled.forEach((r, rowIdx) => {
        r.files.forEach((file) => {
          const mime = imageMime(file);
          if (mime) flat.push({ rowIdx, file, mime });
        });
      });

      // 2. Presign (uma chamada) + upload direto ao S3
      const urlByFlatIdx: string[] = [];
      if (flat.length > 0) {
        const presignRes = await fetch(`${API}/admin/uploads/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            files: flat.map((f) => ({ filename: f.file.name, content_type: f.mime })),
          }),
        });
        if (!presignRes.ok) {
          const d = await presignRes.json().catch(() => ({}));
          throw new Error(d.detail || `Presign falhou (${presignRes.status})`);
        }
        const { uploads } = await presignRes.json();

        setPhase("uploading");
        setProgress({ done: 0, total: flat.length });
        await runWithConcurrency(flat, 6, async (f, idx) => {
          const up = uploads[idx];
          const put = await fetch(up.upload_url, {
            method: "PUT",
            headers: { "Content-Type": f.mime },
            body: f.file,
          });
          if (!put.ok) throw new Error(`Falha no upload de ${f.file.name} (${put.status})`);
          urlByFlatIdx[idx] = up.public_url;
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        });
      }

      // 3. Monta payload de produtos com URLs já no S3
      const imagesByRow: { url: string; is_cover: boolean; order: number }[][] =
        filled.map(() => []);
      flat.forEach((f, idx) => {
        const arr = imagesByRow[f.rowIdx];
        arr.push({ url: urlByFlatIdx[idx], is_cover: arr.length === 0, order: arr.length });
      });

      const products = filled.map((r, rowIdx) => ({
        name: r.name.trim(),
        short_description: r.short_description.trim() || null,
        description: r.description.trim() || null,
        category_id: r.category_id ? Number(r.category_id) : null,
        price: Number(r.price),
        is_featured: r.is_featured,
        images: imagesByRow[rowIdx],
        supplier_id: r.supplier_id ? Number(r.supplier_id) : null,
        cost_price: r.supplier_id && r.cost_price ? Number(r.cost_price) : null,
        supplier_sku: r.supplier_id ? (r.supplier_sku.trim() || null) : null,
      }));

      // 4. Uma chamada para criar tudo
      setPhase("creating");
      const res = await fetch(`${API}/admin/products/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ products }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `Erro ${res.status}`);
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.admin_bulk_err_generic);
    } finally {
      setSubmitting(false);
      setPhase("idle");
    }
  }

  function reset() {
    setRows([newRow()]);
    setResults(null);
    setError("");
    setProgress({ done: 0, total: 0 });
  }

  // ── Tela de resultado ────────────────────────────────────────────────────
  if (results) {
    const ok = results.filter((r) => r.success).length;
    const fail = results.length - ok;
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t.admin_bulk_result_title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="text-emerald-600 font-medium">{ok} {t.admin_bulk_created}</span>
            {fail > 0 && <span className="text-red-500 font-medium"> · {fail} {t.admin_bulk_failed}</span>}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {results.map((r) => (
            <div key={r.index} className="flex items-center gap-3 px-5 py-3">
              {r.success
                ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                : <XCircle size={16} className="text-red-500 shrink-0" />}
              <span className="text-sm text-gray-800 flex-1 truncate">{r.name || `#${r.index + 1}`}</span>
              {!r.success && <span className="text-xs text-red-500">{r.error}</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700">
            {t.admin_bulk_clear_ok}
          </button>
          <Link href="/admin/produtos" className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50">
            {t.admin_bulk_back}
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulário ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-2">
            <ArrowLeft size={13} /> {t.admin_bulk_back}
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{t.admin_bulk_title}</h1>
          <p className="text-sm text-gray-400 mt-0.5 max-w-xl">{t.admin_bulk_subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {rows.map((r, i) => (
          <RowCard
            key={r.uid}
            row={r}
            index={i}
            categories={categories}
            suppliers={suppliers}
            onChange={(patch) => update(r.uid, patch)}
            onAddFiles={(fl) => addFiles(r.uid, fl)}
            onRemoveFile={(idx) => removeFile(r.uid, idx)}
            onClearFiles={() => clearFiles(r.uid)}
            onRemove={() => removeRow(r.uid)}
            t={t}
            disabled={submitting}
          />
        ))}
      </div>

      <div>
        <button
          onClick={addRow}
          disabled={submitting}
          className="flex items-center gap-2 border border-dashed border-gray-300 text-gray-600 text-sm font-medium px-4 py-3 rounded-lg hover:bg-gray-50 w-full justify-center disabled:opacity-50"
        >
          <Plus size={15} /> {t.admin_bulk_add_product}
        </button>
      </div>

      {/* Barra de envio */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-gray-100 -mx-6 px-6 py-4 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {submitting && phase === "validating" && t.admin_bulk_validating}
          {submitting && phase === "uploading" && `${t.admin_bulk_uploading_images} ${progress.done}/${progress.total}`}
          {submitting && phase === "creating" && t.admin_bulk_creating}
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {submitting ? t.admin_bulk_submitting : t.admin_bulk_submit}
        </button>
      </div>
    </div>
  );
}

// ── Card de produto ────────────────────────────────────────────────────────

function RowCard({
  row, index, categories, suppliers, onChange, onAddFiles, onRemoveFile, onClearFiles, onRemove, t, disabled,
}: {
  row: Row;
  index: number;
  categories: { id: number; label: string }[];
  suppliers: Supplier[];
  onChange: (patch: Partial<Row>) => void;
  onAddFiles: (fl: FileList | null) => void;
  onRemoveFile: (idx: number) => void;
  onClearFiles: () => void;
  onRemove: () => void;
  t: Record<string, string>;
  disabled: boolean;
}) {
  const folderRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-gray-400">{t.admin_bulk_product} #{index + 1}</span>
        <button onClick={onRemove} disabled={disabled} className="text-gray-300 hover:text-red-500 disabled:opacity-50">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">{t.admin_bulk_name}</label>
          <input
            value={row.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.admin_bulk_price}</label>
          <input
            type="number" step="0.01" min="0"
            value={row.price}
            onChange={(e) => onChange({ price: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.admin_bulk_category}</label>
          <select
            value={row.category_id}
            onChange={(e) => onChange({ category_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">{t.admin_bulk_short_desc}</label>
          <input
            value={row.short_description}
            onChange={(e) => onChange({ short_description: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.admin_bulk_supplier}</label>
          <select
            value={row.supplier_id}
            onChange={(e) => onChange({ supplier_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="">{t.admin_bulk_supplier_none}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.admin_bulk_cost}</label>
          <input
            type="number" step="0.01" min="0"
            value={row.cost_price}
            disabled={!row.supplier_id}
            onChange={(e) => onChange({ cost_price: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">{t.admin_bulk_supplier_sku}</label>
          <input
            value={row.supplier_sku}
            disabled={!row.supplier_id}
            onChange={(e) => onChange({ supplier_sku: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* Imagens */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* Input de pasta inteira */}
          <input
            ref={folderRef}
            type="file"
            accept="image/*"
            multiple
            // @ts-expect-error webkitdirectory não está no tipo padrão
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={(e) => { onAddFiles(e.target.files); e.target.value = ""; }}
          />
          {/* Input de imagens individuais */}
          <input
            ref={filesRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { onAddFiles(e.target.files); e.target.value = ""; }}
          />
          <button
            type="button"
            onClick={() => folderRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <FolderOpen size={15} /> {t.admin_bulk_pick_folder}
          </button>
          <button
            type="button"
            onClick={() => filesRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ImagePlus size={15} /> {t.admin_bulk_pick_files}
          </button>

          {row.files.length > 0 && (
            <>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Images size={14} /> {row.files.length} {t.admin_bulk_images_count}
              </span>
              <button
                type="button"
                onClick={onClearFiles}
                disabled={disabled}
                className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                {t.admin_bulk_clear_images}
              </button>
            </>
          )}

          <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={row.is_featured}
              onChange={(e) => onChange({ is_featured: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Star size={13} className="text-amber-400" /> {t.admin_bulk_featured}
          </label>
        </div>

        {row.files.length > 0 && (
          <>
            <p className="text-[11px] text-gray-400 mt-2">{t.admin_bulk_cover_note}</p>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {row.files.slice(0, 12).map((f, fi) => (
                <div key={`${f.name}_${f.size}`} className="relative shrink-0 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-14 h-14 object-cover rounded-md border border-gray-200"
                  />
                  {fi === 0 && (
                    <span className="absolute -top-1.5 -left-1.5 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded">
                      {t.admin_bulk_cover_label}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveFile(fi)}
                    disabled={disabled}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {row.files.length > 12 && (
                <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-md border border-gray-200 text-xs text-gray-400">
                  +{row.files.length - 12}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
