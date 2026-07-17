import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="font-data text-xs uppercase tracking-widest text-accent">404</span>
      <h1 className="mt-2 font-display text-4xl font-black text-ink">Sayfa bulunamadı</h1>
      <p className="mt-3 font-body text-ink-muted">
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>
      <Link
        href="/"
        className="mt-6 bg-accent px-6 py-3 font-data text-xs uppercase tracking-widest text-accent-ink"
      >
        Ana Sayfaya Dön
      </Link>
    </main>
  );
}
