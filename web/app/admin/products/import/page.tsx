import ImportForm from "@/components/admin/ImportForm";

export default function ProductImportPage() {
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold text-ink">Ürün İçe Aktarma</h1>
      <p className="mb-6 max-w-2xl font-body text-sm text-ink-muted">
        Excel dosyasındaki satırlar SKU alanına göre eşleşir: SKU sistemde varsa ürün güncellenir,
        yoksa yeni ürün oluşturulur. Görseller bu akışın dışındadır, tekil düzenleme formundan
        yüklenir. Önce dosya doğrulanır ve bir önizleme gösterilir; siz &quot;Onayla ve İçe
        Aktar&quot; demeden hiçbir şey kaydedilmez. Hatalı bir satır tüm işlemi durdurmaz, sadece
        raporda görünüp atlanır.
      </p>
      <ImportForm />
    </div>
  );
}
