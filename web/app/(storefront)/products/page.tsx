import { getProducts } from "@/lib/api";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
  }>;
}) {
  const { sort, category, brand, minPrice, maxPrice, q } = await searchParams;
  const { products, categories, brands, selectedSort } = await getProducts({
    sort,
    category,
    brand,
    minPrice,
    maxPrice,
    q,
  });

  const extraParams: Record<string, string> = {};
  if (category) extraParams.category = category;
  if (brand) extraParams.brand = brand;
  if (minPrice) extraParams.minPrice = minPrice;
  if (maxPrice) extraParams.maxPrice = maxPrice;
  if (q) extraParams.q = q;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Ürünler</h1>

      <ProductFilters
        basePath="/products"
        brands={brands}
        selectedSort={selectedSort}
        selectedBrand={brand}
        selectedMinPrice={minPrice}
        selectedMaxPrice={maxPrice}
        selectedQuery={q}
      />

      <ProductGrid
        products={products}
        categories={categories}
        selectedSort={selectedSort}
        basePath="/products"
        extraParams={extraParams}
      />
    </main>
  );
}
