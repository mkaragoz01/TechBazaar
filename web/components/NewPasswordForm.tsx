"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "./FormField";

export default function NewPasswordForm({
  userId,
  passwordToken,
}: {
  userId: string;
  passwordToken: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await clientFetch("/api/auth/new-password", {
        method: "POST",
        body: { userId, passwordToken, password },
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        label="Yeni Şifre"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        Şifreyi Güncelle
      </button>
    </form>
  );
}
