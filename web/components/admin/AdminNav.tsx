import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function AdminNav({ userName }: { userName: string }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-data text-sm font-semibold uppercase tracking-widest text-ink">
            TechStore <span className="text-accent">Yönetim</span>
          </Link>
          <nav className="flex gap-4 font-body text-sm text-ink-muted">
            <Link href="/admin" className="transition-colors hover:text-accent">
              Panel
            </Link>
            <Link href="/admin/products" className="transition-colors hover:text-accent">
              Ürünler
            </Link>
            <Link href="/admin/categories" className="transition-colors hover:text-accent">
              Kategoriler
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 font-body text-sm">
          <Link href="/" className="text-ink-muted transition-colors hover:text-accent">
            Mağazaya Dön
          </Link>
          <span className="text-ink-muted">{userName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
