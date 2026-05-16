import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import HomeHero from "@/components/HomeHero";
import HomeCTA from "@/components/HomeCTA";

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

type Product = Parameters<typeof ProductCard>[0]["product"];

export default async function Home() {
  const featured: Product[] = await getFeaturedProducts();

  return (
    <div className="max-w-6xl mx-auto px-6">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HomeHero />

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

      {/* ── Estado vazio ─────────────────────────────────────────────────── */}
      {featured.length === 0 && (
        <section className="py-20 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">📦</span>
          <p className="text-gray-400 text-sm">Em breve novos produtos por aqui.</p>
          <Link href="/produtos" className="text-sm text-gray-900 underline underline-offset-4">
            Ver catálogo
          </Link>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <HomeCTA />

    </div>
  );
}
