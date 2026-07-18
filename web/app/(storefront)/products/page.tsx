import { getProducts } from "@/lib/api";
import ProductGrid from "@/components/ProductGrid";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const { sort, category } = await searchParams;
  const { products, categories, selectedSort } = await getProducts({ sort, category });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Ürünler</h1>
      <ProductGrid
        products={products}
        categories={categories}
        selectedSort={selectedSort}
        basePath="/products"
        extraParams={category ? { category } : {}}
      />
    </main>
  );
}
