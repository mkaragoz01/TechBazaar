"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";

export default function CartQuantityStepper({
  productId,
  quantity,
  stock,
}: {
  productId: string;
  quantity: number;
  stock?: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(quantity);
  const [inputValue, setInputValue] = useState(String(quantity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 0 is a valid target — it removes the line (same as the "Sil" link),
  // matching the standard "decrement to zero removes the item" cart pattern.
  async function updateQuantity(next: number) {
    if (!Number.isInteger(next) || next < 0 || next === value) {
      setInputValue(String(value));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await clientFetch("/api/cart/item", {
        method: "PUT",
        body: { productId, quantity: next },
      });
      setValue(next);
      setInputValue(String(next));
      router.refresh();
    } catch (err) {
      setInputValue(String(value));
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const atMax = stock !== undefined && value >= stock;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => updateQuantity(value - 1)}
          disabled={loading}
          aria-label={value <= 1 ? "Ürünü kaldır" : "Adeti azalt"}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border font-semibold text-ink transition-colors hover:border-ink disabled:opacity-40"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={stock}
          value={inputValue}
          disabled={loading}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => updateQuantity(parseInt(inputValue, 10))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label="Adet"
          className="w-12 rounded-lg border border-border bg-surface px-1 py-1 text-center font-data text-sm tabular-nums text-ink"
        />
        <button
          type="button"
          onClick={() => updateQuantity(value + 1)}
          disabled={loading || atMax}
          aria-label="Adeti artır"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border font-semibold text-ink transition-colors hover:border-ink disabled:opacity-40"
        >
          +
        </button>
      </div>
      {error ? <p className="font-body text-xs text-danger">{error}</p> : null}
      {atMax ? <p className="font-body text-xs text-ink-muted">Stokta {stock} adet var</p> : null}
    </div>
  );
}
