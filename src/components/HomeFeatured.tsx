"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";

type Product = Parameters<typeof ProductCard>[0]["product"];

export default function HomeFeatured({ featured }: { featured: Product[] }) {
  const { t } = useLanguage();

  if (featured.length === 0) {
    return (
      <section className="py-20 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">📦</span>
        <p className="text-gray-400 text-sm">{t.home_empty}</p>
        <Link href="/produtos" className="text-sm text-gray-900 underline underline-offset-4">
          {t.home_catalog}
        </Link>
      </section>
    );
  }

  return (
    <section className="py-10 border-t border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          {t.home_featured}
        </h2>
        <Link href="/produtos?destaque=true" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          {t.home_see_all}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
