import { getProducts } from "@/lib/api";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{
    sort?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
  }>;
}) {
  const { categoryId } = await params;
  const { sort, brand, minPrice, maxPrice, q } = await searchParams;
  const { products, categories, brands, selectedSort } = await getProducts({
    sort,
    category: categoryId,
    brand,
    minPrice,
    maxPrice,
    q,
  });
  const categoryName = categories.find((c) => c._id === categoryId)?.name;

  const extraParams: Record<string, string> = {};
  if (brand) extraParams.brand = brand;
  if (minPrice) extraParams.minPrice = minPrice;
  if (maxPrice) extraParams.maxPrice = maxPrice;
  if (q) extraParams.q = q;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">
        {categoryName ?? "Kategori"}
      </h1>

      <ProductFilters
        basePath={`/categories/${categoryId}`}
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
        basePath={`/categories/${categoryId}`}
        extraParams={extraParams}
      />
    </main>
  );
}
