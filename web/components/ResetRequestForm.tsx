"use client";

import { useState, type FormEvent } from "react";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "./FormField";
import Button from "./Button";

export default function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await clientFetch("/api/auth/reset-password", { method: "POST", body: { email } });
      setDone(true);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="font-body text-ink-muted">
        Parolanızı sıfırlamak için e-posta adresinize bir bağlantı gönderdik.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        label="E-posta"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        Sıfırlama Bağlantısı Gönder
      </Button>
    </form>
  );
}
