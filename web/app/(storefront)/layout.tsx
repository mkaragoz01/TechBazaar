import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCurrentUser, serverFetch } from "@/lib/server-api";
import { getCartCount } from "@/lib/api";
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

  // Only logged-in users have a cart to count against.
  const cartCount = currentUser ? (await getCartCount()).count : 0;

  return (
    <>
      <SiteHeader categories={categories} currentUser={currentUser} cartCount={cartCount} />
      {children}
      <SiteFooter />
    </>
  );
}
