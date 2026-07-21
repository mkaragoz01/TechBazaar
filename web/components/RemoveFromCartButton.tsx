"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientFetch } from "@/lib/client-api";

export default function RemoveFromCartButton({
  productId,
  variantId,
}: {
  productId: string;
  variantId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await clientFetch("/api/cart/delete-item", {
      method: "POST",
      body: { productid: productId, variantId },
    });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title="Ürünü sil"
      className="font-data text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-accent disabled:opacity-60"
    >
      Sil
    </button>
  );
}
