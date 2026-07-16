"use client";

import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/client-api";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await clientFetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="font-body text-sm text-ink-muted transition-colors hover:text-accent"
    >
      Çıkış Yap
    </button>
  );
}
