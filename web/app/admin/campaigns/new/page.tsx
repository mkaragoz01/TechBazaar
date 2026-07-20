import { getAdminCategories, getAdminBrands } from "@/lib/api";
import CampaignForm from "@/components/admin/CampaignForm";

export default async function NewCampaignPage() {
  const [{ categories }, { brands }] = await Promise.all([getAdminCategories(), getAdminBrands()]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Yeni Kampanya</h1>
      <CampaignForm categories={categories} brands={brands} />
    </div>
  );
}
