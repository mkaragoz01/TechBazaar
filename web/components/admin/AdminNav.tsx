"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/products", label: "Ürünler" },
  { href: "/admin/categories", label: "Kategoriler" },
  { href: "/admin/brands", label: "Markalar" },
  { href: "/admin/orders", label: "Siparişler" },
  { href: "/admin/campaigns", label: "Kampanyalar" },
];

export default function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-data text-sm font-semibold uppercase tracking-widest text-ink">
            TechStore <span className="text-accent">Yönetim</span>
          </Link>
          <nav className="flex gap-4 font-body text-sm text-ink-muted">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`transition-colors hover:text-accent ${isActive ? "font-semibold text-accent" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
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
