import { getAdminCategories, getAdminProduct } from "@/lib/api";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [{ categories }, { product }] = await Promise.all([
    getAdminCategories(),
    getAdminProduct(productId),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-black text-ink">Ürünü Düzenle</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
