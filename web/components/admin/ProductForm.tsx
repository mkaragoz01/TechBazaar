"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AdminButton from "@/components/admin/AdminButton";
import type { Category, Brand, Product, CategoryAttribute } from "@/lib/types";

export default function ProductForm({
  categories,
  brands,
  product,
}: {
  categories: Category[];
  brands: Brand[];
  product?: Product;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? (product.price / 100).toFixed(2) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [stock, setStock] = useState(product ? String(product.stock ?? 0) : "0");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [isNewArrival, setIsNewArrival] = useState(product?.isNewArrival ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categories ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [specAttributes, setSpecAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(
    Object.fromEntries((product?.attributes ?? []).map((a) => [a.attribute, a.value]))
  );

  // Ürünün "özellikler" (specs) bölümü seçilen kategorilere göre değişir —
  // varyant ekseni olan özellikler burada gösterilmez, onlar sadece
  // ProductVariantsForm üzerinden yönetilir.
  useEffect(() => {
    const fetchAttributes = selectedCategories.length === 0
      ? Promise.resolve([])
      : Promise.all(
          selectedCategories.map((id) =>
            clientFetch<{ attributes: CategoryAttribute[] }>(`/api/admin/category-attributes?category=${id}`)
          )
        ).then((results) => {
          const byId = new Map<string, CategoryAttribute>();
          for (const result of results) {
            for (const attribute of result.attributes) {
              if (!attribute.isVariantAxis) {
                byId.set(attribute._id, attribute);
              }
            }
          }
          return [...byId.values()];
        });

    fetchAttributes.then(setSpecAttributes).catch(() => setSpecAttributes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- comparing the joined id list on purpose, not array identity
  }, [selectedCategories.join(",")]);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (selectedCategories.length === 0) {
      setError("Lütfen en az bir kategori seçin.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (product) {
        await clientFetch(`/api/admin/products/${product._id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        await clientFetch(`/api/admin/products`, { method: "POST", body: formData });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField
        label="Ürün Adı"
        name="name"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Fiyat (TL)"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <FormField
          label="Stok"
          name="stock"
          type="number"
          step="1"
          min="0"
          required
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>

      <FormField
        label="SKU (opsiyonel)"
        name="sku"
        type="text"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
      />

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Marka
        </span>
        <select
          name="brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-3 font-body text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
        >
          <option value="">Marka seçilmedi</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Açıklama
        </span>
        <input type="hidden" name="description" value={description} />
        <RichTextEditor value={description} onChange={setDescription} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Kategoriler
        </legend>
        {categories.map((category) => (
          <label key={category._id} className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              name="categoryids"
              value={category._id}
              checked={selectedCategories.includes(category._id)}
              onChange={() => toggleCategory(category._id)}
            />
            {category.name}
          </label>
        ))}
      </fieldset>

      {specAttributes.length > 0 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Özellikler
          </legend>
          <input type="hidden" name="attributes" value={JSON.stringify(
            Object.entries(attributeValues)
              .filter(([, value]) => value)
              .map(([attribute, value]) => ({ attribute, value }))
          )} />
          {specAttributes.map((attribute) => (
            <label key={attribute._id} className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {attribute.name}
                {attribute.unit ? ` (${attribute.unit})` : ""}
              </span>
              {attribute.valueType === "select" ? (
                <select
                  value={attributeValues[attribute._id] ?? ""}
                  onChange={(e) =>
                    setAttributeValues((prev) => ({ ...prev, [attribute._id]: e.target.value }))
                  }
                  className="rounded-xl border border-border bg-surface px-4 py-3 font-body text-ink"
                >
                  <option value="">Seçilmedi</option>
                  {attribute.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={attributeValues[attribute._id] ?? ""}
                  onChange={(e) =>
                    setAttributeValues((prev) => ({ ...prev, [attribute._id]: e.target.value }))
                  }
                  className="rounded-xl border border-border bg-surface px-4 py-3 font-body text-ink"
                />
              )}
            </label>
          ))}
        </fieldset>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Vitrin Etiketleri
        </legend>
        <label className="flex items-center gap-2 font-body text-sm text-ink">
          <input
            type="checkbox"
            name="isNewArrival"
            value="true"
            checked={isNewArrival}
            onChange={(e) => setIsNewArrival(e.target.checked)}
          />
          Yeni
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-ink">
          <input
            type="checkbox"
            name="isFeatured"
            value="true"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Öne Çıkan
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Durum
        </legend>
        <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
        <label className="flex items-center gap-2 font-body text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Aktif (mağazada görünür)
        </label>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Görsel {product ? "(değiştirmek için seçin)" : ""}
        </span>
        <input
          type="file"
          name="imgUrl"
          accept="image/*"
          required={!product}
          className="font-body text-sm text-ink"
        />
      </label>

      {error ? <p className="font-body text-sm text-danger">{error}</p> : null}

      <AdminButton type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : product ? "Kaydet" : "Ürünü Ekle"}
      </AdminButton>
    </form>
  );
}
