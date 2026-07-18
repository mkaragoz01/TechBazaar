import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCurrentUser, serverFetch } from "@/lib/server-api";
import type { Category } from "@/lib/types";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, { categories }] = await Promise.all([
    getCurrentUser(),
    serverFetch<{ categories: Category[] }>("/api/categories"),
  ]);

  return (
    <>
      <SiteHeader categories={categories} currentUser={currentUser} />
      {children}
      <SiteFooter />
    </>
  );
}
