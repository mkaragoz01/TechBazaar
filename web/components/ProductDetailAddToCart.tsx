"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import Button from "./Button";

export default function ProductDetailAddToCart({
  productId,
  variantId,
  stock,
}: {
  productId: string;
  variantId?: string;
  stock?: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const outOfStock = (stock ?? 0) <= 0;

  if (outOfStock) {
    return (
      <button type="button" disabled className="rounded-full bg-border px-7 py-3.5 font-semibold text-ink-muted">
        Stokta Yok
      </button>
    );
  }

  async function handleClick() {
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      setError("Geçerli bir adet giriniz.");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      await clientFetch("/api/cart", { method: "POST", body: { productId, variantId, quantity: qty } });
      setStatus("done");
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 401) {
        router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      setStatus("idle");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={stock}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          aria-label="Adet"
          className="w-20 rounded-full border border-border bg-surface px-4 py-3.5 text-center font-data text-sm tabular-nums text-ink"
        />
        <Button onClick={handleClick} disabled={status === "loading"}>
          {status === "done" ? "Sepete Eklendi" : "Sepete Ekle"}
        </Button>
      </div>
      {error ? <p className="mt-2 font-body text-sm text-danger">{error}</p> : null}
    </div>
  );
}
