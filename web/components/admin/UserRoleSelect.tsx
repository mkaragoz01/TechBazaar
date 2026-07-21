"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import type { Role } from "@/lib/types";

export default function UserRoleSelect({
  userId,
  role,
  roles,
  isSelf,
}: {
  userId: string;
  role: string;
  roles: Role[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcının kendi hesabı üzerinde işlem yapamaması kuralı burada da
  // görünür olsun diye — sunucu zaten 400 ile reddediyor, ama seçilemez bir
  // alan göstermek "neden değişmiyor" sorusunu baştan önlüyor.
  if (isSelf) {
    return <span className="font-data text-xs uppercase tracking-widest text-ink-muted">{role} (siz)</span>;
  }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const previous = value;
    setValue(next);
    setLoading(true);
    setError(null);

    try {
      await clientFetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        body: { role: next },
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
        {roles.map((r) => (
          <option key={r._id} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>
      {error ? <p className="font-body text-xs text-danger">{error}</p> : null}
    </div>
  );
}
