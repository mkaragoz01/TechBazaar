import { getProducts } from "@/lib/api";
import ProductGrid from "@/components/ProductGrid";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { categoryId } = await params;
  const { sort } = await searchParams;
  const { products, categories, selectedSort } = await getProducts({
    sort,
    category: categoryId,
  });
  const categoryName = categories.find((c) => c._id === categoryId)?.name;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">
        {categoryName ?? "Kategori"}
      </h1>
      <ProductGrid
        products={products}
        categories={categories}
        selectedSort={selectedSort}
        basePath={`/categories/${categoryId}`}
      />
    </main>
  );
}
