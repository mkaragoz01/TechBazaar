"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Category } from "@/lib/types";

export default function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (category) {
        await clientFetch(`/api/admin/categories/${category._id}`, {
          method: "PUT",
          body: { name, description },
        });
      } else {
        await clientFetch(`/api/admin/categories`, {
          method: "POST",
          body: { name, description },
        });
      }
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField
        label="Kategori Adı"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Açıklama
        </span>
        <RichTextEditor value={description} onChange={setDescription} />
      </label>

      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="bg-accent px-6 py-3 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
      >
        {category ? "Kaydet" : "Kategori Ekle"}
      </button>
    </form>
  );
}
