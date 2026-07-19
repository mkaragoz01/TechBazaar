import { getAdminBrand } from "@/lib/api";
import BrandForm from "@/components/admin/BrandForm";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const { brand } = await getAdminBrand(brandId);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Markayı Düzenle</h1>
      <BrandForm brand={brand} />
    </div>
  );
}
