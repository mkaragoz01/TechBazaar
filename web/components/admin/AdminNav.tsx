"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const STANDALONE: NavItem = { href: "/admin", label: "Panel" };

// Groups a growing flat list of admin sections into dropdowns instead of an
// ever-widening single row — add a new section to an existing group's
// `items`, or a new group here, rather than back to a flat list.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Katalog",
    items: [
      { href: "/admin/products", label: "Ürünler" },
      { href: "/admin/categories", label: "Kategoriler" },
      { href: "/admin/brands", label: "Markalar" },
    ],
  },
  {
    label: "Satış",
    items: [
      { href: "/admin/orders", label: "Siparişler" },
      { href: "/admin/campaigns", label: "Kampanyalar" },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { href: "/admin/users", label: "Kullanıcılar" },
      { href: "/admin/roles", label: "Roller" },
      { href: "/admin/logs", label: "Loglar" },
    ],
  },
];

function isItemActive(pathname: string | null, href: string) {
  return href === "/admin" ? pathname === "/admin" : (pathname?.startsWith(href) ?? false);
}

function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string | null }) {
  const groupActive = group.items.some((item) => isItemActive(pathname, item.href));

  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden ${
          groupActive ? "font-semibold text-accent" : ""
        }`}
      >
        {group.label}
        <span aria-hidden className="text-[10px] transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="absolute left-0 top-full z-10 mt-2 flex min-w-[10rem] flex-col gap-0.5 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
        {group.items.map((item) => {
          const isActive = isItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-lg px-3 py-2 transition-colors hover:bg-surface-2 hover:text-accent ${
                isActive ? "font-semibold text-accent" : "text-ink-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

export default function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-data text-sm font-semibold uppercase tracking-widest text-ink">
            TechStore <span className="text-accent">Yönetim</span>
          </Link>
          <nav className="flex items-center gap-5 font-body text-sm text-ink-muted">
            <Link
              href={STANDALONE.href}
              aria-current={isItemActive(pathname, STANDALONE.href) ? "page" : undefined}
              className={`transition-colors hover:text-accent ${
                isItemActive(pathname, STANDALONE.href) ? "font-semibold text-accent" : ""
              }`}
            >
              {STANDALONE.label}
            </Link>
            {NAV_GROUPS.map((group) => (
              <NavDropdown key={group.label} group={group} pathname={pathname} />
            ))}
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
