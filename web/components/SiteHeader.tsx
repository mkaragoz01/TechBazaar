import Link from "next/link";
import type { Category, CurrentUser } from "@/lib/types";
import LogoutButton from "./LogoutButton";
import HeaderSearch from "./HeaderSearch";

export default function SiteHeader({
  categories,
  currentUser,
}: {
  categories: Category[];
  currentUser: CurrentUser | null;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
        <Link
          href="/"
          className="shrink-0 font-display text-xl font-bold tracking-tight text-ink"
        >
          Tech<span className="text-accent">Store</span>
        </Link>

        <div className="order-3 w-full sm:order-none sm:w-auto sm:max-w-xs sm:flex-1">
          <HeaderSearch />
        </div>

        <nav className="flex flex-wrap items-center gap-5 font-body text-sm">
          {currentUser ? (
            <>
              <Link href="/orders" className="text-ink-muted transition-colors hover:text-ink">
                Siparişlerim
              </Link>
              <Link href="/account" className="text-ink-muted transition-colors hover:text-ink">
                Hesabım
              </Link>
              {currentUser.isAdmin ? (
                <Link href="/admin" className="text-ink-muted transition-colors hover:text-ink">
                  Admin
                </Link>
              ) : null}
              <span className="hidden text-ink-muted sm:inline">
                Merhaba, {currentUser.name}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="text-ink-muted transition-colors hover:text-ink">
              Giriş Yap
            </Link>
          )}
          <Link
            href="/cart"
            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-bg transition-opacity hover:opacity-85"
          >
            Sepet
          </Link>
        </nav>
      </div>

      {categories.length > 0 ? (
        <div className="mx-auto max-w-6xl px-6 pb-3">
          <nav className="flex flex-wrap gap-6 font-body text-sm text-ink-muted">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category._id}`}
                className="transition-colors hover:text-ink"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
