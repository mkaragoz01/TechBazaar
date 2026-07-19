export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-display text-3xl font-bold text-ink">İletişim</h1>
      <div className="rich-content mt-6 font-body text-ink-muted">
        <p>Sorularınız için aşağıdaki kanallardan bize ulaşabilirsiniz.</p>
        <h3>Müşteri Hizmetleri</h3>
        <p>
          E-posta: destek@techstore.example
          <br />
          Telefon: 0850 000 00 00 (Hafta içi 09:00–18:00)
        </p>
        <h3>Merkez Ofis</h3>
        <p>Örnek Mahallesi, Teknoloji Caddesi No:1, İstanbul</p>
      </div>
    </main>
  );
}
