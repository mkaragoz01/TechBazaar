import type { Brand } from "@/lib/types";

export default function ProductFilters({
  basePath,
  brands,
  selectedSort,
  selectedBrand,
  selectedMinPrice,
  selectedMaxPrice,
  selectedQuery,
  selectedAttributes,
}: {
  basePath: string;
  brands: Brand[];
  selectedSort?: string | null;
  selectedBrand?: string | null;
  selectedMinPrice?: string;
  selectedMaxPrice?: string;
  selectedQuery?: string;
  // Carried forward as hidden fields so submitting this form doesn't drop
  // FilterPanel's checkbox selections (they're two separate <form>s).
  selectedAttributes?: Record<string, string | string[]>;
}) {
  return (
    <form
      method="GET"
      action={basePath}
      className="mb-8 flex flex-wrap items-end gap-4 rounded-3xl bg-surface p-5 shadow-sm"
    >
      {selectedSort ? <input type="hidden" name="sort" value={selectedSort} /> : null}
      {Object.entries(selectedAttributes ?? {}).flatMap(([attributeId, value]) =>
        (Array.isArray(value) ? value : [value]).map((v, i) => (
          <input key={`${attributeId}-${i}`} type="hidden" name={`attr[${attributeId}]`} value={v} />
        ))
      )}

      <label className="flex flex-1 flex-col gap-1" style={{ minWidth: "160px" }}>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Ara
        </span>
        <input
          type="text"
          name="q"
          defaultValue={selectedQuery}
          placeholder="Ürün ara..."
          className="rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink"
        />
      </label>

      {brands.length > 0 ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Marka
          </span>
          <select
            name="brand"
            defaultValue={selectedBrand ?? ""}
            className="rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink"
          >
            <option value="">Tümü</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Min. Fiyat (TL)
        </span>
        <input
          type="number"
          name="minPrice"
          defaultValue={selectedMinPrice}
          min="0"
          className="w-28 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Maks. Fiyat (TL)
        </span>
        <input
          type="number"
          name="maxPrice"
          defaultValue={selectedMaxPrice}
          min="0"
          className="w-28 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink"
        />
      </label>

      <button
        type="submit"
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Filtrele
      </button>
    </form>
  );
}
