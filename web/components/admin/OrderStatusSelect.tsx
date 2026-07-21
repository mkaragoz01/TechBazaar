"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Beklemede",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus;
    const previous = value;
    setValue(next);
    setLoading(true);
    setError(null);

    try {
      await clientFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: { status: next },
      });
      router.refresh();
    } catch (err) {
      setValue(previous);
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        disabled={loading}
        onChange={handleChange}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 font-data text-xs uppercase tracking-widest text-info focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info disabled:opacity-60"
      >
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error ? <p className="font-body text-xs text-danger">{error}</p> : null}
    </div>
  );
}
