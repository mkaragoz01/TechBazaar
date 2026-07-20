"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import type { CartDiscount } from "@/lib/types";

export default function CampaignCodeForm({ discount }: { discount: CartDiscount | null }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await clientFetch("/api/cart/apply-code", { method: "POST", body: { code } });
      setCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      await clientFetch("/api/cart/remove-code", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (discount?.code) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-success/10 px-4 py-3 font-body text-sm text-success">
        <span>Kampanya kodu uygulandı: {discount.code}</span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="font-data text-xs uppercase tracking-widest text-accent disabled:opacity-60"
        >
          Kaldır
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleApply} className="flex gap-2">
        <input
          type="text"
          placeholder="Kampanya kodu"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-ink px-4 py-2 font-data text-xs uppercase tracking-widest text-bg disabled:opacity-60"
        >
          Uygula
        </button>
      </form>
      {error ? <p className="font-body text-xs text-accent">{error}</p> : null}
    </div>
  );
}
