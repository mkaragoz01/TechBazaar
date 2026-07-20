"use client";

import { useEffect } from "react";
import AdminButton from "@/components/admin/AdminButton";

export default function AdminError({
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
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <span className="font-data text-xs font-semibold uppercase tracking-widest text-accent">
        Hata
      </span>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Bir şeyler ters gitti</h1>
      <p className="mt-2 max-w-md font-body text-sm text-ink-muted">
        Bu sayfa yüklenirken beklenmedik bir hata oluştu.
      </p>
      <div className="mt-5 flex gap-3">
        <AdminButton size="sm" onClick={() => unstable_retry()}>
          Tekrar Dene
        </AdminButton>
        <AdminButton size="sm" variant="secondary" href="/admin">
          Panele Dön
        </AdminButton>
      </div>
    </div>
  );
}
