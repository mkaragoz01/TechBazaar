import { getAdminCategories } from "@/lib/api";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const { categories } = await getAdminCategories();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-black text-ink">Yeni Ürün</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
