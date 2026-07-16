import Link from "next/link";
import type { Category } from "@/lib/api";

export default function SiteHeader({ categories }: { categories: Category[] }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link
          href="/"
          className="font-display text-2xl font-black tracking-tight text-ink"
        >
          Tech<span className="text-accent">Store</span>
        </Link>

        {categories.length > 0 ? (
          <nav className="flex flex-wrap gap-5 font-body text-sm text-ink-muted">
            {categories.map((category) => (
              // Kategori sayfası henüz Next.js'e taşınmadı: gerçek (sert) bir
              // sayfa geçişiyle eski Pug sayfasına gidiyor, bkz. next.config.ts.
              <a
                key={category._id}
                href={`/categories/${category._id}`}
                className="transition-colors hover:text-accent"
              >
                {category.name}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
