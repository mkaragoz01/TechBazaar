import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { productImageUrl } from "@/lib/server-api";
import { formatPriceNumber } from "@/lib/formatPrice";
import { stripHtml } from "@/lib/richText";

export default function ProductCard({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  return (
    <Link
      href={`/products/${product._id}`}
      className="group flex flex-col gap-3 rounded-3xl bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="product-spotlight relative h-40 rounded-2xl">
        {product.imgUrl ? (
          <Image
            src={productImageUrl(product.imgUrl)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 90vw, 320px"
            className="object-contain p-4"
          />
        ) : null}
      </div>

      {categoryName ? (
        <span className="text-xs font-bold uppercase tracking-wide text-info">
          {categoryName}
        </span>
      ) : null}

      <h3 className="font-display text-base font-bold leading-tight text-ink">
        {product.name}
      </h3>

      {product.description ? (
        <p className="line-clamp-2 font-body text-sm text-ink-muted">
          {stripHtml(product.description)}
        </p>
      ) : null}

      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-display text-lg font-bold tabular-nums text-ink">
          {formatPriceNumber(product.price)} TL
        </span>
        <span className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition-colors group-hover:bg-ink group-hover:text-bg group-hover:border-ink">
          İncele
        </span>
      </div>
    </Link>
  );
}
