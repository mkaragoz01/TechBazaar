import { getAdminCategory } from "@/lib/api";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const { category } = await getAdminCategory(categoryId);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Kategoriyi Düzenle</h1>
      <CategoryForm category={category} />
    </div>
  );
}
