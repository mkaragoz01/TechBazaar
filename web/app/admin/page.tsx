import Link from "next/link";
import { getAdminDashboard } from "@/lib/api";
import { formatPriceNumber } from "@/lib/formatPrice";
import DashboardCharts from "@/components/admin/DashboardCharts";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface-2 p-4">
      <p className="font-data text-xs uppercase tracking-widest text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { orders } = await getAdminDashboard();

  const totalOrders = orders.length;
  let totalQuantity = 0;
  let totalRevenue = 0;
  const productStatsMap = new Map<
    string,
    { name: string; totalQuantity: number; totalRevenue: number }
  >();

  for (const order of orders) {
    for (const item of order.items) {
      totalQuantity += item.quantity;
      totalRevenue += item.product.price * item.quantity;

      const key = item.product._id;
      const existing = productStatsMap.get(key);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.product.price * item.quantity;
      } else {
        productStatsMap.set(key, {
          name: item.product.name,
          totalQuantity: item.quantity,
          totalRevenue: item.product.price * item.quantity,
        });
      }
    }
  }

  const topProducts = [...productStatsMap.values()]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const now = new Date();
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);

    let orderCount = 0;
    let revenue = 0;
    for (const order of orders) {
      if (!order.createdAt) continue;
      const created = new Date(order.createdAt);
      if (created >= weekStart && created < weekEnd) {
        orderCount++;
        revenue += order.items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      }
    }
    weeks.push({ label: `${4 - i}. Hafta`, orders: orderCount, revenue: revenue / 100 });
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Panel</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Toplam Sipariş" value={String(totalOrders)} />
        <StatTile label="Satılan Ürün" value={String(totalQuantity)} />
        <StatTile label="Toplam Gelir" value={`${formatPriceNumber(totalRevenue)} TL`} />
        <StatTile label="Ortalama Sipariş" value={`${formatPriceNumber(avgOrderValue)} TL`} />
      </div>

      {orders.length > 0 ? (
        <>
          <DashboardCharts
            productLabels={topProducts.map((p) => p.name)}
            productData={topProducts.map((p) => p.totalQuantity)}
            weekLabels={weeks.map((w) => w.label)}
            weekOrders={weeks.map((w) => w.orders)}
            weekRevenue={weeks.map((w) => w.revenue)}
          />

          <div className="mt-8 overflow-x-auto border border-border">
            <table className="w-full border-collapse font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Ürün
                  </th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Satış Adedi
                  </th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Toplam Gelir
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink">{p.name}</td>
                    <td className="px-4 py-3 font-data tabular-nums text-ink-muted">
                      {p.totalQuantity}
                    </td>
                    <td className="px-4 py-3 font-data tabular-nums text-ink">
                      {formatPriceNumber(p.totalRevenue)} TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Son Siparişler</h2>
            <Link
              href="/admin/orders"
              className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
            >
              Tüm siparişleri gör
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto border border-border">
            <table className="w-full border-collapse font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Sipariş
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
                {recentOrders.map((order) => {
                  const total = order.items.reduce(
                    (sum, item) => sum + item.product.price * item.quantity,
                    0
                  );
                  return (
                    <tr key={order._id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-data text-xs text-ink-muted">
                        #{order._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("tr-TR")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 font-data tabular-nums text-ink">
                        {formatPriceNumber(total)} TL
                      </td>
                      <td className="px-4 py-3 font-data text-xs uppercase tracking-widest text-info">
                        {STATUS_LABELS[order.status]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="font-body text-ink-muted">Henüz sipariş bulunmuyor.</p>
      )}
    </div>
  );
}
