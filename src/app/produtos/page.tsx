"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, SlidersHorizontal, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const PAGE_SIZE = 40;

type Category = { id: number; name: string; slug: string; children: Category[] };
type Product = {
  id: number; name: string; slug: string; price: string;
  short_description?: string; is_featured: boolean;
  images: { url: string; is_cover: boolean; alt_text?: string }[];
};

function ProdutosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCat, setSelectedCat] = useState<string>(searchParams.get("category") ?? "");
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get("destaque") === "true");
  const [showFilters, setShowFilters] = useState(false);

  const flatCats: { id: number; label: string; depth: number }[] = [];
  function flatten(cats: Category[], depth = 0) {
    cats.forEach((c) => {
      flatCats.push({ id: c.id, label: c.name, depth });
      if (c.children?.length) flatten(c.children, depth + 1);
    });
  }
  flatten(categories);

  function buildParams(catId: string, q: string, featured: boolean, offset: number) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(offset) });
    if (catId) params.set("category_id", catId);
    if (featured) params.set("featured_only", "true");
    return params;
  }

  function filterBySearch(data: Product[], q: string): Product[] {
    if (!q.trim()) return data;
    const lower = q.toLowerCase();
    return data.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.short_description ?? "").toLowerCase().includes(lower),
    );
  }

  async function fetchProducts(catId: string, q: string, featured: boolean) {
    setLoading(true);
    setSkip(0);
    const res = await fetch(`${API}/products?${buildParams(catId, q, featured, 0)}`);
    const raw: Product[] = await res.json();
    const data = filterBySearch(raw, q);
    setProducts(data);
    // Se a API devolveu PAGE_SIZE itens pode haver mais (a pesquisa local pode ter filtrado alguns,
    // então usamos o tamanho da resposta bruta como indicador)
    setHasMore(raw.length === PAGE_SIZE);
    setLoading(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    const nextSkip = skip + PAGE_SIZE;
    const res = await fetch(`${API}/products?${buildParams(selectedCat, search, featuredOnly, nextSkip)}`);
    const raw: Product[] = await res.json();
    const data = filterBySearch(raw, search);
    setProducts((prev) => [...prev, ...data]);
    setSkip(nextSkip);
    setHasMore(raw.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    fetchProducts(selectedCat, search, featuredOnly);
    const params = new URLSearchParams();
    if (selectedCat) params.set("category", selectedCat);
    if (search) params.set("q", search);
    if (featuredOnly) params.set("destaque", "true");
    router.replace(`/produtos${params.toString() ? "?" + params.toString() : ""}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCat, featuredOnly]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchProducts(selectedCat, search, featuredOnly);
  }

  function selectCategory(id: string) {
    setSelectedCat(id);
    setFeaturedOnly(false);
    setShowFilters(false);
  }

  const selectedCatName = flatCats.find((c) => String(c.id) === selectedCat)?.label;
  const count = products.length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {featuredOnly ? t.products_title_featured : selectedCatName ? selectedCatName : t.products_title_all}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-400 mt-0.5">
              {count} {count === 1 ? t.products_count_one : t.products_count_many}
            </p>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.products_search_placeholder}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 w-56"
            />
          </div>
          <button type="submit" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            {t.products_search_btn}
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden p-2 border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 transition-colors"
          >
            <SlidersHorizontal size={15} />
          </button>
        </form>
      </div>

      <div className="flex gap-8">
        <aside className={`shrink-0 w-52 ${showFilters ? "block" : "hidden sm:block"}`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t.products_filter}</p>
          <ul className="flex flex-col gap-0.5">
            <li>
              <button
                onClick={() => { setSelectedCat(""); setFeaturedOnly(false); setShowFilters(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCat === "" && !featuredOnly ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.products_all}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setSelectedCat(""); setFeaturedOnly(true); setShowFilters(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  featuredOnly ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.products_featured_filter}
              </button>
            </li>
          </ul>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-3">{t.products_categories}</p>
          <ul className="flex flex-col gap-0.5">
            {flatCats.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => selectCategory(String(c.id))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCat === String(c.id)
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{ paddingLeft: `${12 + c.depth * 14}px` }}
                >
                  {c.depth > 0 && <span className="text-gray-300 mr-1">·</span>}
                  {c.label}
                </button>
              </li>
            ))}
          </ul>

          {(selectedCat || featuredOnly) && (
            <button
              onClick={() => { setSelectedCat(""); setFeaturedOnly(false); }}
              className="mt-4 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={12} /> {t.products_clear_filter}
            </button>
          )}
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-gray-300 text-5xl mb-4">📦</p>
              <p className="text-sm text-gray-500 font-medium">{t.products_none_title}</p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedCat || search || featuredOnly ? t.products_none_try : ""}
                {selectedCat || search || featuredOnly ? (
                  <button onClick={() => { setSearch(""); setSelectedCat(""); setFeaturedOnly(false); }} className="underline underline-offset-2 hover:text-gray-700">
                    {t.products_none_see_all}
                  </button>
                ) : t.products_none_soon}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Paginação */}
              <div className="mt-10 flex justify-center">
                {hasMore ? (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {loadingMore ? t.products_loading_more : t.products_load_more}
                  </button>
                ) : (
                  <p className="text-xs text-gray-400">{t.products_all_loaded}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense>
      <ProdutosContent />
    </Suspense>
  );
}
