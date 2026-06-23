import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import ProductGallery from "@/components/ProductGallery";
import {
  ProductBreadcrumb,
  ProductFeaturedBadge,
  ProductPaymentNote,
  ProductDescriptionTitle,
  ProductUnitsPerBox,
} from "@/components/ProductDetailTexts";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type Variation = {
  id: number; name: string; value: string;
  price_modifier: string; stock: number; is_active: boolean;
};

type Product = {
  id: number; name: string; slug: string;
  short_description: string | null; description: string | null;
  price: string; units_per_box: number | null;
  is_active: boolean; is_featured: boolean;
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <ProductBreadcrumb name={product.name} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ── Galeria ─────────────────────────────────────────────────────── */}
        <ProductGallery images={product.images} productName={product.name} />

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

          {product.units_per_box ? <ProductUnitsPerBox units={product.units_per_box} /> : null}

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
