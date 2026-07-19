import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { productImageUrl, ApiError } from "@/lib/server-api";
import { formatPrice } from "@/lib/formatPrice";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";

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

  return (
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
            <AddToCartButton productId={product._id} outOfStock={outOfStock} />
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
  );
}
