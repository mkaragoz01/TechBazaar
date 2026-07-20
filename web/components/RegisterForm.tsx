"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "./FormField";
import Button from "./Button";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await clientFetch("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
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
        label="Ad Soyad"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        Kayıt Ol
      </Button>
      <Link href="/login" className="font-body text-sm text-ink-muted hover:text-accent">
        Zaten hesabın var mı? Giriş yap
      </Link>
    </form>
  );
}
