"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Image = { id: number; url: string; is_cover: boolean; alt_text?: string };

export default function ProductGallery({
  images,
  productName,
}: {
  images: Image[];
  productName: string;
}) {
  const { t } = useLanguage();

  // Ordena com a capa primeiro
  const ordered = [...images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover));
  const [active, setActive] = useState(0);

  if (ordered.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl aspect-square overflow-hidden flex items-center justify-center text-gray-200 text-sm select-none">
        {t.product_no_image}
      </div>
    );
  }

  const current = ordered[active] ?? ordered[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-gray-50 rounded-2xl aspect-square overflow-hidden">
        <img
          src={current.url}
          alt={current.alt_text ?? productName}
          className="w-full h-full object-cover"
        />
      </div>

      {ordered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ordered.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActive(idx)}
              className={`w-16 h-16 shrink-0 bg-gray-50 rounded-lg overflow-hidden border-2 transition-colors ${
                idx === active ? "border-gray-900" : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <img src={img.url} alt={img.alt_text ?? ""} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
