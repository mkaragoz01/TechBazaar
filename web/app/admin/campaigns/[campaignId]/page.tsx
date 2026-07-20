import { getAdminCampaign, getAdminCategories, getAdminBrands } from "@/lib/api";
import CampaignForm from "@/components/admin/CampaignForm";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const [{ campaign }, { categories }, { brands }] = await Promise.all([
    getAdminCampaign(campaignId),
    getAdminCategories(),
    getAdminBrands(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Kampanyayı Düzenle</h1>
      <CampaignForm campaign={campaign} categories={categories} brands={brands} />
    </div>
  );
}
