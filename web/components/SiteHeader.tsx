import Link from "next/link";
import type { Category, CurrentUser } from "@/lib/types";
import LogoutButton from "./LogoutButton";

export default function SiteHeader({
  categories,
  currentUser,
}: {
  categories: Category[];
  currentUser: CurrentUser | null;
}) {
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
              <Link
                key={category._id}
                href={`/categories/${category._id}`}
                className="transition-colors hover:text-accent"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        ) : null}

        <nav className="flex flex-wrap items-center gap-5 font-body text-sm">
          <Link href="/cart" className="text-ink-muted transition-colors hover:text-accent">
            Sepet
          </Link>
          {currentUser ? (
            <>
              <Link href="/orders" className="text-ink-muted transition-colors hover:text-accent">
                Siparişlerim
              </Link>
              {currentUser.isAdmin ? (
                <Link href="/admin" className="text-ink-muted transition-colors hover:text-accent">
                  Admin
                </Link>
              ) : null}
              <span className="text-ink-muted">Merhaba, {currentUser.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink-muted transition-colors hover:text-accent">
                Giriş Yap
              </Link>
              <Link href="/register" className="text-accent">
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
