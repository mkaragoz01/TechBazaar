"use client";

import { useState, type FormEvent } from "react";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import AdminButton from "@/components/admin/AdminButton";
import DeleteButton from "@/components/admin/DeleteButton";
import type { CategoryAttribute } from "@/lib/types";

export default function CategoryAttributeManager({
  categoryId,
  initialAttributes,
}: {
  categoryId: string;
  initialAttributes: CategoryAttribute[];
}) {
  const [attributes, setAttributes] = useState(initialAttributes);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [valueType, setValueType] = useState<"select" | "text">("select");
  const [options, setOptions] = useState("");
  const [unit, setUnit] = useState("");
  const [isVariantAxis, setIsVariantAxis] = useState(false);
  const [isFilterable, setIsFilterable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { attribute } = await clientFetch<{ attribute: CategoryAttribute }>("/api/admin/category-attributes", {
        method: "POST",
        body: { category: categoryId, name, valueType, options, unit, isVariantAxis, isFilterable },
      });
      setAttributes((prev) => [...prev, attribute]);
      setShowForm(false);
      setName("");
      setOptions("");
      setUnit("");
      setValueType("select");
      setIsVariantAxis(false);
      setIsFilterable(true);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {attributes.map((attribute) => (
          <div key={attribute._id} className="flex items-start gap-3 rounded-xl border border-border p-4">
            <div className="flex-1 font-body text-sm text-ink">
              <p className="font-semibold">
                {attribute.name}
                {attribute.unit ? ` (${attribute.unit})` : ""}
              </p>
              <p className="text-ink-muted">
                {attribute.valueType === "select" ? attribute.options.join(", ") : "Serbest metin"}
              </p>
              <div className="mt-1 flex gap-2 font-data text-[11px] uppercase tracking-widest">
                {attribute.isVariantAxis ? (
                  <span className="bg-accent/15 px-2 py-0.5 text-accent">Varyant Ekseni</span>
                ) : null}
                {attribute.isFilterable ? (
                  <span className="bg-info/15 px-2 py-0.5 text-info">Filtrelenebilir</span>
                ) : null}
              </div>
            </div>
            <DeleteButton
              url={`/api/admin/category-attributes/${attribute._id}`}
              confirmMessage="Bu özelliği silmek istediğinize emin misiniz?"
              itemLabel={attribute.name}
            />
          </div>
        ))}
        {attributes.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">Bu kategoriye henüz özellik eklenmemiş.</p>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <FormField label="Özellik Adı" type="text" required value={name} onChange={(e) => setName(e.target.value)} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Tip</span>
            <select
              value={valueType}
              onChange={(e) => setValueType(e.target.value as "select" | "text")}
              className="rounded-xl border border-border bg-surface px-4 py-3 font-body text-ink"
            >
              <option value="select">Seçmeli (sabit seçenek listesi)</option>
              <option value="text">Serbest metin</option>
            </select>
          </label>

          {valueType === "select" ? (
            <>
              <FormField
                label="Seçenekler (virgülle ayrılmış)"
                type="text"
                placeholder="4GB, 8GB, 16GB"
                required
                value={options}
                onChange={(e) => setOptions(e.target.value)}
              />
              <FormField
                label="Birim (opsiyonel, örn. GB)"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
              <label className="flex items-center gap-2 font-body text-sm text-ink">
                <input type="checkbox" checked={isFilterable} onChange={(e) => setIsFilterable(e.target.checked)} />
                Storefront&apos;ta filtre olarak gösterilsin
              </label>
              <label className="flex items-center gap-2 font-body text-sm text-ink">
                <input type="checkbox" checked={isVariantAxis} onChange={(e) => setIsVariantAxis(e.target.checked)} />
                Varyant ekseni (örn. Renk, Depolama — ayrı stok/SKU&apos;ya sahip seçenekler)
              </label>
            </>
          ) : (
            <p className="font-body text-xs text-ink-muted">
              Serbest metin özellikler filtrelenemez ve varyant ekseni olamaz — sadece ürün bilgisi olarak gösterilir.
            </p>
          )}

          {error ? <p className="font-body text-sm text-danger">{error}</p> : null}
          <div className="flex gap-3">
            <AdminButton size="sm" type="submit" disabled={saving}>
              {saving ? "Kaydediliyor..." : "Özelliği Ekle"}
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
            + Yeni Özellik Ekle
          </button>
        </>
      )}
    </div>
  );
}
