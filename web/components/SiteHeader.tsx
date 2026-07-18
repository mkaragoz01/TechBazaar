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
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-6 py-4">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-ink"
        >
          Tech<span className="text-accent">Store</span>
        </Link>

        {categories.length > 0 ? (
          <nav className="flex flex-1 flex-wrap gap-6 font-body text-sm text-ink-muted">
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
        ) : (
          <div className="flex-1" />
        )}

        <nav className="flex flex-wrap items-center gap-5 font-body text-sm">
          {currentUser ? (
            <>
              <Link href="/orders" className="text-ink-muted transition-colors hover:text-ink">
                Siparişlerim
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
    </header>
  );
}
