import { getAdminOrders } from "@/lib/api";
import { formatPriceNumber } from "@/lib/formatPrice";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

const STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { orders } = await getAdminOrders(status);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Siparişler</h1>
      </div>

      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Durum
          </span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
          >
            <option value="">Tümü</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-accent px-4 py-2 font-data text-xs uppercase tracking-widest text-accent-ink"
        >
          Filtrele
        </button>
      </form>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Sipariş
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Müşteri
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Tarih
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Tutar
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Durum
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const total = order.items.reduce(
                (sum, item) => sum + item.product.price * item.quantity,
                0
              );
              return (
                <tr key={order._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-data text-xs text-ink-muted">
                    #{order._id.slice(-8)}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {order.user?.name ?? "-"}
                    <div className="text-xs text-ink-muted">{order.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("tr-TR")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 font-data tabular-nums text-ink">
                    {formatPriceNumber(total)} TL
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect orderId={order._id} status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 ? (
          <p className="px-4 py-6 font-body text-ink-muted">Sipariş bulunamadı.</p>
        ) : null}
      </div>
    </div>
  );
}
