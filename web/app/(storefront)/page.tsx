import { getHomeData } from "@/lib/api";
import ProductGrid from "@/components/ProductGrid";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const { products, categories, selectedSort } = await getHomeData(sort);

  return (
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

      <ProductGrid
        products={products}
        categories={categories}
        selectedSort={selectedSort}
        basePath="/"
      />
    </main>
  );
}
