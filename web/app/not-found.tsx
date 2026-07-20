import Button from "@/components/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="text-xs font-bold uppercase tracking-wide text-accent">404</span>
      <h1 className="mt-2 font-display text-4xl font-bold text-ink">Sayfa bulunamadı</h1>
      <p className="mt-3 font-body text-ink-muted">
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>
      <Button href="/" className="mt-6">
        Ana Sayfaya Dön
      </Button>
    </main>
  );
}
