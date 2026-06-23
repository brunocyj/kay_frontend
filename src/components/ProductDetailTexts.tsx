"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export function ProductBreadcrumb({ name }: { name: string }) {
  const { t } = useLanguage();
  return (
    <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
      <Link href="/" className="hover:text-gray-700 transition-colors">{t.product_home}</Link>
      <span>/</span>
      <Link href="/produtos" className="hover:text-gray-700 transition-colors">{t.product_products}</Link>
      <span>/</span>
      <span className="text-gray-600 truncate max-w-xs">{name}</span>
    </nav>
  );
}

export function ProductNoImage() {
  const { t } = useLanguage();
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-200 text-sm select-none">
      {t.product_no_image}
    </div>
  );
}

export function ProductFeaturedBadge() {
  const { t } = useLanguage();
  return (
    <span className="inline-flex self-start text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full">
      {t.product_featured_badge}
    </span>
  );
}

export function ProductPaymentNote() {
  const { t } = useLanguage();
  return (
    <p className="text-xs text-gray-400 text-center">{t.product_payment_note}</p>
  );
}

export function ProductDescriptionTitle() {
  const { t } = useLanguage();
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t.product_description}</p>
  );
}

export function ProductUnitsPerBox({ units }: { units: number }) {
  const { t } = useLanguage();
  return (
    <div className="inline-flex self-start items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg">
      <span className="font-semibold text-gray-900">{units}</span>
      {t.product_units_per_box}
    </div>
  );
}
