import { getAdminCategory, getAdminCategoryAttributes } from "@/lib/api";
import CategoryForm from "@/components/admin/CategoryForm";
import CategoryAttributeManager from "@/components/admin/CategoryAttributeManager";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const [{ category }, { attributes }] = await Promise.all([
    getAdminCategory(categoryId),
    getAdminCategoryAttributes(categoryId),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-6 font-display text-2xl font-bold text-ink">Kategoriyi Düzenle</h1>
        <CategoryForm category={category} />
      </div>

      <div>
        <h2 className="mb-6 font-display text-xl font-bold text-ink">Özellikler</h2>
        <CategoryAttributeManager categoryId={categoryId} initialAttributes={attributes} />
      </div>
    </div>
  );
}
