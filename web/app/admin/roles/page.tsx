import { getAdminRoles } from "@/lib/api";
import AdminButton from "@/components/admin/AdminButton";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminRolesPage() {
  const { roles } = await getAdminRoles();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Roller</h1>
        <AdminButton size="sm" href="/admin/roles/new">
          Yeni Rol
        </AdminButton>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Ad</th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Yönetici Yetkisi</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">
                  {role.name}
                  {role.protected ? (
                    <span className="ml-2 font-data text-xs uppercase tracking-widest text-ink-muted">
                      (sistem)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {role.isAdminRole ? (
                    <span className="bg-success/20 px-2 py-1 font-data text-xs text-success">Evet</span>
                  ) : (
                    <span className="bg-ink-muted/20 px-2 py-1 font-data text-xs text-ink-muted">Hayır</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {role.protected ? null : (
                    <div className="flex items-center justify-end gap-3">
                      <a
                        href={`/admin/roles/${role._id}`}
                        className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
                      >
                        Düzenle
                      </a>
                      <DeleteButton
                        url={`/api/admin/roles/${role._id}`}
                        confirmMessage="Bu rolü silmek istediğinize emin misiniz?"
                        itemLabel={role.name}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {roles.length === 0 ? (
          <p className="px-4 py-6 font-body text-ink-muted">Henüz rol eklenmemiş.</p>
        ) : null}
      </div>
    </div>
  );
}
