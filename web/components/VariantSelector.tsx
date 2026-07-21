"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductVariant } from "@/lib/types";

// Renders one row of selectable pills per variant-axis attribute (Renk,
// Depolama, ...) derived from the product's own variants — no hardcoded
// attribute names. Reports the fully-resolved variant (or null while the
// selection is incomplete/doesn't exist) up to the parent via onSelect.
export default function VariantSelector({
  variants,
  onSelect,
}: {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant | null) => void;
}) {
  const axisGroups = useMemo(() => {
    const groups = new Map<string, { name: string; values: string[] }>();
    for (const variant of variants) {
      for (const av of variant.attributes) {
        const key = av.attribute._id;
        const group = groups.get(key) ?? { name: av.attribute.name, values: [] };
        if (!group.values.includes(av.value)) group.values.push(av.value);
        groups.set(key, group);
      }
    }
    return [...groups.entries()].map(([id, group]) => ({ id, ...group }));
  }, [variants]);

  const [selections, setSelections] = useState<Record<string, string>>({});

  const selectionComplete = axisGroups.length > 0 && axisGroups.every((g) => selections[g.id]);

  const matchedVariant = useMemo(() => {
    if (!selectionComplete) return null;
    return (
      variants.find(
        (v) =>
          v.attributes.length === axisGroups.length &&
          v.attributes.every((av) => selections[av.attribute._id] === av.value)
      ) ?? null
    );
  }, [selectionComplete, selections, variants, axisGroups.length]);

  useEffect(() => {
    onSelect(matchedVariant);
  }, [matchedVariant, onSelect]);

  function isValueAvailable(attributeId: string, value: string) {
    return variants.some((v) => v.attributes.some((av) => av.attribute._id === attributeId && av.value === value));
  }

  return (
    <div className="flex flex-col gap-4">
      {axisGroups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{group.name}</p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const selected = selections[group.id] === value;
              const available = isValueAvailable(group.id, value);
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelections((prev) => ({ ...prev, [group.id]: value }))}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected ? "border-ink bg-ink text-bg" : "border-border text-ink hover:border-ink"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {selectionComplete && !matchedVariant ? (
        <p className="font-body text-sm text-danger">Bu kombinasyon mevcut değil.</p>
      ) : null}
    </div>
  );
}
