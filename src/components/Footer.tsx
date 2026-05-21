"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-gray-100 bg-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 gap-10 text-sm text-gray-500">

        <div className="flex flex-col gap-3">
          <span className="text-gray-900 font-semibold text-base">Beta Bridge</span>
          <p className="leading-relaxed text-gray-400 max-w-xs">
            {t.footer_tagline}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-gray-700 font-medium mb-1">{t.footer_store}</span>
          <Link href="/produtos" className="hover:text-gray-900 transition-colors">{t.footer_products}</Link>
          <Link href="/produtos?destaque=true" className="hover:text-gray-900 transition-colors">{t.footer_featured}</Link>
        </div>
      </div>

      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-300">
        © {new Date().getFullYear()} Beta Bridge
      </div>
    </footer>
  );
}
