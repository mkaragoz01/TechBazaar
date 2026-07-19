import { getAdminCategories, getAdminBrands } from "@/lib/api";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [{ categories }, { brands }] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Yeni Ürün</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
