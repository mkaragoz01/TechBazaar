import Image from "next/image";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/api";
import { productImageUrl, ApiError } from "@/lib/server-api";
import { formatPriceNumber } from "@/lib/formatPrice";
import RemoveFromCartButton from "@/components/RemoveFromCartButton";
import CartQuantityStepper from "@/components/CartQuantityStepper";
import CampaignCodeForm from "@/components/CampaignCodeForm";
import Button from "@/components/Button";
import Card from "@/components/Card";

export default async function CartPage() {
  let items;
  let discount;
  try {
    ({ items, discount } = await getCart());
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/login?redirectTo=/cart");
    }
    throw err;
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - (discount?.amount ?? 0);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Sepetim</h1>

      {items.length === 0 ? (
        <p className="font-body text-ink-muted">Sepetiniz boş.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Card key={`${item._id}-${item.variantId ?? ""}`} size="sm" className="flex items-center gap-4">
              <div className="product-spotlight relative h-16 w-16 shrink-0 rounded-xl">
                {item.imgUrl ? (
                  <Image
                    src={productImageUrl(item.imgUrl)}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-ink">{item.name}</p>
                {item.variantLabel ? (
                  <p className="font-body text-xs text-ink-muted">{item.variantLabel}</p>
                ) : null}
                <p className="font-data text-xs text-ink-muted">{formatPriceNumber(item.price)} TL / adet</p>
              </div>
              <CartQuantityStepper
                productId={item._id}
                variantId={item.variantId}
                quantity={item.quantity}
                stock={item.stock}
              />
              <p className="w-24 text-right font-data font-semibold tabular-nums text-ink">
                {formatPriceNumber(item.price * item.quantity)} TL
              </p>
              <RemoveFromCartButton productId={item._id} variantId={item.variantId} />
            </Card>
          ))}

          <CampaignCodeForm discount={discount} />

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {discount ? (
              <div className="flex items-center justify-between font-body text-sm text-success">
                <span>{discount.campaignName}</span>
                <span className="font-data tabular-nums">-{formatPriceNumber(discount.amount)} TL</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="font-body text-ink-muted">Toplam</span>
              <span className="font-data text-xl font-semibold tabular-nums text-ink">
                {formatPriceNumber(total)} TL
              </span>
            </div>
          </div>

          <div>
            <Button href="/checkout">Siparişi Tamamla</Button>
          </div>
        </div>
      )}
    </main>
  );
}
