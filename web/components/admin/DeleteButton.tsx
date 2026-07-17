"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/client-api";

export default function DeleteButton({
  url,
  confirmMessage,
}: {
  url: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    await clientFetch(url, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="font-data text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-accent disabled:opacity-60"
    >
      Sil
    </button>
  );
}
