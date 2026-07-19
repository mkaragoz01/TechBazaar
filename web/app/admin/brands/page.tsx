import Link from "next/link";
import { getAdminBrands } from "@/lib/api";
import DeleteButton from "@/components/admin/DeleteButton";
import { stripHtml } from "@/lib/richText";

export default async function AdminBrandsPage() {
  const { brands } = await getAdminBrands();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Markalar</h1>
        <Link
          href="/admin/brands/new"
          className="bg-accent px-4 py-2 font-data text-xs uppercase tracking-widest text-accent-ink"
        >
          Yeni Marka
        </Link>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Ad
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Açıklama
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{brand.name}</td>
                <td className="max-w-md truncate px-4 py-3 text-ink-muted">
                  {stripHtml(brand.description)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/brands/${brand._id}`}
                      className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      url={`/api/admin/brands/${brand._id}`}
                      confirmMessage="Bu markayı silmek istediğinize emin misiniz?"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {brands.length === 0 ? (
          <p className="px-4 py-6 font-body text-ink-muted">Henüz marka eklenmemiş.</p>
        ) : null}
      </div>
    </div>
  );
}
