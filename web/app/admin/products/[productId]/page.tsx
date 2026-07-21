import {
  getAdminCategories,
  getAdminBrands,
  getAdminProduct,
  getAdminCategoryAttributes,
  getAdminProductVariants,
} from "@/lib/api";
import ProductForm from "@/components/admin/ProductForm";
import ProductVariantsForm from "@/components/admin/ProductVariantsForm";
import type { CategoryAttribute } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [{ categories }, { brands }, { product }, { variants }] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
    getAdminProduct(productId),
    getAdminProductVariants(productId),
  ]);

  const attributesPerCategory = await Promise.all(
    product.categories.map((categoryId) => getAdminCategoryAttributes(categoryId))
  );
  const variantAxisAttributes: CategoryAttribute[] = [];
  const seenAttributeIds = new Set<string>();
  for (const { attributes } of attributesPerCategory) {
    for (const attribute of attributes) {
      if (attribute.isVariantAxis && !seenAttributeIds.has(attribute._id)) {
        seenAttributeIds.add(attribute._id);
        variantAxisAttributes.push(attribute);
      }
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-6 font-display text-2xl font-bold text-ink">Ürünü Düzenle</h1>
        <ProductForm categories={categories} brands={brands} product={product} />
      </div>

      {variantAxisAttributes.length > 0 ? (
        <div>
          <h2 className="mb-6 font-display text-xl font-bold text-ink">Varyantlar</h2>
          <ProductVariantsForm
            productId={productId}
            variantAxisAttributes={variantAxisAttributes}
            initialVariants={variants}
          />
        </div>
      ) : null}
    </div>
  );
}
