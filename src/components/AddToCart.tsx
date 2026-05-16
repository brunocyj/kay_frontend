"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

type Variation = {
  id: number; name: string; value: string;
  price_modifier: string; stock: number; is_active: boolean;
};

type Props = {
  productId: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
  basePrice: number;
  variations: Variation[];
};

export default function AddToCart({
  productId, productName, productSlug, productImage, basePrice, variations,
}: Props) {
  const { addItem } = useCart();
  const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const activeVariations = variations.filter((v) => v.is_active);
  const hasVariations = activeVariations.length > 0;

  const selectedVar = activeVariations.find((v) => v.id === selectedVarId) ?? null;
  const finalPrice = basePrice + (selectedVar ? Number(selectedVar.price_modifier) : 0);

  // Agrupa por tipo
  const groups: Record<string, Variation[]> = {};
  activeVariations.forEach((v) => {
    if (!groups[v.name]) groups[v.name] = [];
    groups[v.name].push(v);
  });

  function handleAdd() {
    if (hasVariations && !selectedVarId) return;

    addItem({
      product_id: productId,
      product_name: productName,
      product_slug: productSlug,
      product_image: productImage,
      variation_id: selectedVar?.id ?? null,
      variation_label: selectedVar ? `${selectedVar.name}: ${selectedVar.value}` : null,
      price: finalPrice,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const outOfStock = hasVariations && selectedVar ? selectedVar.stock === 0 : false;

  return (
    <div className="flex flex-col gap-4">
      {/* Seletor de variações */}
      {Object.entries(groups).map(([groupName, vars]) => (
        <div key={groupName}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{groupName}</p>
          <div className="flex flex-wrap gap-2">
            {vars.map((v) => {
              const isSelected = selectedVarId === v.id;
              const isOut = v.stock === 0;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVarId(isSelected ? null : v.id)}
                  disabled={isOut}
                  className={`border rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : isOut
                      ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                      : "border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {v.value}
                  {isOut && <span className="ml-1 text-xs opacity-60">esgotado</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {hasVariations && !selectedVarId && (
        <p className="text-xs text-amber-600">Selecione uma variação antes de adicionar ao carrinho</p>
      )}

      <button
        onClick={handleAdd}
        disabled={outOfStock || (hasVariations && !selectedVarId)}
        className={`flex items-center justify-center gap-2 w-full font-medium py-3.5 rounded-xl transition-colors text-sm ${
          added
            ? "bg-green-600 text-white"
            : "bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
      >
        {added ? (
          <><Check size={16} /> Adicionado ao carrinho</>
        ) : (
          <><ShoppingCart size={16} /> Adicionar ao carrinho</>
        )}
      </button>
    </div>
  );
}
