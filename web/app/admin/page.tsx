import Link from "next/link";
import { getAdminDashboard } from "@/lib/api";
import { formatPriceNumber } from "@/lib/formatPrice";
import RevenueChart from "@/components/admin/RevenueChart";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

const STATUS_CHIP_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-info/15 text-info",
  shipped: "bg-accent/15 text-accent",
  delivered: "bg-success/15 text-success",
};

const SWATCH_COLORS = ["#3b6ea5", "#6b6b6f", "#e8541e", "#3f7d55", "#8a5fbf"];

function swatchColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return SWATCH_COLORS[hash % SWATCH_COLORS.length];
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-data text-[11px] font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current ${STATUS_CHIP_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function Delta({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) return null;
  const isGood = invert ? value <= 0 : value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 font-data text-xs font-semibold ${isGood ? "text-success" : "text-accent"}`}>
      {value >= 0 ? "▲" : "▼"} %{Math.abs(value)}
      <span className="font-body font-normal text-ink-muted">geçen haftaya göre</span>
    </span>
  );
}

export default async function AdminDashboardPage() {
  const { kpis, chart, topProducts, recentOrders, lowStockProducts, pendingOrders } = await getAdminDashboard();

  const maxTopQuantity = Math.max(1, ...topProducts.map((p) => p.totalQuantity));

  return (
    <div>
      <div className="mb-7 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">Panel</h1>
      </div>

      {/* KPI row */}
      <div className="mb-7 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-[20px] bg-surface p-5 shadow-sm">
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-ink-muted">Toplam Gelir</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
            {formatPriceNumber(kpis.totalRevenue)} TL
          </p>
          <div className="mt-1.5">
            <Delta value={kpis.totalRevenueDeltaPct} />
          </div>
        </div>

        <div className="rounded-[20px] bg-surface p-5 shadow-sm">
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-ink-muted">Sipariş Sayısı</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">{kpis.totalOrders}</p>
          <p className="mt-1.5 font-body text-xs text-ink-muted">
            <span className={`font-data font-semibold ${kpis.orderCountDelta >= 0 ? "text-success" : "text-accent"}`}>
              {kpis.orderCountDelta >= 0 ? "▲" : "▼"} {Math.abs(kpis.orderCountDelta)} sipariş
            </span>{" "}
            bu hafta
          </p>
        </div>

        <div className="rounded-[20px] bg-surface p-5 shadow-sm">
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-ink-muted">Ortalama Sepet</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
            {formatPriceNumber(kpis.avgOrderValue)} TL
          </p>
          <div className="mt-1.5">
            <Delta value={kpis.avgOrderValueDeltaPct} />
          </div>
        </div>

        <div className="rounded-[20px] bg-surface p-5 shadow-sm">
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-ink-muted">Bekleyen Sipariş</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">{kpis.pendingCount}</p>
          <p className="mt-1.5 font-body text-xs text-ink-muted">
            {kpis.oldestPendingHours !== null ? (
              <>
                En eskisi {kpis.oldestPendingHours} saattir bekliyor —{" "}
                <a href="#attention" className="font-data font-semibold text-warning">
                  incele →
                </a>
              </>
            ) : (
              "Bekleyen sipariş yok"
            )}
          </p>
        </div>
      </div>

      {/* Chart + attention zone */}
      <div className="mb-7 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <RevenueChart chart={chart} />

        <div id="attention" className="rounded-3xl bg-surface p-6 shadow-sm">
          <h2 className="font-display text-base font-bold text-ink">Dikkat Gerektirenler</h2>
          <p className="mt-0.5 font-body text-xs text-ink-muted">Şu an harekete geçilmesi gerekenler</p>

          <div className="mt-4 flex flex-col gap-2.5">
            {lowStockProducts.map((product) => (
              <div key={product._id} className="flex items-start gap-2.5 rounded-2xl bg-surface-2 p-3">
                <span className="mt-0.5 h-full w-1 shrink-0 self-stretch rounded bg-warning" />
                <div className="flex-1">
                  <p className="font-body text-sm font-semibold text-ink">
                    {product.name} {product.stock === 0 ? "stoğu tükendi" : "stoğu azaldı"}
                  </p>
                  <p className="font-body text-xs text-ink-muted">
                    {product.stock === 0 ? "0 adet — vitrinden gizli" : `Sadece ${product.stock} adet kaldı`}
                  </p>
                </div>
                <Link
                  href={`/admin/products/${product._id}`}
                  className="whitespace-nowrap font-data text-xs font-semibold text-info"
                >
                  Güncelle →
                </Link>
              </div>
            ))}

            {pendingOrders.map((order) => (
              <div key={order._id} className="flex items-start gap-2.5 rounded-2xl bg-surface-2 p-3">
                <span className="mt-0.5 h-full w-1 shrink-0 self-stretch rounded bg-accent" />
                <div className="flex-1">
                  <p className="font-body text-sm font-semibold text-ink">
                    Sipariş #{order._id.slice(-8)} beklemede
                  </p>
                  <p className="font-body text-xs text-ink-muted">
                    {order.user?.name ?? "-"}
                    {order.createdAt ? ` · ${new Date(order.createdAt).toLocaleDateString("tr-TR")}` : ""}
                  </p>
                </div>
                <Link href="/admin/orders" className="whitespace-nowrap font-data text-xs font-semibold text-info">
                  İncele →
                </Link>
              </div>
            ))}

            {lowStockProducts.length === 0 && pendingOrders.length === 0 ? (
              <p className="px-1 py-2 font-body text-sm text-ink-muted">
                Şu an dikkat gerektiren bir şey yok.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1.5fr]">
        <div className="rounded-3xl bg-surface p-6 shadow-sm">
          <h2 className="font-display text-base font-bold text-ink">En Çok Satanlar</h2>
          <p className="mt-0.5 font-body text-xs text-ink-muted">Tüm zamanlar, adet bazında</p>

          {topProducts.length === 0 ? (
            <p className="mt-4 font-body text-sm text-ink-muted">Henüz satış yok.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3.5">
              {topProducts.map((product) => (
                <div key={product._id} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] font-data text-xs font-bold text-white"
                    style={{ backgroundColor: swatchColor(product._id) }}
                  >
                    {initials(product.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-semibold text-ink">{product.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-border">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${(product.totalQuantity / maxTopQuantity) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-data text-sm tabular-nums text-ink">{product.totalQuantity} adet</p>
                    <p className="font-data text-xs tabular-nums text-ink-muted">
                      {formatPriceNumber(product.totalRevenue)} TL
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-surface p-6 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-bold text-ink">Son Siparişler</h2>
            <Link href="/admin/orders" className="font-data text-xs font-semibold text-info hover:text-accent">
              Tüm siparişleri gör →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="mt-4 font-body text-sm text-ink-muted">Henüz sipariş yok.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse font-body text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 pb-2.5 font-data text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Müşteri
                    </th>
                    <th className="px-3 pb-2.5 font-data text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Tarih
                    </th>
                    <th className="px-3 pb-2.5 text-right font-data text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Tutar
                    </th>
                    <th className="px-3 pb-2.5 font-data text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const total =
                      order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) -
                      (order.discountAmount ?? 0);
                    return (
                      <tr key={order._id} className="border-b border-border last:border-0">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-ink">{order.user?.name ?? "-"}</p>
                          <p className="font-data text-xs text-ink-muted">#{order._id.slice(-8)}</p>
                        </td>
                        <td className="px-3 py-3 text-ink-muted">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("tr-TR") : "-"}
                        </td>
                        <td className="px-3 py-3 text-right font-data tabular-nums text-ink">
                          {formatPriceNumber(total)} TL
                        </td>
                        <td className="px-3 py-3">
                          <StatusChip status={order.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
