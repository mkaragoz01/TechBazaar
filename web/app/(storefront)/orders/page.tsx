import Image from "next/image";
import { redirect } from "next/navigation";
import { getOrders } from "@/lib/api";
import { productImageUrl, ApiError } from "@/lib/server-api";
import { formatPriceNumber } from "@/lib/formatPrice";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

export default async function OrdersPage() {
  let orders;
  try {
    ({ orders } = await getOrders());
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/login?redirectTo=/orders");
    }
    throw err;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Siparişlerim</h1>

      {orders.length === 0 ? (
        <p className="font-body text-ink-muted">Henüz siparişiniz bulunmuyor.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const subtotal = order.items.reduce(
              (sum, item) => sum + item.product.price * item.quantity,
              0
            );
            const total = subtotal - (order.discountAmount ?? 0);

            return (
              <div key={order._id} className="rounded-2xl bg-surface p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <span className="font-data text-xs text-ink-muted">
                    Sipariş #{order._id.slice(-8)}
                    {order.createdAt
                      ? ` · ${new Date(order.createdAt).toLocaleDateString("tr-TR")}`
                      : ""}
                  </span>
                  <span className="font-data text-xs uppercase tracking-widest text-info">
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                {order.shippingAddress || order.paymentDisplay ? (
                  <div className="mb-4 flex flex-col gap-1 border-b border-border pb-3 font-body text-xs text-ink-muted">
                    {order.shippingAddress ? (
                      <p>
                        {order.shippingAddress.fullName} · {order.shippingAddress.addressLine},{" "}
                        {order.shippingAddress.district}/{order.shippingAddress.city}
                      </p>
                    ) : null}
                    {order.paymentDisplay ? <p>{order.paymentDisplay}</p> : null}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="product-spotlight relative h-12 w-12 shrink-0 rounded-lg">
                        {item.product.imgUrl ? (
                          <Image
                            src={productImageUrl(item.product.imgUrl)}
                            alt={item.product.name}
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-sm text-ink">{item.product.name}</p>
                        {item.variant?.label ? (
                          <p className="font-body text-xs text-ink-muted">{item.variant.label}</p>
                        ) : null}
                        <p className="font-data text-xs text-ink-muted">
                          {item.quantity} adet
                        </p>
                      </div>
                      <p className="font-data text-sm tabular-nums text-ink-muted">
                        {formatPriceNumber(item.product.price * item.quantity)} TL
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
                  {order.discountAmount ? (
                    <div className="flex items-center justify-between font-body text-sm text-success">
                      <span>{order.campaignName}</span>
                      <span className="font-data tabular-nums">
                        -{formatPriceNumber(order.discountAmount)} TL
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-ink-muted">Toplam</span>
                    <span className="font-data text-lg font-semibold tabular-nums text-ink">
                      {formatPriceNumber(total)} TL
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
