import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { productImageUrl, ApiError } from "@/lib/server-api";
import { formatPrice } from "@/lib/formatPrice";
import AddToCartButton from "@/components/AddToCartButton";

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

  const { product, categoryName } = data;

  return (
    <main className="mx-auto grid max-w-4xl gap-8 px-6 py-10 sm:grid-cols-2">
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
        {categoryName ? (
          <span className="font-data text-xs uppercase tracking-widest text-info">
            {categoryName}
          </span>
        ) : null}
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">
          {product.name}
        </h1>
        {product.description ? (
          <p className="mt-4 font-body text-ink-muted">{product.description}</p>
        ) : null}
        <p className="mt-6 font-data text-2xl font-semibold tabular-nums text-ink">
          {formatPrice(product.price)}
        </p>
        <div className="mt-6">
          <AddToCartButton productId={product._id} />
        </div>
      </div>
    </main>
  );
}
