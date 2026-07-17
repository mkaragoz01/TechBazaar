import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-api";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }
  if (!user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-bg">
      <AdminNav userName={user.name} />
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
