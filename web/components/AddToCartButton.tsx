"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";

export default function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setError(null);
    try {
      await clientFetch("/api/cart", { method: "POST", body: { productId } });
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
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="bg-accent px-6 py-3 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
      >
        {status === "done" ? "Sepete Eklendi" : "Sepete Ekle"}
      </button>
      {error ? <p className="mt-2 font-body text-sm text-accent">{error}</p> : null}
    </div>
  );
}
