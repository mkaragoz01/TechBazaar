import Link from "next/link";
import ProductCard from "./ProductCard";
import type { Product, Category } from "@/lib/types";

export default function ProductGrid({
  products,
  categories,
  selectedSort,
  basePath,
  extraParams = {},
}: {
  products: Product[];
  categories: Category[];
  selectedSort?: string | null;
  basePath: string;
  extraParams?: Record<string, string>;
}) {
  const categoryNameById = new Map(categories.map((c) => [c._id, c.name]));

  function sortHref(sort: string) {
    const params = new URLSearchParams({ ...extraParams, sort });
    return `${basePath}?${params.toString()}`;
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <span className="text-sm text-ink-muted">{products.length} ürün</span>
        {selectedSort ? (
          <div className="flex gap-2 text-sm font-semibold">
            <Link
              href={sortHref("price_asc")}
              className={
                selectedSort === "price_asc"
                  ? "rounded-full bg-ink px-4 py-2 text-bg"
                  : "rounded-full border border-border px-4 py-2 text-ink-muted transition-colors hover:text-ink"
              }
            >
              Fiyat: Artan
            </Link>
            <Link
              href={sortHref("price_desc")}
              className={
                selectedSort === "price_desc"
                  ? "rounded-full bg-ink px-4 py-2 text-bg"
                  : "rounded-full border border-border px-4 py-2 text-ink-muted transition-colors hover:text-ink"
              }
            >
              Fiyat: Azalan
            </Link>
          </div>
        ) : null}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              categoryName={categoryNameById.get(product.categories[0])}
            />
          ))}
        </div>
      ) : (
        <p className="font-body text-ink-muted">Şu an listelenecek ürün yok.</p>
      )}
    </>
  );
}
