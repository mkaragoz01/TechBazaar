import type { Metadata } from "next";
import { getProducts, getCategoryAttributes } from "@/lib/api";
import { extractAttrParams } from "@/lib/queryAttrs";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import FilterPanel from "@/components/FilterPanel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const { categories } = await getProducts({ category: categoryId });
  const categoryName = categories.find((c) => c._id === categoryId)?.name;

  if (!categoryName) return {};

  return {
    title: categoryName,
    description: `${categoryName} kategorisindeki tüm ürünler — TechStore'da net fiyat, net spesifikasyon.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categoryId } = await params;
  const resolvedSearchParams = await searchParams;
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined;
  const brand = typeof resolvedSearchParams.brand === "string" ? resolvedSearchParams.brand : undefined;
  const minPrice = typeof resolvedSearchParams.minPrice === "string" ? resolvedSearchParams.minPrice : undefined;
  const maxPrice = typeof resolvedSearchParams.maxPrice === "string" ? resolvedSearchParams.maxPrice : undefined;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const attr = extractAttrParams(resolvedSearchParams);

  const [{ products, categories, brands, selectedSort, selectedAttributes }, { attributes: filterAttributes }] =
    await Promise.all([
      getProducts({ sort, category: categoryId, brand, minPrice, maxPrice, q, attr }),
      getCategoryAttributes(categoryId),
    ]);
  const categoryName = categories.find((c) => c._id === categoryId)?.name;

  const extraParams: Record<string, string | string[]> = {};
  if (brand) extraParams.brand = brand;
  if (minPrice) extraParams.minPrice = minPrice;
  if (maxPrice) extraParams.maxPrice = maxPrice;
  if (q) extraParams.q = q;
  for (const [attributeId, values] of Object.entries(attr)) {
    extraParams[`attr[${attributeId}]`] = values;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">
        {categoryName ?? "Kategori"}
      </h1>

      <div className="flex flex-col gap-6 sm:flex-row">
        {filterAttributes.length > 0 ? (
          <FilterPanel
            basePath={`/categories/${categoryId}`}
            attributes={filterAttributes}
            selectedAttributes={selectedAttributes ?? {}}
            otherParams={{ sort, brand, minPrice, maxPrice, q }}
          />
        ) : null}

        <div className="flex-1">
          <ProductFilters
            basePath={`/categories/${categoryId}`}
            brands={brands}
            selectedSort={selectedSort}
            selectedBrand={brand}
            selectedMinPrice={minPrice}
            selectedMaxPrice={maxPrice}
            selectedQuery={q}
            selectedAttributes={selectedAttributes}
          />

          <ProductGrid
            products={products}
            categories={categories}
            selectedSort={selectedSort}
            basePath={`/categories/${categoryId}`}
            extraParams={extraParams}
          />
        </div>
      </div>
    </main>
  );
}
