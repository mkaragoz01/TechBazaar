import Link from "next/link";
import { getHomeData } from "@/lib/api";
import SiteHeader from "@/components/SiteHeader";
import ProductCard from "@/components/ProductCard";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const { products, categories, selectedSort } = await getHomeData(sort);

  const categoryNameById = new Map(categories.map((c) => [c._id, c.name]));

  return (
    <>
      <SiteHeader categories={categories} />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-10 max-w-2xl">
          <h1 className="text-balance font-display text-4xl font-black leading-[0.95] text-ink sm:text-5xl">
            Rafın üstünden en yeniler.
          </h1>
          <p className="mt-3 font-body text-ink-muted">
            En yeni telefon, bilgisayar ve aksesuarlar — spesifikasyonu net,
            fiyatı net.
          </p>
        </section>

        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
            {products.length} ürün
          </span>
          <div className="flex gap-4 font-data text-xs uppercase tracking-widest">
            <Link
              href="/?sort=price_asc"
              className={
                selectedSort === "price_asc"
                  ? "text-accent"
                  : "text-ink-muted transition-colors hover:text-ink"
              }
            >
              Fiyat: Artan
            </Link>
            <Link
              href="/?sort=price_desc"
              className={
                selectedSort === "price_desc"
                  ? "text-accent"
                  : "text-ink-muted transition-colors hover:text-ink"
              }
            >
              Fiyat: Azalan
            </Link>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                categoryName={categoryNameById.get(product.categories[0])}
              />
            ))}
          </div>
        ) : (
          <p className="font-body text-ink-muted">
            Şu an listelenecek ürün yok.
          </p>
        )}
      </main>
    </>
  );
}
