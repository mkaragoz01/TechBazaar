"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Category, Brand, Product } from "@/lib/types";

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categories ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="bg-accent px-6 py-3 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
      >
        {product ? "Kaydet" : "Ürünü Ekle"}
      </button>
    </form>
  );
}
