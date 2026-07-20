"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import type { Campaign, CampaignCondition, Category, Brand } from "@/lib/types";

type ConditionType = "product" | "user" | "cartTotal";

// UI-only shape — kept flat and string-based for form inputs, converted
// to/from the API's CampaignCondition on load/submit.
type ConditionRow = {
  type: ConditionType;
  field: "sku" | "category" | "brand";
  operator: "gte" | "lte";
  textValues: string; // comma-separated: SKUs or user ids/emails
  selectedIds: string[]; // for field: category/brand
  amountTl: string; // for cartTotal
};

function emptyRow(): ConditionRow {
  return { type: "product", field: "sku", operator: "gte", textValues: "", selectedIds: [], amountTl: "" };
}

function conditionToRow(condition: CampaignCondition): ConditionRow {
  if (condition.type === "product") {
    const field = condition.field ?? "sku";
    return {
      type: "product",
      field,
      operator: "gte",
      textValues: field === "sku" ? (condition.values ?? []).join(", ") : "",
      selectedIds: field !== "sku" ? condition.values ?? [] : [],
      amountTl: "",
    };
  }
  if (condition.type === "user") {
    return { type: "user", field: "sku", operator: "gte", textValues: (condition.values ?? []).join(", "), selectedIds: [], amountTl: "" };
  }
  return {
    type: "cartTotal",
    field: "sku",
    operator: condition.operator === "lte" ? "lte" : "gte",
    textValues: "",
    selectedIds: [],
    amountTl: condition.value !== undefined ? (condition.value / 100).toFixed(2) : "",
  };
}

function rowToCondition(row: ConditionRow): CampaignCondition {
  if (row.type === "product") {
    if (row.field === "sku") {
      return {
        type: "product",
        field: "sku",
        operator: "in",
        values: row.textValues.split(",").map((v) => v.trim()).filter(Boolean),
      };
    }
    return { type: "product", field: row.field, operator: "in", values: row.selectedIds };
  }
  if (row.type === "user") {
    return {
      type: "user",
      operator: "in",
      values: row.textValues.split(",").map((v) => v.trim()).filter(Boolean),
    };
  }
  return {
    type: "cartTotal",
    operator: row.operator,
    value: Math.round(parseFloat(row.amountTl || "0") * 100),
  };
}

