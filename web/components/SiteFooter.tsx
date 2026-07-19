import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
        <div>
          <div className="font-display text-xl font-bold text-ink">
            Tech<span className="text-accent">Store</span>
          </div>
          <p className="mt-3 max-w-[34ch] text-sm text-ink-muted">
            En yeni telefon, bilgisayar ve aksesuarlar — spesifikasyonu net,
            fiyatı net.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Alışveriş
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-ink">
            <li>
              <Link href="/products" className="hover:text-accent">
                Tüm Ürünler
              </Link>
            </li>
            <li>
              <Link href="/filter/newest" className="hover:text-accent">
                En Yeniler
              </Link>
            </li>
            <li>
              <Link href="/filter/premium" className="hover:text-accent">
                Premium
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Hesap
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-ink">
            <li>
              <Link href="/orders" className="hover:text-accent">
                Siparişlerim
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-accent">
                Sepetim
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-accent">
                Giriş Yap
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Destek
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-ink">
            <li>
              <Link href="/legal/iptal-iade" className="hover:text-accent">
                İade &amp; Değişim
              </Link>
            </li>
            <li>
              <Link href="/kargo-takibi" className="hover:text-accent">
                Kargo Takibi
              </Link>
            </li>
            <li>
              <Link href="/iletisim" className="hover:text-accent">
                İletişim
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Kurumsal
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-ink">
            <li>
              <Link href="/hakkimizda" className="hover:text-accent">
                Hakkımızda
              </Link>
            </li>
            <li>
              <Link href="/legal/kvkk" className="hover:text-accent">
                KVKK &amp; Gizlilik
              </Link>
            </li>
            <li>
              <Link href="/legal/mesafeli-satis" className="hover:text-accent">
                Mesafeli Satış Sözleşmesi
              </Link>
            </li>
            <li>
              <Link href="/legal/kullanim-sartlari" className="hover:text-accent">
                Kullanım Şartları
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
