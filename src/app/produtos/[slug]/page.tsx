import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import {
  ProductBreadcrumb,
  ProductNoImage,
  ProductFeaturedBadge,
  ProductPaymentNote,
  ProductDescriptionTitle,
} from "@/components/ProductDetailTexts";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type Variation = {
  id: number; name: string; value: string;
  price_modifier: string; stock: number; is_active: boolean;
};

type Product = {
  id: number; name: string; slug: string;
  short_description: string | null; description: string | null;
  price: string; is_active: boolean; is_featured: boolean;
  category_id: number | null;
  images: { id: number; url: string; is_cover: boolean; alt_text?: string }[];
  variations: Variation[];
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/products/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

function fmt(val: string | number) {
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !product.is_active) notFound();

  const cover = product.images.find((i) => i.is_cover) ?? product.images[0];
  const gallery = product.images.filter((i) => !i.is_cover && i.url !== cover?.url);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <ProductBreadcrumb name={product.name} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ── Galeria ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 rounded-2xl aspect-square overflow-hidden">
            {cover ? (
              <img
                src={cover.url}
                alt={cover.alt_text ?? product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ProductNoImage />
            )}
          </div>

          {gallery.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((img) => (
                <div key={img.id} className="w-16 h-16 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <img src={img.url} alt={img.alt_text ?? ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {product.is_featured && <ProductFeaturedBadge />}

          <div>
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug">{product.name}</h1>
            {product.short_description && (
              <p className="text-sm text-gray-500 mt-2">{product.short_description}</p>
            )}
          </div>

          <div className="text-3xl font-bold text-gray-900">{fmt(product.price)}</div>

          <AddToCart
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            productImage={cover?.url ?? null}
            basePrice={Number(product.price)}
            variations={product.variations}
          />

          <ProductPaymentNote />

          {product.description && (
            <div className="border-t border-gray-100 pt-5">
              <ProductDescriptionTitle />
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
