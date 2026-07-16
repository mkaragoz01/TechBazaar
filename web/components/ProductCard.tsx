import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { productImageUrl } from "@/lib/server-api";
import { formatPriceNumber } from "@/lib/formatPrice";

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
      className="notch group flex flex-col gap-2 border border-border bg-surface-2 p-4 transition-transform hover:-translate-y-1 hover:border-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {categoryName ? (
        <span className="font-data text-[0.65rem] uppercase tracking-widest text-info">
          {categoryName}
        </span>
      ) : null}

      <div className="relative h-28 border border-border bg-bg">
        {product.imgUrl ? (
          <Image
            src={productImageUrl(product.imgUrl)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            className="object-contain p-3"
          />
        ) : null}
      </div>

      <h3 className="font-display text-base font-black leading-tight text-ink">
        {product.name}
      </h3>

      {product.description ? (
        <p className="line-clamp-2 font-body text-xs text-ink-muted">
          {product.description}
        </p>
      ) : null}

      <span className="font-data text-lg font-semibold tabular-nums text-ink">
        {formatPriceNumber(product.price)}{" "}
        <span className="text-xs font-normal text-ink-muted">TL</span>
      </span>
    </Link>
  );
}
