import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/api";
import { productImageUrl, ApiError } from "@/lib/server-api";
import { formatPrice } from "@/lib/formatPrice";
import { stripHtml } from "@/lib/richText";
import ProductDetailAddToCart from "@/components/ProductDetailAddToCart";
import ProductCard from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;

  try {
    const { product, brandName } = await getProduct(productId);
    const description = stripHtml(product.description).slice(0, 160) || undefined;
    const imageUrl = product.imgUrl ? productImageUrl(product.imgUrl) : undefined;

    return {
      title: brandName ? `${product.name} — ${brandName}` : product.name,
      description,
      openGraph: {
        title: product.name,
        description,
        images: imageUrl ? [{ url: imageUrl }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  let data;
  try {
    data = await getProduct(productId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const { product, categoryName, brandName, relatedProducts } = data;
  const outOfStock = (product.stock ?? 0) <= 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtml(product.description) || undefined,
    image: product.imgUrl ? [productImageUrl(product.imgUrl)] : undefined,
    brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: (product.price / 100).toFixed(2),
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="product-spotlight relative h-80 rounded-[28px] sm:h-full">
          {product.imgUrl ? (
            <Image
              src={productImageUrl(product.imgUrl)}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              className="object-contain p-8"
            />
          ) : null}
        </div>

        <div>
          <div className="flex items-center gap-3">
            {categoryName ? (
              <span className="text-xs font-bold uppercase tracking-wide text-info">
                {categoryName}
              </span>
            ) : null}
            {brandName ? (
              <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                {brandName}
              </span>
            ) : null}
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">
            {product.name}
          </h1>
          {product.description ? (
            <div
              className="rich-content mt-4 text-ink-muted"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : null}
          <p className="mt-6 font-display text-2xl font-semibold tabular-nums text-ink">
            {formatPrice(product.price)}
          </p>
          <div className="mt-6">
            <ProductDetailAddToCart productId={product._id} stock={product.stock} />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-ink">
            Benzer Ürünler
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related._id} product={related} categoryName={categoryName} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
    </>
  );
}
