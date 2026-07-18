import { getFilteredProducts } from "@/lib/api";
import ProductGrid from "@/components/ProductGrid";

export default async function PremiumPage() {
  const { products, categories } = await getFilteredProducts("premium");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Premium Ürünler</h1>
      <ProductGrid products={products} categories={categories} basePath="/filter/premium" />
    </main>
  );
}
