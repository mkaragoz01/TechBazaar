import Link from "next/link";
import { getAdminCampaigns } from "@/lib/api";
import DeleteButton from "@/components/admin/DeleteButton";
import { formatPriceNumber } from "@/lib/formatPrice";

export default async function AdminCampaignsPage() {
  const { campaigns } = await getAdminCampaigns();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Kampanyalar</h1>
        <Link
          href="/admin/campaigns/new"
          className="bg-accent px-4 py-2 font-data text-xs uppercase tracking-widest text-accent-ink"
        >
          Yeni Kampanya
        </Link>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Ad</th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Kod</th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">İndirim</th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{campaign.name}</td>
                <td className="px-4 py-3 font-data text-xs text-ink-muted">{campaign.code || "Otomatik"}</td>
                <td className="px-4 py-3 font-data tabular-nums text-ink">
                  {campaign.discountType === "percentage"
                    ? `%${campaign.discountValue}`
                    : `${formatPriceNumber(campaign.discountValue)} TL`}
                </td>
                <td className="px-4 py-3">
                  {campaign.isActive ? (
                    <span className="bg-success/20 px-2 py-1 font-data text-xs text-success">Aktif</span>
                  ) : (
                    <span className="bg-ink-muted/20 px-2 py-1 font-data text-xs text-ink-muted">Pasif</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/campaigns/${campaign._id}`}
                      className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      url={`/api/admin/campaigns/${campaign._id}`}
                      confirmMessage="Bu kampanyayı silmek istediğinize emin misiniz?"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 ? (
          <p className="px-4 py-6 font-body text-ink-muted">Henüz kampanya eklenmemiş.</p>
        ) : null}
      </div>
    </div>
  );
}
