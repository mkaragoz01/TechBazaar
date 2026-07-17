"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import type { Category, Product } from "@/lib/types";

export default function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? (product.price / 100).toFixed(2) : "");
  const [description, setDescription] = useState(product?.description ?? "");
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
    setLoading(true);
    setError(null);

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

      <label className="flex flex-col gap-1">
        <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
          Açıklama
        </span>
        <textarea
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-border bg-surface-2 px-3 py-2 font-body text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-info"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-data text-xs uppercase tracking-widest text-ink-muted">
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

      <label className="flex flex-col gap-1">
        <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
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
