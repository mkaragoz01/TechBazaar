import type { CategoryAttribute } from "@/lib/types";

// A plain server-rendered <form> — no client JS re-filtering. Checkboxes
// sharing the name `attr[<attributeId>]` submit as a native GET array
// (`attr[id]=v1&attr[id]=v2`), which Express's query parser turns back
// into `req.query.attr[id] = ["v1","v2"]` — exactly the shape
// controllers/shop.js's getProducts expects. Only rendered when a specific
// category context is known (category page, or /products?category=...) —
// otherwise there's no single unambiguous attribute set to show.
export default function FilterPanel({
  basePath,
  attributes,
  selectedAttributes,
  otherParams,
}: {
  basePath: string;
  attributes: CategoryAttribute[];
  selectedAttributes: Record<string, string | string[]>;
  otherParams: Record<string, string | undefined>;
}) {
  if (attributes.length === 0) {
    return null;
  }

  function isChecked(attributeId: string, option: string) {
    const selected = selectedAttributes[attributeId];
    if (!selected) return false;
    return Array.isArray(selected) ? selected.includes(option) : selected === option;
  }

  return (
    <form
      method="GET"
      action={basePath}
      className="flex w-full flex-col gap-6 rounded-3xl bg-surface p-5 shadow-sm sm:w-56 sm:shrink-0"
    >
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Özellikler</h2>

      {Object.entries(otherParams).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null
      )}

      {attributes.map((attribute) => (
        <fieldset key={attribute._id} className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {attribute.name}
            {attribute.unit ? ` (${attribute.unit})` : ""}
          </legend>
          {attribute.options.map((option) => (
            <label key={option} className="flex items-center gap-2 font-body text-sm text-ink">
              <input
                type="checkbox"
                name={`attr[${attribute._id}]`}
                value={option}
                defaultChecked={isChecked(attribute._id, option)}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ))}

      <button
        type="submit"
        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Filtrele
      </button>
    </form>
  );
}
