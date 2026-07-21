"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/formatPrice";
import type { Product, ProductVariant } from "@/lib/types";
import VariantSelector from "./VariantSelector";
import ProductDetailAddToCart from "./ProductDetailAddToCart";

export default function ProductPurchasePanel({
  product,
  variants,
}: {
  product: Product;
  variants: ProductVariant[];
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const hasVariants = variants.length > 0;
  const effectivePrice = selectedVariant?.priceOverride ?? product.price;
  const effectiveStock = hasVariants ? selectedVariant?.stock ?? 0 : product.stock ?? 0;

  return (
    <div>
      <p className="mt-6 font-display text-2xl font-semibold tabular-nums text-ink">
        {formatPrice(effectivePrice)}
      </p>

      {hasVariants ? (
        <div className="mt-6">
          <VariantSelector variants={variants} onSelect={setSelectedVariant} />
        </div>
      ) : null}

      <div className="mt-6">
        {hasVariants && !selectedVariant ? (
          <button
            type="button"
            disabled
            className="rounded-full bg-border px-7 py-3.5 font-semibold text-ink-muted"
          >
            Seçenek Belirleyin
          </button>
        ) : (
          <ProductDetailAddToCart
            productId={product._id}
            variantId={selectedVariant?._id}
            stock={effectiveStock}
          />
        )}
      </div>
    </div>
  );
}
