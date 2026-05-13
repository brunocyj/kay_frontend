import Link from "next/link";

type Product = {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  price: string | number;
  images?: { url: string; is_cover: boolean; alt_text?: string }[];
  is_featured?: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.images?.find((i) => i.is_cover) ?? product.images?.[0];
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all hover:shadow-sm"
    >
      {/* Imagem */}
      <div className="bg-gray-50 aspect-square overflow-hidden">
        {cover ? (
          <img
            src={cover.url}
            alt={cover.alt_text ?? product.name}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-xs select-none">
            sem imagem
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1">
        <span className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug">
          {product.name}
        </span>
        {product.short_description && (
          <span className="text-xs text-gray-400 line-clamp-1">{product.short_description}</span>
        )}
        <span className="mt-2 text-sm font-semibold text-gray-900">
          R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </Link>
  );
}
