import Link from "next/link";
import { getAdminCategories } from "@/lib/api";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminCategoriesPage() {
  const { categories } = await getAdminCategories();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Kategoriler</h1>
        <Link
          href="/admin/categories/new"
          className="bg-accent px-4 py-2 font-data text-xs uppercase tracking-widest text-accent-ink"
        >
          Yeni Kategori
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
            {categories.map((category) => (
              <tr key={category._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{category.name}</td>
                <td className="max-w-md truncate px-4 py-3 text-ink-muted">
                  {category.description}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/categories/${category._id}`}
                      className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      url={`/api/admin/categories/${category._id}`}
                      confirmMessage="Bu kategoriyi silmek istediğinize emin misiniz?"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 ? (
          <p className="px-4 py-6 font-body text-ink-muted">Henüz kategori eklenmemiş.</p>
        ) : null}
      </div>
    </div>
  );
}
