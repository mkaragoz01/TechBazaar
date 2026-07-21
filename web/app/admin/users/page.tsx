import { getAdminUsers, getAdminRoles } from "@/lib/api";
import { getCurrentUser } from "@/lib/server-api";
import AdminButton from "@/components/admin/AdminButton";
import UserRoleSelect from "@/components/admin/UserRoleSelect";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const { q, role, page } = await searchParams;
  const pageNum = page ? Number(page) : 1;

  const [{ users, total, pages }, { roles }, currentUser] = await Promise.all([
    getAdminUsers({ q, role, page: pageNum }),
    getAdminRoles(),
    getCurrentUser(),
  ]);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (role) exportParams.set("role", role);
  const exportQs = exportParams.toString();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Kullanıcılar</h1>
        <a
          href={`/api/admin/users/export${exportQs ? `?${exportQs}` : ""}`}
          className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
        >
          Excel&apos;e Aktar
        </a>
      </div>

      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Ad / E-posta</span>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Ara..."
            className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Rol</span>
          <select
            name="role"
            defaultValue={role ?? ""}
            className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
          >
            <option value="">Tümü</option>
            {roles.map((r) => (
              <option key={r._id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <AdminButton size="sm" type="submit">
          Filtrele
        </AdminButton>
      </form>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Ad Soyad</th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">E-posta</th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Rol</th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{user.name}</td>
                <td className="px-4 py-3 text-ink-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <UserRoleSelect
                    userId={user._id}
                    role={user.role}
                    roles={roles}
                    isSelf={user._id === currentUser?._id}
                  />
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("tr-TR") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? (
          <p className="px-4 py-6 font-body text-ink-muted">Kullanıcı bulunamadı.</p>
        ) : null}
      </div>

      {pages > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
            const linkParams = new URLSearchParams();
            if (q) linkParams.set("q", q);
            if (role) linkParams.set("role", role);
            linkParams.set("page", String(p));
            return (
              <a
                key={p}
                href={`/admin/users?${linkParams.toString()}`}
                className={`rounded-full px-3 py-1.5 font-data text-xs ${
                  p === pageNum ? "bg-ink text-bg" : "border border-border text-ink-muted"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      ) : null}

      <p className="mt-2 font-body text-xs text-ink-muted">Toplam {total} kullanıcı.</p>
    </div>
  );
}
