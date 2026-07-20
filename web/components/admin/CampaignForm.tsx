"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import AdminButton from "@/components/admin/AdminButton";
import type { Campaign, CampaignCondition, CampaignConditionGroup, Category, Brand } from "@/lib/types";

type ConditionType = "product" | "productName" | "user" | "cartTotal";

// UI-only shape — kept flat and string-based for form inputs, converted
// to/from the API's CampaignCondition on load/submit.
type ConditionRow = {
  type: ConditionType;
  field: "sku" | "category" | "brand";
  operator: "gte" | "lte";
  textValues: string; // comma-separated: SKUs or user ids/emails
  selectedIds: string[]; // for field: category/brand
  amountTl: string; // for cartTotal
  nameText: string; // for productName
};

function emptyRow(): ConditionRow {
  return {
    type: "product",
    field: "sku",
    operator: "gte",
    textValues: "",
    selectedIds: [],
    amountTl: "",
    nameText: "",
  };
}

function conditionToRow(condition: CampaignCondition): ConditionRow {
  if (condition.type === "product") {
    const field = condition.field ?? "sku";
    return {
      ...emptyRow(),
      type: "product",
      field,
      textValues: field === "sku" ? (condition.values ?? []).join(", ") : "",
      selectedIds: field !== "sku" ? condition.values ?? [] : [],
    };
  }
  if (condition.type === "productName") {
    return { ...emptyRow(), type: "productName", nameText: condition.text ?? "" };
  }
  if (condition.type === "user") {
    return { ...emptyRow(), type: "user", textValues: (condition.values ?? []).join(", ") };
  }
  return {
    ...emptyRow(),
    type: "cartTotal",
    operator: condition.operator === "lte" ? "lte" : "gte",
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
  if (row.type === "productName") {
    return { type: "productName", operator: "contains", text: row.nameText.trim() };
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

// A campaign saved before the OR-of-groups pass may still carry the old flat
// `conditions` field instead of `conditionGroups` — treat that as a single
// group so editing an old campaign still shows its conditions correctly.
function initialGroups(campaign?: Campaign): ConditionRow[][] {
  if (campaign?.conditionGroups && campaign.conditionGroups.length > 0) {
    return campaign.conditionGroups.map((group) =>
      group.conditions.length > 0 ? group.conditions.map(conditionToRow) : [emptyRow()]
    );
  }
  if (campaign?.conditions && campaign.conditions.length > 0) {
    return [campaign.conditions.map(conditionToRow)];
  }
  return [[emptyRow()]];
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
  const [groups, setGroups] = useState<ConditionRow[][]>(initialGroups(campaign));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateCondition(groupIndex: number, rowIndex: number, patch: Partial<ConditionRow>) {
    setGroups((prev) =>
      prev.map((group, g) =>
        g === groupIndex
          ? group.map((row, i) => (i === rowIndex ? { ...row, ...patch } : row))
          : group
      )
    );
  }

  function toggleConditionCategory(groupIndex: number, rowIndex: number, id: string) {
    setGroups((prev) =>
      prev.map((group, g) =>
        g === groupIndex
          ? group.map((row, i) =>
              i === rowIndex
                ? {
                    ...row,
                    selectedIds: row.selectedIds.includes(id)
                      ? row.selectedIds.filter((c) => c !== id)
                      : [...row.selectedIds, id],
                  }
                : row
            )
          : group
      )
    );
  }

  function addCondition(groupIndex: number) {
    setGroups((prev) => prev.map((group, g) => (g === groupIndex ? [...group, emptyRow()] : group)));
  }

  function removeCondition(groupIndex: number, rowIndex: number) {
    setGroups((prev) =>
      prev.map((group, g) => (g === groupIndex ? group.filter((_, i) => i !== rowIndex) : group))
    );
  }

  function addGroup() {
    setGroups((prev) => [...prev, [emptyRow()]]);
  }

  function removeGroup(groupIndex: number) {
    setGroups((prev) => prev.filter((_, g) => g !== groupIndex));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (startDate && endDate && endDate < startDate) {
      setError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      return;
    }

    setLoading(true);

    const conditionGroups: CampaignConditionGroup[] = groups.map((rows) => ({
      conditions: rows.map(rowToCondition),
    }));

    const body = {
      name,
      description,
      code: code.trim() || undefined,
      conditionGroups,
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

      <div className="flex flex-col gap-3">
        <span className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Koşul Grupları (gruplardan biri sağlanırsa yeterli — VEYA)
        </span>

        {groups.map((rows, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 ? (
              <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-data text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  VEYA
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            ) : null}

            <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Grup {groupIndex + 1} (içindeki koşulların hepsi sağlanmalı — VE)
              </legend>

              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-col gap-3 rounded-xl bg-surface-2 p-4">
                  <div className="flex items-center justify-between">
                    <select
                      value={row.type}
                      onChange={(e) =>
                        updateCondition(groupIndex, rowIndex, { type: e.target.value as ConditionType })
                      }
                      className="rounded-xl border border-border bg-surface px-3 py-2 font-body text-sm text-ink"
                    >
                      <option value="product">Ürün eşleşmesi</option>
                      <option value="productName">Ürün adı eşleşmesi</option>
                      <option value="user">Belirli kullanıcı(lar)</option>
                      <option value="cartTotal">Sepet toplamı</option>
                    </select>
                    {rows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeCondition(groupIndex, rowIndex)}
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
                        onChange={(e) =>
                          updateCondition(groupIndex, rowIndex, {
                            field: e.target.value as ConditionRow["field"],
                          })
                        }
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
                          onChange={(e) =>
                            updateCondition(groupIndex, rowIndex, { textValues: e.target.value })
                          }
                          className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {(row.field === "category" ? categories : brands).map((option) => (
                            <label
                              key={option._id}
                              className="flex items-center gap-1.5 font-body text-sm text-ink"
                            >
                              <input
                                type="checkbox"
                                checked={row.selectedIds.includes(option._id)}
                                onChange={() => toggleConditionCategory(groupIndex, rowIndex, option._id)}
                              />
                              {option.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}

                  {row.type === "productName" ? (
                    <input
                      type="text"
                      placeholder="örn. Pro"
                      value={row.nameText}
                      onChange={(e) => updateCondition(groupIndex, rowIndex, { nameText: e.target.value })}
                      className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
                    />
                  ) : null}

                  {row.type === "user" ? (
                    <input
                      type="text"
                      placeholder="kullanici@example.com, ..."
                      value={row.textValues}
                      onChange={(e) =>
                        updateCondition(groupIndex, rowIndex, { textValues: e.target.value })
                      }
                      className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
                    />
                  ) : null}

                  {row.type === "cartTotal" ? (
                    <div className="flex gap-3">
                      <select
                        value={row.operator}
                        onChange={(e) =>
                          updateCondition(groupIndex, rowIndex, {
                            operator: e.target.value as "gte" | "lte",
                          })
                        }
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
                        onChange={(e) =>
                          updateCondition(groupIndex, rowIndex, { amountTl: e.target.value })
                        }
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
                      />
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addCondition(groupIndex)}
                  className="w-fit font-data text-xs uppercase tracking-widest text-info hover:text-accent"
                >
                  + Koşul Ekle
                </button>
                {groups.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeGroup(groupIndex)}
                    className="font-data text-xs uppercase tracking-widest text-accent"
                  >
                    Grubu Kaldır
                  </button>
                ) : null}
              </div>
            </fieldset>
          </div>
        ))}

        <button
          type="button"
          onClick={addGroup}
          className="w-fit font-data text-xs uppercase tracking-widest text-info hover:text-accent"
        >
          + Grup Ekle (VEYA)
        </button>
      </div>

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

      <AdminButton type="submit" disabled={loading}>
        {campaign ? "Kaydet" : "Kampanya Ekle"}
      </AdminButton>
    </form>
  );
}
