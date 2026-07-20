import Image from "next/image";
import Link from "next/link";
import { getHomeData } from "@/lib/api";
import { productImageUrl } from "@/lib/server-api";
import ProductGrid from "@/components/ProductGrid";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const { products, categories, selectedSort, campaign } = await getHomeData(sort);
  const featured = products[0];

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <section className="grid overflow-hidden rounded-[28px] bg-surface shadow-lg sm:grid-cols-2 sm:items-center">
          <div className="p-10 sm:p-14">
            <span className="text-xs font-bold uppercase tracking-wide text-accent">
              Yeni Sezon
            </span>
            <h1 className="mt-3 text-balance font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
              Vitrindeki her <span className="text-accent">parça</span> özenle seçildi.
            </h1>
            <p className="mt-4 max-w-[40ch] text-ink-muted">
              Telefon, bilgisayar ve aksesuarlarda en yeniler — geniş bir nefes
              alanında, kendi ışığında.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              Ürünleri Keşfet →
            </Link>
          </div>
          <div className="product-spotlight relative hidden h-full min-h-[360px] sm:block">
            {featured?.imgUrl ? (
              <Image
                src={productImageUrl(featured.imgUrl)}
                alt={featured.name}
                fill
                sizes="480px"
                className="object-contain p-12"
              />
            ) : null}
          </div>
        </section>

        {categories.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg">
              Tümü
            </span>
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category._id}`}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-ink"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold text-ink">
          Rafın Üstünden En Yeniler
        </h2>
        <ProductGrid
          products={products}
          categories={categories}
          selectedSort={selectedSort}
          basePath="/"
        />

        {campaign ? (
          <div className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-[24px] bg-ink px-10 py-11 text-bg">
            <div>
              <h3 className="font-display text-2xl font-bold">{campaign.name}</h3>
              {campaign.description ? (
                <p className="mt-1 max-w-[46ch] text-ink-muted">{campaign.description}</p>
              ) : null}
            </div>
            <Link
              href="/products"
              className="whitespace-nowrap rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink"
            >
              Detayları Gör
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
