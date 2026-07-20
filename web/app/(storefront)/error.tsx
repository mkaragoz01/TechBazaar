"use client";

import { useEffect } from "react";
import Button from "@/components/Button";

export default function StorefrontError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="text-xs font-bold uppercase tracking-wide text-accent">Hata</span>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Bir şeyler ters gitti</h1>
      <p className="mt-3 font-body text-ink-muted">
        Bu sayfayı yüklerken beklenmedik bir hata oluştu. Tekrar deneyebilir veya ana sayfaya
        dönebilirsiniz.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => unstable_retry()}>Tekrar Dene</Button>
        <Button href="/" variant="secondary">
          Ana Sayfaya Dön
        </Button>
      </div>
    </main>
  );
}
