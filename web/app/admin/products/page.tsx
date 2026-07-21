import Link from "next/link";
import { getAdminProducts } from "@/lib/api";
import { formatPriceNumber } from "@/lib/formatPrice";
import DeleteButton from "@/components/admin/DeleteButton";
import AdminButton from "@/components/admin/AdminButton";

export default async function AdminProductsPage() {
  const { products } = await getAdminProducts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Ürünler</h1>
        <div className="flex items-center gap-4">
          <a
            href="/api/admin/products/export"
            className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
          >
            Dışa Aktar
          </a>
          <Link
            href="/admin/products/import"
            className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
          >
            İçe Aktar
          </Link>
          <AdminButton size="sm" href="/admin/products/new">
            Yeni Ürün
          </AdminButton>
        </div>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Ürün
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Fiyat
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Stok
              </th>
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                Durum
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{product.name}</td>
                <td className="px-4 py-3 font-data tabular-nums text-ink">
                  {formatPriceNumber(product.price)} TL
                </td>
                <td className="px-4 py-3">
                  {(product.stock ?? 0) > 0 ? (
                    <span className="font-data tabular-nums text-ink">{product.stock}</span>
                  ) : (
                    <span className="bg-accent/15 px-2 py-1 font-data text-xs text-accent">
                      Stokta Yok
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.isActive === false ? (
                    <span className="bg-ink-muted/20 px-2 py-1 font-data text-xs text-ink-muted">
                      Pasif
                    </span>
                  ) : (
                    <span className="bg-success/20 px-2 py-1 font-data text-xs text-success">
                      Aktif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${product._id}`}
                      className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      url={`/api/admin/products/${product._id}`}
                      confirmMessage="Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                      itemLabel={product.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 ? (
          <p className="px-4 py-6 font-body text-ink-muted">Henüz ürün eklenmemiş.</p>
        ) : null}
      </div>
    </div>
  );
}
