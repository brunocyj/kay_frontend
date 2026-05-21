import HomeHero from "@/components/HomeHero";
import HomeCTA from "@/components/HomeCTA";
import HomeFeatured from "@/components/HomeFeatured";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${API}/products?featured_only=true&limit=4`, {
      next: { revalidate: 300 }, // cache de 5 minutos
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

type Product = Parameters<typeof HomeFeatured>[0]["featured"][number];

export default async function Home() {
  const featured: Product[] = await getFeaturedProducts();

  return (
    <div className="max-w-6xl mx-auto px-6">
      <HomeHero />
      <HomeFeatured featured={featured} />
      <HomeCTA />
    </div>
  );
}