export default function CampaignForm({
  campaign,
  categories,
  brands,
}: {
  campaign?: Campaign;
  categories: Category[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [code, setCode] = useState(campaign?.code ?? "");
  const [discountType, setDiscountType] = useState(campaign?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState(
    campaign ? String(campaign.discountValue) : "10"
  );
  const [appliesTo, setAppliesTo] = useState(campaign?.appliesTo ?? "cartTotal");
  const [startDate, setStartDate] = useState(campaign?.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(campaign?.endDate?.slice(0, 10) ?? "");
  const [isActive, setIsActive] = useState(campaign?.isActive ?? true);
  const [conditions, setConditions] = useState<ConditionRow[]>(
    campaign && campaign.conditions.length > 0 ? campaign.conditions.map(conditionToRow) : [emptyRow()]
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateCondition(index: number, patch: Partial<ConditionRow>) {
    setConditions((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function toggleConditionCategory(index: number, id: string) {
    setConditions((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              selectedIds: row.selectedIds.includes(id)
                ? row.selectedIds.filter((c) => c !== id)
                : [...row.selectedIds, id],
            }
          : row
      )
    );
  }

  function addCondition() {
    setConditions((prev) => [...prev, emptyRow()]);
  }

  function removeCondition(index: number) {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (conditions.length === 0) {
      setError("Lütfen en az bir koşul ekleyin.");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      return;
    }

    setLoading(true);

    const body = {
      name,
      description,
      code: code.trim() || undefined,
      conditions: conditions.map(rowToCondition),
      discountType,
      discountValue: Number(discountValue),
      appliesTo,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isActive,
    };

    try {
      if (campaign) {
        await clientFetch(`/api/admin/campaigns/${campaign._id}`, { method: "PUT", body });
      } else {
        await clientFetch(`/api/admin/campaigns`, { method: "POST", body });
      }
      router.push("/admin/campaigns");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <FormField label="Kampanya Adı" type="text" required value={name} onChange={(e) => setName(e.target.value)} />

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Açıklama (opsiyonel, ana sayfa banner&apos;ında gösterilebilir)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-xl border border-border bg-surface px-4 py-3 font-body text-ink"
        />
      </label>

      <FormField
        label="Kampanya Kodu (opsiyonel — boşsa otomatik uygulanır)"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="örn. YAZ2026"
      />

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Koşullar (hepsi sağlanmalı)
        </legend>

        {conditions.map((row, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <select
                value={row.type}
                onChange={(e) => updateCondition(index, { type: e.target.value as ConditionType })}
                className="rounded-xl border border-border bg-surface px-3 py-2 font-body text-sm text-ink"
              >
                <option value="product">Ürün eşleşmesi</option>
                <option value="user">Belirli kullanıcı(lar)</option>
                <option value="cartTotal">Sepet toplamı</option>
              </select>
              {conditions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="font-data text-xs uppercase tracking-widest text-accent"
                >
                  Kaldır
                </button>
              ) : null}
            </div>

            {row.type === "product" ? (
              <>
                <select
                  value={row.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value as ConditionRow["field"] })}
                  className="rounded-xl border border-border bg-surface px-3 py-2 font-body text-sm text-ink"
                >
                  <option value="sku">SKU</option>
                  <option value="category">Kategori</option>
                  <option value="brand">Marka</option>
                </select>
                {row.field === "sku" ? (
                  <input
                    type="text"
                    placeholder="SKU-1, SKU-2, ..."
                    value={row.textValues}
                    onChange={(e) => updateCondition(index, { textValues: e.target.value })}
                    className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
                  />
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(row.field === "category" ? categories : brands).map((option) => (
                      <label key={option._id} className="flex items-center gap-1.5 font-body text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={row.selectedIds.includes(option._id)}
                          onChange={() => toggleConditionCategory(index, option._id)}
                        />
                        {option.name}
                      </label>
                    ))}
                  </div>
                )}
              </>
            ) : null}

            {row.type === "user" ? (
              <input
                type="text"
                placeholder="kullanici@example.com, ..."
                value={row.textValues}
                onChange={(e) => updateCondition(index, { textValues: e.target.value })}
                className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
              />
            ) : null}

            {row.type === "cartTotal" ? (
              <div className="flex gap-3">
                <select
                  value={row.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value as "gte" | "lte" })}
                  className="rounded-xl border border-border bg-surface px-3 py-2 font-body text-sm text-ink"
                >
                  <option value="gte">en az</option>
                  <option value="lte">en fazla</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Tutar (TL)"
                  value={row.amountTl}
                  onChange={(e) => updateCondition(index, { amountTl: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
                />
              </div>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          onClick={addCondition}
          className="w-fit font-data text-xs uppercase tracking-widest text-info hover:text-accent"
        >
          + Koşul Ekle
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Etki</legend>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">İndirim Türü</span>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
              className="rounded-xl border border-border bg-surface px-4 py-3 font-body text-ink"
            >
              <option value="percentage">Yüzde (%)</option>
              <option value="fixed">Sabit Tutar (TL)</option>
            </select>
          </label>
          <FormField
            label={discountType === "percentage" ? "İndirim (%)" : "İndirim (TL)"}
            type="number"
            step="0.01"
            min="0"
            required
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Uygulama Şekli</span>
          <select
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value as "matchingItems" | "cartTotal")}
            className="rounded-xl border border-border bg-surface px-4 py-3 font-body text-ink"
          >
            <option value="cartTotal">Sepet toplamına</option>
            <option value="matchingItems">Sadece koşulu tetikleyen ürünlere</option>
          </select>
        </label>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Başlangıç (opsiyonel)"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <FormField label="Bitiş (opsiyonel)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-ink">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Aktif
      </label>

      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="bg-accent px-6 py-3 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
      >
        {campaign ? "Kaydet" : "Kampanya Ekle"}
      </button>
    </form>
  );
}
