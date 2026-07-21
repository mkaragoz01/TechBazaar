import type { Metadata } from "next";
import { getProducts, getCategoryAttributes } from "@/lib/api";
import { extractAttrParams } from "@/lib/queryAttrs";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import FilterPanel from "@/components/FilterPanel";

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description: "Telefon, bilgisayar ve aksesuarlarda tüm ürünler — TechStore'da net fiyat, net spesifikasyon.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined;
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined;
  const brand = typeof resolvedSearchParams.brand === "string" ? resolvedSearchParams.brand : undefined;
  const minPrice = typeof resolvedSearchParams.minPrice === "string" ? resolvedSearchParams.minPrice : undefined;
  const maxPrice = typeof resolvedSearchParams.maxPrice === "string" ? resolvedSearchParams.maxPrice : undefined;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const attr = extractAttrParams(resolvedSearchParams);

  const [{ products, categories, brands, selectedSort, selectedAttributes }, filterAttributes] = await Promise.all([
    getProducts({ sort, category, brand, minPrice, maxPrice, q, attr }),
    // A category context is needed to know which attributes are even
    // relevant — with no category filter, products can span unrelated
    // categories with no single shared attribute set to show.
    category ? getCategoryAttributes(category).then((r) => r.attributes) : Promise.resolve([]),
  ]);

  const extraParams: Record<string, string | string[]> = {};
  if (category) extraParams.category = category;
  if (brand) extraParams.brand = brand;
  if (minPrice) extraParams.minPrice = minPrice;
  if (maxPrice) extraParams.maxPrice = maxPrice;
  if (q) extraParams.q = q;
  for (const [attributeId, values] of Object.entries(attr)) {
    extraParams[`attr[${attributeId}]`] = values;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Ürünler</h1>

      <div className="flex flex-col gap-6 sm:flex-row">
        {filterAttributes.length > 0 ? (
          <FilterPanel
            basePath="/products"
            attributes={filterAttributes}
            selectedAttributes={selectedAttributes ?? {}}
            otherParams={{ sort, category, brand, minPrice, maxPrice, q }}
          />
        ) : null}

        <div className="flex-1">
          <ProductFilters
            basePath="/products"
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
            basePath="/products"
            extraParams={extraParams}
          />
        </div>
      </div>
    </main>
  );
}
