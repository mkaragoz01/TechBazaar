export default function CancellationReturnPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-display text-3xl font-bold text-ink">İptal ve İade Koşulları</h1>
      <div className="rich-content mt-6 font-body text-ink-muted">
        <p>
          Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında,
          teslim tarihinden itibaren <strong>14 gün</strong> içinde herhangi bir gerekçe
          göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkınız bulunmaktadır.
        </p>
        <h3>İade Şartları</h3>
        <ul>
          <li>Ürünün kullanılmamış, orijinal ambalajında ve satışa engel olmayacak durumda olması gerekir.</li>
          <li>Cayma hakkı süresi içinde Hesabım → Siparişlerim üzerinden iade talebi oluşturabilirsiniz.</li>
          <li>İade onaylandıktan sonra ödeme, kullanılan ödeme yöntemine iade edilir.</li>
        </ul>
        <h3>İstisnalar</h3>
        <p>
          Kişiye özel üretilen veya hızlı bozulma riski olan ürünlerde cayma hakkı
          kullanılamayabilir; bu durum ürün sayfasında ayrıca belirtilir.
        </p>
      </div>
    </main>
  );
}
