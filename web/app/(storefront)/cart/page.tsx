import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/api";
import { productImageUrl, ApiError } from "@/lib/server-api";
import { formatPriceNumber } from "@/lib/formatPrice";
import RemoveFromCartButton from "@/components/RemoveFromCartButton";
import CampaignCodeForm from "@/components/CampaignCodeForm";

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
            <div
              key={item._id}
              className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm"
            >
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
                <p className="font-data text-xs text-ink-muted">
                  {item.quantity} adet × {formatPriceNumber(item.price)} TL
                </p>
              </div>
              <p className="font-data font-semibold tabular-nums text-ink">
                {formatPriceNumber(item.price * item.quantity)} TL
              </p>
              <RemoveFromCartButton productId={item._id} />
            </div>
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
            <Link
              href="/checkout"
              className="inline-block rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              Siparişi Tamamla
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
