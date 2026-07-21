"use client";

import { useState, type FormEvent } from "react";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import AdminButton from "@/components/admin/AdminButton";
import type { CategoryAttribute, ProductVariant } from "@/lib/types";

function variantLabel(variant: ProductVariant) {
  return variant.attributes.map((a) => `${a.attribute.name}: ${a.value}`).join(", ");
}

// Only rendered when the product's categories have at least one
// isVariantAxis attribute (e.g. Renk, Depolama) — reuses the same
// dynamic-row-list shape CampaignForm's condition rows already established.
export default function ProductVariantsForm({
  productId,
  variantAxisAttributes,
  initialVariants,
}: {
  productId: string;
  variantAxisAttributes: CategoryAttribute[];
  initialVariants: ProductVariant[];
}) {
  const [variants, setVariants] = useState(initialVariants);
  const [showForm, setShowForm] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [priceOverride, setPriceOverride] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const attributes = variantAxisAttributes.map((attribute) => ({
      attribute: attribute._id,
      value: selections[attribute._id],
    }));
    if (attributes.some((a) => !a.value)) {
      setError("Lütfen tüm özellikleri seçin.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("attributes", JSON.stringify(attributes));
      formData.append("sku", sku);
      formData.append("stock", stock);
      if (priceOverride) formData.append("priceOverride", priceOverride);
      if (image) formData.append("imgUrl", image);

      const { variant } = await clientFetch<{ variant: ProductVariant }>(
        `/api/admin/products/${productId}/variants`,
        { method: "POST", body: formData }
      );
      setVariants((prev) => [...prev, { ...variant, attributes: variantAxisAttributes.length > 0
        ? attributes.map((a) => ({
            attribute: { _id: a.attribute, name: variantAxisAttributes.find((v) => v._id === a.attribute)?.name ?? "" },
            value: a.value,
          }))
        : [] }]);
      setShowForm(false);
      setSelections({});
      setSku("");
      setStock("0");
      setPriceOverride("");
      setImage(null);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(variantId: string) {
    if (!window.confirm("Bu varyantı silmek istediğinize emin misiniz?")) return;
    setDeletingId(variantId);
    try {
      await clientFetch(`/api/admin/products/${productId}/variants/${variantId}`, { method: "DELETE" });
      setVariants((prev) => prev.filter((v) => v._id !== variantId));
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {variants.map((variant) => (
          <div key={variant._id} className="flex items-center gap-3 rounded-xl border border-border p-4">
            <div className="flex-1 font-body text-sm text-ink">
              <p className="font-semibold">{variantLabel(variant)}</p>
              <p className="text-ink-muted">
                SKU: {variant.sku || "-"} · Stok: {variant.stock}
                {variant.priceOverride ? ` · ${(variant.priceOverride / 100).toFixed(2)} TL` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(variant._id)}
              disabled={deletingId === variant._id}
              className="font-data text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-accent disabled:opacity-60"
            >
              Sil
            </button>
          </div>
        ))}
        {variants.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">Henüz varyant eklenmemiş.</p>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-4">
            {variantAxisAttributes.map((attribute) => (
              <label key={attribute._id} className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {attribute.name}
                </span>
                <select
                  value={selections[attribute._id] ?? ""}
                  onChange={(e) =>
                    setSelections((prev) => ({ ...prev, [attribute._id]: e.target.value }))
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
              </label>
            ))}
          </div>

          <FormField label="SKU (opsiyonel)" type="text" value={sku} onChange={(e) => setSku(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Stok"
              type="number"
              step="1"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
            <FormField
              label="Fiyat (TL, opsiyonel — boşsa ürün fiyatı kullanılır)"
              type="number"
              step="0.01"
              min="0"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Görsel (opsiyonel — boşsa ürünün görseli kullanılır)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="font-body text-sm text-ink"
            />
          </label>

          {error ? <p className="font-body text-sm text-danger">{error}</p> : null}
          <div className="flex gap-3">
            <AdminButton size="sm" type="submit" disabled={saving}>
              {saving ? "Kaydediliyor..." : "Varyant Ekle"}
            </AdminButton>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 font-data text-xs uppercase tracking-widest text-ink-muted"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <>
          {error ? <p className="mt-4 font-body text-sm text-danger">{error}</p> : null}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 font-data text-xs uppercase tracking-widest text-info hover:text-accent"
          >
            + Varyant Ekle
          </button>
        </>
      )}
    </div>
  );
}
