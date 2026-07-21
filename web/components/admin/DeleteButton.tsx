"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";

export default function DeleteButton({
  url,
  confirmMessage,
  itemLabel,
  label = "Sil",
  pendingLabel = "Siliniyor...",
}: {
  url: string;
  confirmMessage: string;
  itemLabel?: string;
  label?: string;
  pendingLabel?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    setError(null);
    try {
      await clientFetch(url, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label={itemLabel ? `${itemLabel} — ${label}` : undefined}
        className="-mx-2 -my-1 rounded-md px-2 py-1 font-data text-xs uppercase tracking-widest text-danger transition-colors hover:bg-danger/10 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
      >
        {loading ? pendingLabel : label}
      </button>
      {error ? <p className="max-w-[16rem] text-right font-body text-xs text-danger">{error}</p> : null}
    </div>
  );
}
