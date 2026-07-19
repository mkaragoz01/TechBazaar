export default function ShippingTrackingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-display text-3xl font-bold text-ink">Kargo Takibi</h1>
      <div className="rich-content mt-6 font-body text-ink-muted">
        <p>
          Siparişinizin güncel durumunu <strong>Hesabım → Siparişlerim</strong> sayfasından takip
          edebilirsiniz. Sipariş durumu; <em>Beklemede</em>, <em>Hazırlanıyor</em>,{" "}
          <em>Kargoda</em> ve <em>Teslim Edildi</em> aşamalarından geçer.
        </p>
        <p>
          Kargoya verilen siparişler için kargo firması tarafından size ayrıca bir takip numarası
          e-posta yoluyla iletilir.
        </p>
        <h3>Teslimat Süresi</h3>
        <p>
          Siparişler onaylandıktan sonra ortalama 2-5 iş günü içinde kargoya teslim edilir.
          Teslimat süresi bulunduğunuz bölgeye göre değişiklik gösterebilir.
        </p>
      </div>
    </main>
  );
}
