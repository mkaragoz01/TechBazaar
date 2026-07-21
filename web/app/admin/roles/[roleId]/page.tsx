import { getAdminRole } from "@/lib/api";
import RoleForm from "@/components/admin/RoleForm";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  const { role } = await getAdminRole(roleId);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Rolü Düzenle</h1>
      <RoleForm role={role} />
    </div>
  );
}
