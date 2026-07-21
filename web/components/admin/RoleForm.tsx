"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import AdminButton from "@/components/admin/AdminButton";
import type { Role } from "@/lib/types";

export default function RoleForm({ role }: { role?: Role }) {
  const router = useRouter();
  const [name, setName] = useState(role?.name ?? "");
  const [isAdminRole, setIsAdminRole] = useState(role?.isAdminRole ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (role) {
        await clientFetch(`/api/admin/roles/${role._id}`, {
          method: "PUT",
          body: { name, isAdminRole },
        });
      } else {
        await clientFetch(`/api/admin/roles`, {
          method: "POST",
          body: { name, isAdminRole },
        });
      }
      router.push("/admin/roles");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
  }

  const isProtected = role?.protected ?? false;

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField
        label="Rol Adı"
        type="text"
        required
        disabled={isProtected}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="flex items-center gap-2 font-body text-sm text-ink">
        <input
          type="checkbox"
          checked={isAdminRole}
          disabled={isProtected}
          onChange={(e) => setIsAdminRole(e.target.checked)}
        />
        Yönetici yetkisiyle eşdeğer (bu role atanan kullanıcılar admin paneline erişebilir)
      </label>

      {isProtected ? (
        <p className="font-body text-xs text-ink-muted">
          Bu sistem rolü düzenlenemez veya silinemez.
        </p>
      ) : null}

      {error ? <p className="font-body text-sm text-danger">{error}</p> : null}

      <AdminButton type="submit" disabled={loading || isProtected}>
        {loading ? "Kaydediliyor..." : role ? "Kaydet" : "Rol Ekle"}
      </AdminButton>
    </form>
  );
}
