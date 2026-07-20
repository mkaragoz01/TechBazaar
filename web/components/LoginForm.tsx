"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "./FormField";
import Button from "./Button";

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await clientFetch("/api/auth/login", { method: "POST", body: { email, password } });
      router.push(redirectTo || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
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
      <FormField
        label="Şifre"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        Giriş Yap
      </Button>
      <div className="flex justify-between font-body text-sm text-ink-muted">
        <Link href="/register" className="hover:text-accent">
          Hesabın yok mu? Kayıt ol
        </Link>
        <Link href="/reset-password" className="hover:text-accent">
          Şifremi unuttum
        </Link>
      </div>
    </form>
  );
}
