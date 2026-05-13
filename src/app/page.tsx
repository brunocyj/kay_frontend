import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${API}/products?featured_only=true&limit=4`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function getCategories() {
  try {
    const res = await fetch(`${API}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function getLatestProducts() {
  try {
    const res = await fetch(`${API}/products?limit=8`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

type Category = { id: number; name: string; slug: string };
type Product = Parameters<typeof ProductCard>[0]["product"];

export default async function Home() {
  const [featured, categories, latest] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getLatestProducts(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 flex flex-col gap-6 max-w-xl">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Produtos importados
        </span>
        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
          Qualidade direto<br />para você.
        </h1>
        <p className="text-gray-400 text-base leading-relaxed">
          Encontre o que precisa, faça seu pedido e acompanhe cada etapa. Simples assim.
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/produtos"
            className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Ver produtos
          </Link>
          <Link
            href="/auth/cadastro"
            className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </section>

      {/* ── Categorias ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Categorias
            </h2>
            <Link href="/categorias" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ver todas →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 10).map((cat: Category) => (
              <Link
                key={cat.id}
                href={`/produtos?category=${cat.id}`}
                className="border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-full hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Destaques ────────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Destaques
            </h2>
            <Link href="/produtos?destaque=true" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Novidades ────────────────────────────────────────────────────── */}
      {latest.length > 0 && (
        <section className="py-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Novidades
            </h2>
            <Link href="/produtos" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {latest.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Estado vazio ─────────────────────────────────────────────────── */}
      {latest.length === 0 && featured.length === 0 && (
        <section className="py-20 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">📦</span>
          <p className="text-gray-400 text-sm">Em breve novos produtos por aqui.</p>
          <Link href="/auth/cadastro" className="text-sm text-gray-900 underline underline-offset-4">
            Criar conta para ser notificado
          </Link>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-gray-900">Pronto para comprar?</span>
          <span className="text-sm text-gray-400">Cadastre-se e faça seu primeiro pedido.</span>
        </div>
        <Link
          href="/auth/cadastro"
          className="bg-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          Criar conta grátis
        </Link>
      </section>

    </div>
  );
}
