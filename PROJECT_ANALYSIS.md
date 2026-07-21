# TechBazaar — Proje Analizi ve Uygulama Kılavuzu

## Bu Belge Hakkında

Bu belge, TechBazaar projesinin kapsamlı bir analizinin sonucudur ve **kendi kendine yeten bir uygulama kılavuzu** olarak tasarlanmıştır — bu dosyayı okuyan herhangi bir geliştirici veya Claude Code oturumu, önceki bir konuşmanın bağlamına ihtiyaç duymadan doğrudan uygulamaya başlayabilmelidir.

**Nasıl kullanılır**: Bölüm 1'deki adımları sırayla, her adımı test edip kendi commit'iyle uygulayın. Bölüm 2'ye Bölüm 1 tamamlanmadan geçmeyin — Bölüm 2'nin çoğu maddesi Bölüm 1'in tamamlanmış olduğunu varsayar.

**Güncelleme notu**: Bölüm 2'deki mimari karar, "tasarım için Pug yerine daha modern bir yapı kurulmalı" talebi üzerine revize edildi — bkz. "Mimari Karar" alt başlığı. Bu güncelleme sırasında Anthropic'in [`frontend-design` skill'i](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) referans alındı; bu skill belirli bir teknoloji önermez, görsel tasarım zevki/süreciyle (özgün palet, tipografi, motion, jenerik "AI tasarımı" klişelerinden kaçınma) ilgilidir — bu nedenle teknoloji seçimi (Next.js) ayrıca gerekçelendirildi ve skill'in prensipleri Faz C'de somutlaştırıldı.

## Durum (güncel)

- **Bölüm 1**: ✅ Tamamlandı.
- **Faz A, B**: ✅ Tamamlandı.
- **Faz C**: ✅ Tamamlandı — plandan daha geniş kapsamda: storefront'un yanı sıra **admin paneli de** Next.js'e taşındı (Faz G'de "ileride değerlendirilebilir" denen iş öne çekildi), Pug/csurf tamamen kaldırıldı. Tasarım iki iterasyon gördü: ilk sürüm ("kutu spesifikasyonu/fiyat etiketi" konsepti) kullanıcı geri bildirimiyle reddedildi, "Apple Store tarzı vitrin" yönünde ikinci bir kimliğe (bkz. Faz C detayı) geçildi.
- **Faz D**: ✅ Madde 1-11 tamamlandı (Brand, isNewArrival/isFeatured, Benzer Ürünler, Tiptap, sipariş durumu + admin liste, stok yönetimi, checkout + adres/kart + yasal sayfalar (E1/E2), Excel içe/dışa aktarma, sahte metrik temizliği, fiyat/arama filtreleri, **Kampanya sistemi MVP (2026-07-20) — bkz. madde 11a**). Kampanya sisteminde kullanıcı tarafından bulunan bir bug (2026-07-20): ters tarih aralığı (`endDate` < `startDate`) hiçbir yerde doğrulanmıyordu, kampanya sessizce hiç eşleşmiyordu — `models/campaign.js`'e çapraz-alan validator'ı + `CampaignForm.tsx`'e eşleşen client-side kontrol + regresyon testi eklendi, kullanıcının kendi test kampanyası da düzeltildi. E6/E9/E10/E11/E14 çözüldü (dashboard aggregation'a taşındı + yeniden tasarlandı, kullanıcı isteğiyle 2026-07-20); E4/E8/E12/E13 de çözüldü (2026-07-20) — bkz. Faz E tablosu.
- **Faz D — İkinci bağımsız denetim düzeltmeleri (2026-07-19)**: Kullanıcının kendi kod incelemesiyle bulduğu 10 madde düzeltildi — fiyat filtresinde NaN CastError çökmesi (API+sayfa 500), geçersiz ObjectId'lerde sistemik 500→404 (tüm `:id` route'ları), paylaşılan `authLimiter` bütçesinin route başına ayrılması, `Product.categories`'in gerçekte zorunlu olmaması (array-level validator eksikti) + admin formunda client-side kontrol, parola için sunucu tarafında minimum uzunluk kontrolü yokluğu (hash'lenmiş alan üzerinde schema validator işe yaramıyordu), ürün görseli yükleme hatalarının genel 500 dönmesi, doğrulama başarısız olunca yüklenen görselin diskte öksüz kalması, kök `eslint.config.js`'in `web/**`'i ignore etmemesi (`npm run lint` çöküyordu), `web/`'deki 8 gerçek lint hatası (unescaped entities, 3 yasal sayfa), ve sahte MIME türüyle Excel içe aktarma doğrulamasının atlatılabilmesi (SheetJS'in CSV fallback'i). Hepsi gerçek HTTP istekleriyle tek tek doğrulandı.
- **Faz E**: ✅ Test altyapısının çekirdeği tamamlandı (2026-07-20) — backend entegrasyon testleri (45 test, Jest+Supertest+mongodb-memory-server), birim testler, Playwright kritik-yol e2e testi, husky/lint-staged pre-commit, CI beş job'a genişletildi (backend-lint/test, web-lint/build, e2e). Bağımlılık denetimi de ✅ tamamlandı (2026-07-20) — `nodemon` majör güncellendi, `npm audit fix` kalanını çözdü, frontend'in bundled `postcss` açığı `overrides` ile (Next.js'i geriletmeden) kapatıldı, `.github/dependabot.yml` eklendi; kabul edilen tek kalıntı risk: `bcrypt`'in opsiyonel `@mapbox/node-pre-gyp`'i üzerinden `tar` (sadece kurulum-zamanı riski, zorla düzeltilmedi).
- **Faz F, G**: Henüz başlanmadı.

Bu bölümün geri kalanı (Bölüm 1, Faz A/B/C detayları) **tamamlanmış işin kaydı** olarak duruyor — hâlâ doğru ama artık "yapılacaklar" değil "yapıldı" olarak okunmalı.

## Bağlam

TechBazaar projesi incelenip analiz edildi: önce **çalışır/güvenli hale getirmek** için, ardından **ileri seviyeye taşımak** için öneriler çıkarıldı. Proje bir **öğrenme/portföy projesi** olarak konumlandırılıyor — bu doğrultuda Bölüm 2'de kod kalitesi, mimari temizlik ve test altyapısı ön planda tutuluyor; ödeme entegrasyonu/yasal uyum gibi salt-production konuları kısa ve düşük öncelikli olarak ele alınıyor.

Analiz üç paralel keşif ajanı (genel proje yapısı, backend mimarisi, frontend), en kritik bulguların `app.js`, `utility/database.js` ve `controllers/account.js` dosyaları elle okunarak doğrulanması, ve ileri-seviye yol haritası için ayrı bir tasarım ajanı kullanılarak yürütüldü. Aşağıdaki tüm bulgular somut dosya:satır referanslarıyla verilmiştir.

## Projenin Kimliği (özet)

- **Yığın**: Node.js + Express 4 + Pug (sunucu taraflı şablon) + MongoDB/Mongoose. Bootstrap/jQuery/Chart.js/CKEditor CDN üzerinden yükleniyor. Build adımı ve JS framework'ü (React/Vue) yok.
- **Köken**: `package.json`'daki proje adı hâlâ `"express_lesson"`; commit geçmişi (`mongoose_connect` → `bcrypt` → `isAdmin` → `validation_*` → `add_filter_search` → `admin_dashborads`) bunun bir Express/MongoDB kursundan gerçek görünümlü bir mağazaya evrilen, tek geliştiricili bir proje olduğunu gösteriyor.
- **Çalışan çekirdek**: Ürün/kategori CRUD + resim yükleme, sepet, sipariş oluşturma, giriş/kayıt/şifre sıfırlama, admin paneli + Chart.js satış grafiği.
- **Eksik/yarım**: Gerçek checkout akışı yok (`checkout.pug` boş şablon), ödeme entegrasyonu yok, stok takibi yok, sipariş durumu sabit metin, arama tamamen client-side, test/CI/linter yok.
- 38 commit, tek şube (`main`), tek yazar; repo GitHub'da **public**.

---

## BÖLÜM 1 — Önce: Çalışır ve Güvenli Hale Getirme

### 1.1 Çalıştırma Ortamı (checklist)

| # | Adım | Not |
|---|---|---|
| 1 | `npm ci` | `package-lock.json` mevcut, `node_modules` zaten var — sorunsuz olmalı |
| 2 | Yerel MongoDB kur/çalıştır | Bağlantı `mongodb://localhost/node-app` olarak **hardcoded** (`app.js:16`) |
| 3 | `.env` dosyası oluştur | Repoda `.env.example` yok. En az `GMAIL`, `PW` (Gmail uygulama şifresi) gerekli (`controllers/account.js:12-13`); eksikse app çalışır ama kayıt/şifre-sıfırlama maili sessizce başarısız olur |
| 4 | `npm start` | `nodemon app.js`, port **3000 sabit** (`app.js:83`), `PORT` env desteği yok |
| 5 | İlk admini oluştur | Self-servis yok: `/register` ile kayıt olup MongoDB'de o kullanıcıda `isAdmin: true` alanını **elle** ayarlamak gerekiyor (`models/user.js:20-23`) — aksi halde `/admin/*` açılmaz |
| 6 | Veri yok | Seed/migration script'i yok — kategori/ürün oluşturulmadan mağaza "Ürün bulunamadı" gösterir |

### 1.2 Çökme/Hata Üreten Buglar (kimlik doğrulama gerekmeden tetiklenebilir)

Hepsi `controllers/account.js` içinde ve **giriş yapmadan** tetiklenebilir — bu nedenle önemli:

| # | Konum | Tetikleyici | Etki |
|---|---|---|---|
| 1 | `account.js:245,262` (`getNewPassword`) | `GET /reset-password/:token` (geçersiz/süresi dolmuş token) | `connect-flash` paketi kurulu/bağlı değil ama `req.flash(...)` çağrılıyor → `TypeError` → yakalanmamış promise reddi → **Node ≥15'te process çöker** |
| 2 | `account.js:189-195` (`postReset`) | `POST /reset-password` (kayıtsız e-posta) | `if(!user)` bloğunda `return` yok → `user` null iken `user.resetToken=...` çalışır → `TypeError`; zincirin sonunda **hiç `.catch` yok** → yakalanmamış reddedilme → **çöker** (1. maddeyle aynı sınıf hata; elle doğrulandı) |
| 3 | `account.js:279-291` (`postNewPassword`) | Geçersiz token/userId ile `POST /new-password` | `_user` null olabilir, kontrol yok → hata fırlatır → `.catch(err => console.log(err))` yakalar ama **hiç response dönmez** → istemci tarafında istek asılı kalır |
| 4 | `account.js:28,84` (`postLogin`); `account.js:103,159` (`postRegister`); `account.js:225,228` (`getLogout`) | Doğrulama-dışı bir hata oluştuğunda (örn. geçici DB hatası) | Fonksiyon imzasında `next` parametresi yok ama `next(err)` çağrılıyor → `ReferenceError` — zarif bir 500 olması gereken durum çökmeye dönüşüyor |
| 5 | `account.js:110-115` (`postRegister`) | Zaten kayıtlı e-posta ile tekrar kayıt | `return` eksik → "zaten kayıtlı" kontrolü etkisiz, aynı e-postayla ikinci hesap oluşturuluyor. Ayrıca `account.js:163`'teki `res.redirect('/login')` async zincirin **dışında/senkron** çalışıyor — DB işlemleri bitmeden yönlendirme yapılıyor |
| 6 | `account.js:236` (`getNewPassword`) | Her çağrıda | `errorMessage = ...` — `var/let/const` yok, kazara global değişken oluşuyor (küçük ama gerçek bir hata) |

**Not:** `models/user.js`'de `email` alanına `unique: true` eklenmesi, 5. maddedeki yarış durumunu DB seviyesinde de kapatır — controller düzeltmesi tek başına yeterli değildir.

### 1.3 Kritik Güvenlik Açıkları

| Öncelik | Bulgu | Konum | Etki |
|---|---|---|---|
| **En kritik** | **Sızmış gerçek veritabanı kimlik bilgisi** | `utility/database.js:6` — `mongodb+srv://mkaragoz:1234@cluster0...` | Yorum satırı olsa da repo **public GitHub'da**; kimlik bilgisi git geçmişinde ilk commit'ten beri duruyor. Kod temizliğinden bağımsız olarak **bu Atlas kullanıcısının şifresini hemen değiştirin/silin** |
| Kritik | Kimliksiz/global dosya yükleme | `app.js:34-35` | `multer`, tüm route'lardan ve `csurf`'ten (satır 65) **önce**, path belirtilmeden mount edilmiş; `fileFilter`/`limits` yok → herhangi bir istek `imgUrl` alanlı multipart içeriyorsa oturum/CSRF/admin kontrolünden geçmeden dosya kaydediliyor. Uzantı serbest (`.html`/`.svg` yükleyip `public/` üzerinden servis edilebilir), boyut sınırı yok (disk doldurma DoS) |
| Kritik | Stored XSS → admin oturumu ele geçirme zinciri | Kayıt formu `name` alanı sanitize edilmeden (`account.js:104`) siparişe kopyalanıyor (`controllers/shop.js:170`) ve `views/admin/dashboards.pug:354`'te `!{JSON.stringify(orders)}` ile kaçışsız `<script>`'e gömülüyor | Anonim bir ziyaretçi özel karakterli bir adla kayıt olup sipariş verirse, admin dashboard'u açtığında script **admin oturumu bağlamında** çalışabilir. Benzer kaçışsız `!{}` kullanımları: `product-detail.pug:60`, `categories.pug:52`, `menu.pug:63` (navbar — her sayfada), `cart.pug:159` |
| Orta-Yüksek | Sabit/zayıf session secret, güvensiz cookie ayarları | `app.js:38` (`secret:'mysecret'`); `secure`/`sameSite` ayarlanmamış | Session hijack riski, prod'da HTTPS zorunluluğu yok |
| Orta | Rate limiting / brute-force koruması yok | login, register, reset-password | `helmet`, `express-rate-limit` yok |
| Orta | Tam kullanıcı dokümanı (bcrypt hash dahil) session'da saklanıyor | `account.js:53` (`req.session.user = user`) | Gereksiz veri teşhiri; zaten her istekte `req.user` DB'den tazeleniyor (`app.js:51`) |
| Düşük | Admin yetkisi session'da "bayat" kalabiliyor | `middleware/isAdmin.js:6` | DB'de yetki geri alınsa bile aktif oturum (1 saat) boyunca admin paneline erişim sürebilir |

*Not: `product-detail.pug`, `categories.pug`, `cart.pug`'daki XSS'ler Bölüm 2 / Faz C'deki Next.js migrasyonuyla (React varsayılan olarak auto-escape yapar) kendiliğinden kapanacak. Ancak admin paneli (`dashboards.pug`) Pug'da kalacağı için **o satır Bölüm 1'de mutlaka elle düzeltilmeli** — ileride yapılacak bir migrasyona güvenip bugün ertelenmemeli.*

### Bölüm 1 — Uygulama Sırası Önerisi

1. Sızan kimlik bilgisini döndür/sil → koddan satırı kaldır (rotasyon, kod temizliğinden ayrı ve daha acil)
2. `app.js`'teki `multer` mount'unu ilgili admin route'larına taşı + `fileFilter` (mime whitelist) + `limits.fileSize` ekle
3. `connect-flash` kur (ya da `req.flash` çağrılarını projenin zaten kullandığı `req.session.errorMessage` desenine çevir — daha tutarlı olur)
4. `next` parametresi eksik olan 3 fonksiyonu düzelt; `postRegister`/`postReset`'teki eksik `return`'leri ekle; `postNewPassword`'a `_user` null kontrolü + gerçek bir hata yanıtı ekle
5. Yukarıdaki `!{}` kullanımlarını `#{}` (auto-escape) ile değiştir veya JSON çıktısını `</script>`'e karşı güvenli hale getir; kategori açıklaması (CKEditor zengin metin) için sunucu tarafı sanitizasyon (`sanitize-html`) ekle
6. `.env.example` oluştur, DB connection string + session secret'ı env'e taşı
7. Yerel MongoDB'yi kurup `.env`'i doldur, ilk admini elle işaretle, `npm start` ile doğrula

Bu 7 adım tamamlandığında proje hem **çalışır** hem de bilinen en tehlikeli açıklardan arınmış olur.

---

## BÖLÜM 2 — Sonra: İleri Seviyeye Taşıma (Öğrenme/Portföy Odaklı)

### Mimari Karar: Backend'i Sertleştir, Frontend'i Next.js'e Taşı

**Backend — değişmedi.** Express/Mongoose iş mantığını (controllers, models, route'lar) sertleştirip genişletin, sıfırdan yazmayın. Gerekçe hâlâ geçerli:
- Kataloglanan iş-mantığı sorunlarının hiçbiri (String tipinde fiyat, eksik stok alanı, sahte dashboard metrikleri, 3 kopya fiyat-parse mantığı) yığından kaynaklanmıyor — Faz B'de doğru şema/controller yazılarak düzelir.
- Tek geliştiricili, testsiz bir projede paralel bir backend rewrite'ı "%80'de sonsuza kadar takılı kalan ikinci sistem" tuzağına düşer.

**Frontend — güncellendi.** Görünüm katmanı (`views/*.pug`, `public/css`) **kasıtlı ve kapsamı belirlenmiş bir istisna** olarak Next.js'e (App Router + TypeScript + Tailwind CSS) taşınıyor — çünkü görsel tasarım kalitesi bu proje için açıkça öncelikli hale geldi. Bu, "rewrite yapma" ilkesinin ihlali değil: iş mantığı/veritabanı/route katmanı **aynı kalıyor**, sadece çıktı formatı (Pug render → JSON) ve sunum katmanı değişiyor.

- **Neden Next.js**: Ürün sayfalarının SEO'su önemli (Pug ile zaten sunucu tarafında render ediliyordu — bu avantaj kaybedilmemeli); Next.js'in SSR/SSG'si bunu korur. Ekosistemi (Tailwind, `next/image`, `next/font`, Framer Motion) aşağıdaki "Tasarım Yönü" bölümünün önerdiği tipografi/motion çalışmasını doğrudan destekler. 2026 itibariyle portföy değerlendirmesinde en yaygın beklenen modern stack.
- **Daha hafif alternatif**: Astro + Tailwind + gerektiğinde React "island"ları. Ürün kataloğu gibi büyük ölçüde statik sayfalar için daha az JS/state karmaşıklığıyla benzer sonucu verir. Next.js'in ekosistem/CV değeri daha yüksek görülüyorsa Next.js ile ilerleyin; daha az karmaşıklık isteniyorsa Astro gerçek bir alternatiftir.
- **Kapsam**: Önce müşteri karşısındaki sayfalar (ana sayfa, ürün listeleme/detay, sepet) — tasarımın önem taşıdığı yer burası. **Admin paneli kapsam dışı**: iç kullanım aracı, tasarım önceliği yok; Pug'da kalır, storefront migrasyonu oturduktan sonra ayrı bir iş kalemi olarak değerlendirilir (bkz. Faz G).
- **Backend'in dönüşümü**: `controllers/*.js`'teki `res.render(...)` çağrıları `res.json(...)`'a döner; `app.js:77-78`'deki Pug view engine ayarı kaldırılır. İş mantığı/Mongoose sorguları **değişmeden** kalır — bu bir controller rewrite'ı değil, dönüş biçimi değişikliği.
- **Auth/CSRF etkisi (gözden kaçırılmaması gereken teknik detay)**: `express-session` çerez tabanlı auth'u JWT'ye geçmeden korumak için Next.js'i Express API ile **aynı origin** altında (reverse proxy / `next.config.js` `rewrites`) çalıştırın — bu, "backend'i sertleştir, yeniden yazma" ilkesiyle tutarlı en düşük riskli yol. `csurf`'ün form-gömülü `_csrf` deseni fetch tabanlı bir API'ye uymuyor; bunu Faz E'deki "csurf'ü değiştir" işiyle birleştirip tek seferde çözün (çift-gönderim-çerezi deseni veya `Content-Type: application/json` kontrolüne dayanan hafif bir strateji).
- Backend'de TypeScript'e geçiş hâlâ **kademeli ve opsiyonel** (Faz G) — ama yeni Next.js frontend'i doğrudan TypeScript ile kurun (framework'ün varsayılanı, ek efor gerektirmez).

Bunu `docs/adr/0001-frontend-modernization.md` gibi bir ADR'ye yazmak iyi bir portföy sinyali: "neden backend sabit kaldı, neden frontend değişti" kararını gerekçelendirir.

### Faz A — Temizlik ve Altyapı (backend-odaklı, hemen başlanabilir)

| İş | Efor | Not |
|---|---|---|
| Ölü kod temizliği: `views/{404,add-product,index}.html` (tamamen bağlantısız prototip sayfalar), `models/orderItem.js` + `utility/database_mysql.js` (kırık/kullanılmayan Sequelize kalıntısı), kullanılmayan `mailersend` bağımlılığı | S | |
| ⚠️ Aynı commit'te yapılması gereken: `validator` paketi `package.json`'da tanımlı değil, sadece `sequelize`'in transitive bağımlılığı olarak duruyor — sequelize/mysql2 kaldırılınca `npm install` bunu çekmez ve `models/user.js`/`models/login.js` çöker. `validator`'ı doğrudan bağımlılık olarak ekleyin | S | Gözden kaçmaya çok müsait bir tuzak |
| ESLint + Prettier kurulumu (backend `.js` dosyaları için) | S | |
| `.env.example`, `package.json`'a `engines.node` ekleme | S | 1.1 ile örtüşüyor, birlikte yapılabilir |
| GitHub Actions CI: kurulum + lint | S | Portföy için düşük efor / yüksek görünürlük |
| `helmet` varsayılanları + login/register/reset'e temel rate limiting | S | Ucuz ve bağımsız, Faz E'ye kadar beklemesin |

*Not: Pug şablonlarına özgü CSS/Bootstrap-sürüm/`lang` düzeltmeleri bu fazdan çıkarıldı — Faz C'deki Next.js migrasyonu bu dosyaların tamamını değiştireceğinden, Pug üzerinde bu düzeltmeleri yapmak gereksiz efor olur.*

### Faz B — Veri Modeli Düzeltmeleri

| İş | Efor | Not |
|---|---|---|
| `Product.price`: String → Number (kuruş bazlı tam sayı önerilir, `Decimal128` değil — JS'te doğal aritmetik yapılamıyor). Migration script + 3 kopya fiyat-parse mantığını tek bir `formatPrice()` yardımcısına indirger | M/L | Checkout/dashboard doğruluğunun önkoşulu; API'nin temiz sayısal değer döndürmesi Faz C'nin de önkoşulu |
| `Order` şemasına `{timestamps:true}`, gerçek `status` enum'u, düzgün tip'li `items[]` alt-şeması | M | Şu an sipariş tarihi yok — dashboard bu yüzden rastgele tarih **üretiyor** |
| `Product`'a `stock` alanı (şu an hiç yok) | S | |
| `User.email`'e `unique+lowercase+trim` index, `Category.name`'e yinelenen isim koruması | S | Bölüm 1'deki controller-seviyesi düzeltmenin DB-seviyesi garantisi |
| `Product.name/description` üzerinde **Türkçe dil desteğiyle** MongoDB text index (gerçek arama için) + kategori/ürün index'leri | S/M | MongoDB'nin yerleşik Türkçe stemmer desteği 3.-parti arama motorunu gereksiz kılıyor |
| `Product.isActive`'i (zaten var, şu an sadece `price` doğrulamasında kullanılıyor) soft-delete bayrağı olarak yeniden kullan | M | |

### Faz C — Frontend Modernizasyonu (Next.js Migrasyonu)

**Hedef**: Müşteri karşısındaki sayfaları (ana sayfa, ürün listeleme, ürün detay, sepet) Pug'dan Next.js (App Router) + TypeScript + Tailwind CSS'e taşımak; Express'i bu sayfalar için saf bir JSON API'ye dönüştürmek. Admin paneli bu fazın kapsamı dışında.

| İş | Efor | Not |
|---|---|---|
| Next.js projesini kur (`create-next-app`, TypeScript+Tailwind varsayılan) — repo kökünde yeni bir `web/` klasörü olarak; mevcut Express kodu yerinde kalır | S | Tek repo, iki net yarı — portföy sunumu için tek bir git geçmişi/README'de iki tarafı göstermek ayrı repo'ya bölmekten daha güçlü bir anlatı |
| `controllers/shop.js`, `controllers/account.js` içindeki `res.render(...)` çağrılarını `res.json(...)`'a çevir | M | İş mantığı/Mongoose sorguları **değişmiyor** — sadece çıkış formatı |
| Express'te `view engine`/`views` ayarını kaldır (`app.js:77-78`); `express.static` sadece yüklenen ürün görselleri için kalır | S | |
| Auth/session: Next.js'i Express API ile **aynı origin** altına getirecek bir reverse proxy / `next.config.js` `rewrites` kurulumu yapın | M | Bölüm 1'de zaten iyileştirdiğiniz session'ı burada JWT'ye geçerek yeniden yazmayın |
| `csurf`'ü kaldırıp fetch-tabanlı API'ye uygun bir CSRF stratejisi kurun | M | Faz E'deki "csurf değiştir" işiyle birleştirin, iki kere yapmayın |
| Sayfa göçü sırası: ana sayfa → ürün listeleme (Faz B'nin text-index'ine dayanan gerçek arama/filtre burada) → ürün detay → sepet | L (toplam) | Her sayfa kendi PR'ı olsun; bir sayfa bitince ilgili `.pug` dosyasını hemen silin, iki paralel implementasyon yaşatmayın |
| `next/image` ile mevcut `public/img/` varlıklarını optimize edilmiş şekilde sun | S | Eski Faz F'deki "görsel optimizasyonu" ihtiyacını yan ürün olarak çözer |
| `next/font` ile tipografi kurulumu (aşağıdaki Tasarım Yönü'ne göre) | S | |

**Kapsam dışı (şimdilik)**: Admin paneli (`views/admin/*.pug`, Chart.js dashboard) — iç kullanım aracı, tasarım önceliği yok. Backend JSON API'ye döndüğünde admin panelinin de kendi istemci tarafına (küçük bir form/tablo arayüzü) ihtiyacı olacak; bu, storefront migrasyonu bittikten sonra ayrı bir iş kalemi (bkz. Faz G) — kapsamı şimdi büyütmeyin.

**Tasarım Yönü ve Süreç** — referans: [`frontend-design` skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)

Bu skill bir teknoloji seçmez; jenerik/şablon hissi veren tasarımlardan kaçınıp konuya özgü, kasıtlı seçimler (palet, tipografi, yerleşim, bir "imza" unsuru) yapmayı öğretir. Bu migrasyonu uygulayan oturum, Tailwind'in veya bir bileşen kütüphanesinin **varsayılan temasıyla** başlamamalı — skill'in sürecini izlemeli: önce bir tasarım token sistemi (4-6 adlandırılmış hex renk, 2+ tipografi rolü — karakterli bir başlık fontu + tamamlayıcı bir gövde fontu, gerekirse bir teknik/veri fontu — bir yerleşim konsepti, bir imza unsuru) brainstorm edilmeli, bu jenerik bir sonuç olup olmadığı eleştirilmeli, ancak sonra koda geçilmeli.

Somut bir başlangıç yönü — markanın kendi adından ("Tech" + "Bazaar/Pazar") çıkan bir kavram, jenerik e-ticaret şablonlarından (kurumsal mavi/gri palet, stok fotoğrafı hero) kaçınarak:
- **Konu**: "Bazaar" kelimesi kapalıçarşı/pazar çağrışımı yapıyor — bu, "teknoloji"nin hassas/dijital dünyası ile "çarşı"nın sıcak/katmanlı/keşif dolu enerjisinin kesişimi olarak okunabilir. Skill'in uyardığı 3 jenerik klişeden (krem arka plan + yüksek kontrastlı serif + toprak tonu aksan; siyah arka plan + tek neon aksan; gazete-tarzı ince çizgili sütunlar) bilinçli olarak uzak durun.
- Bu yalnızca bir **başlangıç noktası**. Gerçek token sistemi (kesin hex değerleri, tipografi eşleşmesi, imza unsuru) migrasyonu uygulayan oturumda skill'in "brainstorm → plan → eleştir → kur → tekrar eleştir" süreciyle **interaktif olarak** (ekran görüntüsü alınarak) belirlenmeli — bu belgede önceden kilitlenmiyor.
- Zorunlu kalite tabanı (skill'den): mobilde tam duyarlı tasarım, görünür klavye focus durumu, `prefers-reduced-motion` desteği. Bunlar Next.js/React'e geçişin **yan ürünü** olarak Bölüm 1'de bulunan `lang="en"` hatasını (kök `layout.tsx`'te tek satırda `lang="tr"` olarak düzelir) ve dağınık erişilebilirlik boşluklarını da çözer.
- Metin/mikrokopya: Skill'in yazım rehberi burada da geçerli — buton etiketleri ne yaptığını söylemeli ("Sepete Ekle", jenerik "Gönder" değil), hata mesajları özel olmalı (genel "Beklenmedik bir hata oluştu!" yerine — bkz. `views/error/500.pug` — ne olduğunu ve kullanıcının ne yapabileceğini söyleyen bir dil).

### Faz D — Temel E-Ticaret Özelliklerini Tamamlama

Faz C tamamlandı (admin dahil, Next.js üzerinde). Aşağıdaki liste, kullanıcı geri bildirimiyle genişletilmiş **güncel** kapsamı yansıtıyor; sıra bağımlılığa göredir, her madde kendi commit'i.

| # | İş | Efor | Not |
|---|---|---|---|
| 1 | **Marka (Brand) modeli** — `models/brand.js`, admin'de Marka CRUD, `Product`'a `brand` (ref) alanı, storefront'ta marka bazlı filtreleme (kategori filtresiyle aynı desen) | M | Excel içe aktarımının (madde 7) önkoşulu |
| 2 | **Ürüne `isNewArrival`/`isFeatured` kutucukları** — admin ürün formuna eklenir; ana sayfadaki "En Yeniler"/"Öne Çıkanlar" artık otomatik hesaplanmıyor (tarih/rastgele), admin'in işaretlediği ürünleri gösteriyor. "Premium" sekmesi otomatik/fiyat-bazlı kalıyor | S | |
| 3 | **Benzer Ürünler** — ürün detay sayfasında aynı kategorideki diğer ürünler | S | |
| 4 | **Zengin metin (Tiptap)** — ürün ve kategori açıklaması için; CKEditor 4 (EOL) kalıcı olarak Tiptap ile değiştiriliyor (Faz E'nin eski "CKEditor kararı" maddesi burada çözülüyor, orada tekrar ele alınmayacak). Açıklamalar artık `dangerouslySetInnerHTML` ile render ediliyor — `sanitize-html` zaten sunucu tarafında temizliyor | M | |
| 5 | ~~**Admin: sipariş durumu değiştirme**~~ | S/M | ✅ Tamamlandı — `/admin/orders` liste+filtre sayfası ve satır bazlı durum dropdown'ı eklendi (bkz. E5) |
| 6 | ~~**Stok yönetimi**~~ | M | ✅ Tamamlandı — atomik düşüm + rollback, sepet/sipariş kontrolü, "Stokta Yok" UI |
| 7 | ~~**Gerçek checkout akışı**~~ | L | ✅ Tamamlandı — `models/address.js` + `models/paymentMethod.js` (kart numarası/CVV asla saklanmaz, yalnızca son 4 hane), `/checkout` sayfası (kayıtlı adres/kart seç veya yeni ekle → özet → onayla), `Order`'a `shippingAddress` (snapshot) + `paymentDisplay` eklendi. E1 (yasal sayfalar: Hakkımızda, İletişim, Kargo Takibi, KVKK, Mesafeli Satış, İptal/İade, Kullanım Şartları) ve E2 (footer linkleri) bu maddeyle birlikte çözüldü |
| 8 | ~~**Excel toplu içe/dışa aktarma**~~ | M/L | ✅ Tamamlandı — `xlsx` SheetJS'in resmi CDN build'i (npm'deki eski/CVE'li sürüm değil) ile `sku` bazlı doğrula→önizle→onayla akışı, hatalı satır tüm işlemi durdurmuyor, ayrıca dışa aktarma + boş şablon indirme |
| 9 | Sahte dashboard metriklerini kaldır — "%95 müşteri memnuniyeti" gibi değerler hesaplanmıyor, sabit yazılmıştı | S | Next.js'e taşınırken zaten kaldırıldı — bilgi amaçlı |
| 10 | ~~**Ana sayfa/listeleme filtreleri**~~ | S/M | ✅ Tamamlandı — fiyat aralığı + Faz B'nin text index'ine dayanan gerçek arama kutusu |
| 11 | ~~**Kampanya (indirim) sistemi — MVP**~~ | XL | ✅ Tamamlandı (2026-07-20) — bkz. 11a. Madde 9/E3'teki sahte "%10 indirim" iddiası kaldırıldı, gerçek aktif kampanya banner'ı geldi |

**11a — Kampanya koşul sistemi, detaylı tasarım:**

Kullanıcı VE/VEYA mantığı, "isim X içeriyor" gibi metin-eşleşmesi, sepet-toplamı eşiği ve "kampanya sepete mi ürüne mi uygulanıyor" ayrımı istedi. Bunu **rastgele derinlikte iç içe bir kural ağacı** olarak değil (bu, gerçek promosyon motorlarının (Shopify Scripts, Salesforce Commerce Cloud vb.) ay sürebilen bir parçası — tek geliştiricili bir portföy projesi için hem inşa etmesi hem test etmesi orantısız), **"VEYA'ların İÇİNDE VE" (OR-of-ANDs / ayrık normal form)** deseniyle modelliyorum — bu, gerçek kupon sistemlerinin (örn. WooCommerce) de kullandığı desen: herhangi bir mantıksal ifade bu şekilde yazılabilir (matematiksel olarak tam/complete), ama admin arayüzü basit kalır ("grup ekle" + her grubun içine "koşul ekle" — sabit iki seviyeli bir liste, serbest ağaç değil).

- `conditionGroups: [Group]` — kampanya, **gruplardan herhangi biri** tamamen sağlanırsa uygulanır (gruplar arası **VEYA**)
- Her `Group.conditions: [Condition]` — bir grup, **içindeki tüm koşullar** sağlanırsa "sağlanmış" sayılır (grup içi **VE**)
- `Condition` türleri (her biri sepet/kullanıcı bağlamına karşı değerlendirilir):
  - `{ type: 'product', field: 'sku'|'category'|'brand', operator: 'in', values: [...] }` — SKU/kategori/marka eşleşmesi
  - `{ type: 'productName', operator: 'contains', value: 'string' }` — ürün adı/açıklaması belirli bir metni içeriyorsa (kullanıcının "isim şunları içerir" isteği — **ürün adına** göre yorumlandı, kullanıcı adına göre değil: önceki turda kullanıcı-hedeflemesini email/ID'ye bağlamıştık, isim eşleşmesi ürün tarafında daha güvenli/anlamlı bir kullanım alanı)
  - `{ type: 'user', operator: 'in', values: [userId/email] }` — belirli kullanıcı(lar)
  - `{ type: 'cartTotal', operator: 'gte'|'lte', value: Number (kuruş) }` — "sepet toplamı şu kadarsa" — örn. 500₺ üzeri sepette
- **Etki (`effect`)**: `discountType` (`percentage`\|`fixed`) + `discountValue`, ve **`appliesTo: 'matchingItems'\|'cartTotal'`** — "kampanya sepete mi ürüne göre mi şekillensin" isteğinin karşılığı: `matchingItems` seçiliyse indirim **sadece koşulları tetikleyen ürünlere** uygulanır (örn. "X markasından ürünlerde %20"); `cartTotal` seçiliyse indirim **sepetin toplamına** uygulanır (örn. "500₺ üzeri sepette %10", ürün bağımsız)
- `code` (opsiyonel, önceki tasarımdan devam), `startDate`/`endDate`, `isActive`

**Dürüst efor notu**: Bu artık gerçek bir küçük kural motoru — model + değerlendirme fonksiyonu (`evaluateCampaign(cart, user)`) + admin'de dinamik grup/koşul ekleme-çıkarma UI'ı + storefront'ta fiyat hesaplamasına entegrasyon. Tek maddede L→**XL**'e yükselttim. **Önerilen sıralama (MVP'den genişleyerek)**: önce tek-grup (VE-only, VEYA'sız) + `product`/`user`/`cartTotal` koşullarıyla çalışan bir sürüm yapın ve **canlı gösterin/test edin**; `conditionGroups` (VEYA katmanı) ve `productName`/`contains` koşulunu ikinci bir commit'te ekleyin. Bu, çalışan bir versiyonu erken elde etmenizi sağlar — tüm koşul tiplerini ve VEYA mantığını tek seferde inşa edip test etmeye çalışmak bu ölçekte bir özellik için riskli.

**Uygulama notu (2026-07-20)**: Yukarıdaki önerilen sıralama izlendi — MVP (tek grup VE-only; `product`/`user`/`cartTotal` koşulları; `code`; `appliesTo`) uçtan uca çalışır durumda: `models/campaign.js`, `utility/evaluateCampaign.js` (saf fonksiyonlar, 16 birim testi), admin CRUD + `/admin/campaigns` sayfaları (dinamik koşul ekleme/çıkarma formu), sepet/checkout/sipariş sayfalarında otomatik indirim + kampanya kodu girişi/kaldırma, sipariş üzerine `discountAmount`/`campaignName` snapshot'ı, dashboard gelir hesaplamaları indirimi düşecek şekilde güncellendi, ana sayfadaki sahte "%10 indirim" bandı gerçek aktif kampanyayı gösteren dinamik bir banner ile değiştirildi.

**İkinci pas — `conditionGroups` (VEYA katmanı) + `productName`/`contains` (2026-07-20)**: ✅ Tamamlandı. `models/campaign.js`'te düz `conditions` dizisi `conditionGroups: [{ conditions }]`'a taşındı (gruplardan biri VEYA, grup içi VE), `productName`/`contains` koşul tipi eklendi (`text` alanı). `utility/evaluateCampaign.js` geriye uyumlu: `groupsFor()`/`matchingGroupFor()` eski düz `conditions` alanına sahip (migrasyon görmemiş) bir kampanyayı otomatik olarak tek elemanlı bir grup gibi ele alıyor — mevcut 16 birim testi hiç değiştirilmeden geçmeye devam etti, üstüne 6 yeni birim testi (OR mantığı, `matchingGroupFor`, grup-farkında `computeDiscountAmount`, `productName` eşleşmesi) + 2 yeni entegrasyon testi (OR-of-groups uçtan uca, eski düz-`conditions` belgesinin API üzerinden hâlâ doğru çalıştığı) eklendi (86/86 backend testi geçiyor). `CampaignForm.tsx` çok-gruplu bir arayüze yeniden yazıldı ("Grup N" + aralarında "VEYA" ayırıcı + "+ Grup Ekle"/"Grubu Kaldır", yeni "Ürün adı eşleşmesi" koşul tipi). Gerçek admin oturumuyla Playwright'ta uçtan uca doğrulandı (grup ekleme/kaldırma, VEYA ayırıcı, kampanya kaydetme). Kullanıcının dev DB'sindeki tek eski-şekilli kampanya `scripts/migrate-campaign-condition-groups.js` ile (yeniden çalıştırılabilir, idempotent) yeni şekle taşındı — bu adım zorunlu değildi (geriye uyumluluk read-time'da zaten çözüyordu) ama admin düzenleme formunun her kampanyada tekdüze davranması için yapıldı. Ayrıca `scripts/grant-admin.js` eklendi (Faz F'nin "self-servis admin yok" notuna kısmi bir çözüm — DB'de elle `isAdmin` çevirme adımını tek satırlık bir komuta indirger).

**Kapsam dışı bırakılan**: Admin kullanıcı/rol yönetim ekranı (DB'de elle `isAdmin` çevirme yeterli kabul edildi — tek geliştiricili bir portföy projesinde ikinci admin ihtiyacı düşük; gerekirse Faz G'ye eklenebilir). Gerçek ödeme sağlayıcı entegrasyonu (iyzico vb.) — madde 7'deki temsili kart bunun yerine geçiyor, gerçek entegrasyon istenirse ayrıca ele alınır.

*Not (temsili ödeme kararı üzerine): Madde 7'deki "gerçek kart verisi asla saklanmaz" kararı doğru bir güvenlik tercihi. Tek ek öneri: arayüzde bunun bir demo/temsili ödeme olduğu görsel olarak da açıkça belirtilsin (örn. "Demo Ödeme — gerçek tahsilat yapılmaz" etiketi) — aksi halde ziyaretçi gerçek bir ödeme aldığını sanabilir, bu da profesyonellik/güven açısından ters teper.*

### Faz D — Ek Bulgular (Bağımsız Profesyonel E-Ticaret Denetimi, 2026-07-19)

Canlı kod tabanı (backend + `web/`) satır satır denetlendi. Yukarıdaki Faz D planıyla **çelişmiyor**, onu tamamlıyor — aşağıdakiler o planda henüz yer almayan, "profesyonel bir e-ticaret sitesi" ölçütüyle eksik kalan noktalar:

| # | Bulgu | Konum | Öneri | Efor |
|---|---|---|---|---|
| E1 | ~~**Yasal/güven sayfaları hiç yok**~~ | `web/app/(storefront)/{hakkimizda,iletisim,kargo-takibi,legal/*}` | ✅ Çözüldü — 7 sayfa eklendi (Hakkımızda, İletişim, Kargo Takibi, KVKK, Mesafeli Satış, İptal/İade, Kullanım Şartları) | M |
| E2 | ~~Footer'daki linkler bağlantısız düz metin~~ | `web/components/SiteFooter.tsx` | ✅ Çözüldü — tüm footer linkleri gerçek sayfalara bağlandı, ayrıca "Kurumsal" kolonu eklendi | S |
| E3 | Ana sayfada "%10'a varan indirim" iddiası, arkasında hiçbir mekanizma yok | `web/app/(storefront)/page.tsx:83,87` | ~~Kaldırın ya da gerçek bir kupon sistemine bağlayın~~ → **Faz D madde 11'deki Kampanya sistemiyle çözülüyor**, ayrıca ele alınmayacak | S → M/L (madde 11'e taşındı) |
| E4 | ~~**SEO neredeyse hiç yok**~~ | `web/app/layout.tsx`, `web/app/(storefront)/products/**`, `web/app/sitemap.ts`, `web/app/robots.ts` | ✅ Çözüldü (2026-07-20) — kök `layout.tsx`'e `metadataBase`+title şablonu+OG/Twitter varsayılanları, ürün/kategori/liste sayfalarına `generateMetadata`, ürün sayfasına schema.org `Product`/`Offer` JSON-LD, `sitemap.ts`/`robots.ts` eklendi | M |
| E5 | ~~**Admin sipariş listesi/yönetimi yok**~~ | `web/app/admin/orders/page.tsx` | ✅ Çözüldü — ayrı liste+durum filtresi sayfası, satır bazlı durum dropdown'ı (`OrderStatusSelect`), dashboard'dan link | M |
| E6 | ~~Admin dashboard hesaplamaları JS'te hesaplanıyordu~~ | `controllers/admin.js getDashboard`, `utility/dashboardStats.js` | ✅ Çözüldü (2026-07-20) — gelir/adet hesaplamaları MongoDB aggregation'a taşındı (`$map`/`$sum`/`$group`), sadece bucketing/karşılaştırma (küçük, zaten-toplanmış veri üzerinde) JS'te kalıyor | M |
| E14 | ~~**Dashboard paneli yeniden tasarımı**~~ | `web/app/admin/page.tsx`, `web/components/admin/RevenueChart.tsx` | ✅ Çözüldü (2026-07-20) — önce onaylı bir Artifact taslağı (2 revizyon: gün/hafta/ay/yıl filtresi + "Aktif Kampanya" yerine "Bekleyen Sipariş" KPI'ı), sonra gerçek koda taşındı: trend okçlu KPI kartları, "Dikkat Gerektirenler" paneli (düşük stok + eski bekleyen siparişler), gradyan alan grafiği (Chart.js kaldırıldı), durum chip'li tablolar. Gerçek veriyle Playwright'ta doğrulandı | M/L | — |
| E7 | `/filter/favorites` hâlâ **rastgele 12 ürün** döndürüyor (`$sample`), gerçek/kullanıcıya-bağlı bir favoriler listesi değil — isim yanıltıcı | `controllers/shop.js` `getFavoriteProducts` | Ya adı dürüstçe değiştirin ("Öne Çıkanlar" — zaten madde 2'deki `isFeatured` ile örtüşebilir), ya da gerçek bir wishlist (kullanıcıya bağlı, toggle'lanabilir) inşa edin | S/M |
| E8 | ~~Route-seviyesi `loading.tsx`/`error.tsx` hiç yok~~ | `web/app/(storefront)/{loading,error}.tsx`, `web/app/admin/{loading,error}.tsx` | ✅ Çözüldü (2026-07-20) — storefront ve admin için ayrı ayrı yükleniyor spinner'ı + hata sınırı (bu Next.js sürümü `reset` yerine `unstable_retry` kullanıyor — `node_modules/next/dist/docs` üzerinden doğrulandı) | S |
| E9 | Session cookie'de hâlâ `secure`/`sameSite` yok — Bölüm 1'de flag'lenmiş ama hiç düzeltilmemiş | `app.js:34-40` | `cookie: {maxAge: 3600000, secure: process.env.NODE_ENV==='production', sameSite:'lax'}` | S |
| E10 | `models/order.js`'de birkaç yerde `required: true` yerine yanlışlıkla `require: true` yazılmış — Mongoose sessizce yok sayıyor | `models/order.js` (`orderItemProductSchema` ve `items[]` alt-alanları) | Yazım hatasını düzeltin | S |
| E11 | `utility/database.js` artık **tamamen ölü kod** — uygulama sadece Mongoose kullanıyor, bu dosya hiçbir yerden `require` edilmiyor | `utility/database.js` | Silin | S |
| E12 | ~~Paylaşılan `Button`/`Card` bileşeni yok; aynı uzun Tailwind class string'i çok sayıda dosyada kopyalanmış~~ | `web/components/Button.tsx`, `web/components/admin/AdminButton.tsx`, `web/components/Card.tsx` | ✅ Çözüldü (2026-07-20) — storefront (pill) ve admin (köşeli/uppercase) için **bilerek ayrı** iki `Button` bileşeni + paylaşılan bir `Card` bileşeni eklendi, tüm birebir eşleşen class-string kullanımları (~20 dosya) bunlara taşındı. Class string'i tam eşleşmeyen tek-seferlik durumlar (örn. `ProductFilters.tsx`'in `p-5` dolgusu, kampanya banner'ındaki farklı boyutlu buton) kasıtlı olarak taşınmadı — görsel sapmaya yol açmasın diye | M |
| E13 | ~~ARIA hemen hemen hiç yok, focus-visible sadece birkaç dosyada~~ | `web/components/Button.tsx`, `web/components/admin/AdminButton.tsx`, `web/components/admin/AdminNav.tsx`, `web/components/ProductGrid.tsx`, `web/components/admin/DeleteButton.tsx` | ✅ Çözüldü (2026-07-20) — aktif sıralama linkine ve admin nav'daki aktif sayfaya `aria-current`, paylaşılan `Button`/`AdminButton`'a `focus-visible` outline (E12 sayesinde ~20 dosyaya tek seferde yayıldı), `DeleteButton`'a satır bazlı `aria-label` (hangi öğenin silindiği artık ekran okuyucuda belli), gelir grafiği zaten `role="img"`+`aria-label` ile geliyordu (E14) | S |

**Sıralama önerisi**: E1/E2 ucuz ve Faz D'nin checkout işiyle (madde 7) doğal olarak örtüşüyor — birlikte yapın. E3 artık madde 11'e (Kampanya) taşındı. E9/E10/E11 herhangi bir zamanda küçük, bağımsız düzeltmeler. E4/E6/E8/E12/E13 Faz D'nin ana maddeleri (özellikle checkout, arama, admin sipariş yönetimi) bittikten sonra doğal bir devamı olarak ele alınabilir. **E5 (admin sipariş listesi) kullanıcı tarafından onaylandı ("kesinlikle mantıklı") — madde 5'in bir parçası olarak kesinleşti, tartışmaya kapalı.**

**Portföy bağlamında yeniden değerlendirme** (kullanıcı isteği üzerine, 2026-07-19): E1 (yasal sayfalar) ve E4 (SEO/sitemap) için "bu bir portföy projesi, gerçek müşteri/trafik olmayacak" itirazı haklı bir noktaya değiniyor — ama ikisini de **kalması yönünde** değerlendiriyorum, gerekçe farklı:
- **E1 (KVKK, mesafeli satış, iptal/iade, kullanım şartları)**: Buradaki amaç gerçek hukuki geçerlilik değil — zaten gerçek bir şirket/satış yok. Amaç, bir e-ticaret sitesinin *tam bir örneği* olarak sunulması: bu sayfalar olmadan bir portföy incelemesinde "checkout var ama temel bir mağaza sayfası eksik" izlenimi bırakır. Standart boilerplate metin yeterli, gerçek bir avukata ihtiyaç yok — efor düşük (M yerine pratikte S'e yakın, çünkü içerik şablon metin). Bu yüzden fazlarda kalıyor, ama düşük öncelikli/dolgu işi olarak (E1/E2, checkout'un yanında "bedava" yapılabilir).
- **E4 (SEO — generateMetadata, sitemap, robots, structured data)**: Site gerçekten hiç trafik almasa da, bunlar Next.js e-ticaret geliştirmede standart, beklenen pratikler — bir kod incelemesinde `generateMetadata`'nın hiç kullanılmamış olması "temel bir Next.js e-ticaret kalıbı bilinmiyor" gibi okunur. Efor düşük/orta, kazanç (kod/portföy kalitesi sinyali) yüksek — kalıyor.
- Diğer tüm maddeler (E2, E5-E13) zaten ya doğrudan bug düzeltmesi ya da kod kalitesi/pratik gösterimi niteliğinde — "portföy projesi" çerçevesi bunların önceliğini değiştirmiyor, hepsi kalıyor.

### Faz E — Güvenlik Olgunluğu + Test Altyapısı (portföy için en yüksek etki alanı)

Bir portföy projesinde inceleyen birinin en çok dikkatini çeken şey genelde budur: yeşil CI rozeti, gerçek testler, temiz bir README.

| İş | Efor | Not |
|---|---|---|
| ~~Test stratejisi: **önce entegrasyon testleri** (Supertest + `mongodb-memory-server`)~~ | M, sürekli | ✅ Tamamlandı (2026-07-20) — `tests/` altında 6 dosya, 45 test (auth, shop/sepet/sipariş, admin CRUD+erişim kontrolü, checkout); `app.js` test edilebilirlik için `createApp(connectionString)` fabrika fonksiyonuna ayrıldı, gerçek sunucu başlatma `server.js`'e taşındı |
| ~~İnce bir birim-test katmanı~~ — fiyat/sıralama yardımcı fonksiyonları | S, sürekli | ✅ Tamamlandı — `tests/unit/formatPrice.test.js`, `tests/unit/sortProducts.test.js` |
| ~~Kritik yol için az sayıda Playwright e2e testi~~, Next.js frontend'i üzerinden | M | ✅ Tamamlandı — `web/e2e/critical-path.spec.ts` (gezin→sepete ekle→checkout→sipariş görüntüle), `web/playwright.config.ts` gerçek Express+Next sunucularını başlatıyor |
| ~~`husky` + `lint-staged` pre-commit; CI'ı kurulum→lint→test→build'e genişletme~~ (hem `api` hem `web` için) | S | ✅ Tamamlandı — `.husky/pre-commit` + `lint-staged.config.js` (iki ayrı ESLint config'i doğru cwd ile çağırıyor); `.github/workflows/ci.yml`'e `backend-test`, `web-lint`, `web-build`, `e2e` (MongoDB service container ile) job'ları eklendi |
| ~~`csurf` değişimi~~ | — | ✅ Faz C'de çözüldü: `csurf` tamamen kaldırıldı, `/api/*` custom-header (`X-Requested-With`) kontrolüyle korunuyor |
| ~~CKEditor 4 (EOL) kararı~~ | — | ✅ Faz D'de çözüldü: Tiptap'e geçildi |
| ~~Bağımlılık denetimi süreci: `npm audit`/Dependabot~~ | S | ✅ Tamamlandı (2026-07-20) — backend'de 18→0 açık: `nodemailer` majör sürüme yükseltildi (API sabit kaldı, testler geçti), `npm audit fix` geri kalanı çözdü. Frontend'de tek kalan açık Next.js'in kendi bundled `postcss`'iydi — `npm audit`'in önerdiği "fix" Next'i eski bir canary sürüme düşürmekti (yanlış/anlamsız), bunun yerine `web/package.json`'a `overrides: {postcss: "^8.5.10"}` eklenip Next'i hiç dokunmadan yamalı postcss'e zorlandı → 0 açık. `.github/dependabot.yml` eklendi (backend + web + github-actions, haftalık) |

### Faz F — DevOps

| İş | Efor | Not |
|---|---|---|
| Dockerfile + `docker-compose` (Express API + MongoDB + Next.js) — tek komutla çalıştırma, portföy için iyi bir sinyal | M | |
| `NODE_ENV`'e göre ortam bazlı config modülü (hardcoded URI/port/secret'ı gerçekten ortadan kaldırır) | S/M | |
| `console.log` yerine yapılandırılmış loglama (winston/pino) | S/M | |
| `npm run seed` — kategori/ürün/tek bootstrap-admin oluşturan script, "DB'de elle isAdmin çevir" adımını ortadan kaldırır | S | Yeni geliştirici deneyimini doğrudan iyileştirir. **Kısmen çözüldü** (2026-07-20): `scripts/grant-admin.js` tek bir e-postayı admin yapıyor (`node scripts/grant-admin.js e-posta`) — asıl kapsamlı `npm run seed` (kategori/ürün tohumlama dahil) hâlâ yapılmadı |
| *Düşük öncelik / gerçek production'a geçilirse*: Sentry, S3+CDN, managed MongoDB, KVKK/mesafeli satış uyumluluğu | — | Öğrenme/portföy kapsamında gerekli değil |

### Faz G — Opsiyonel/İleri

- Backend'de kademeli TypeScript geçişi (dosya-dosya, önce Faz B'nin merkezi yardımcı fonksiyonlarından başlayarak) — tamamen isteğe bağlı, CV değeri için. (Frontend zaten Faz C'de TypeScript ile kuruldu.)
- Admin panelinin de Next.js'e taşınması — storefront migrasyonu oturduktan ve gerçek kullanım/geri bildirim toplandıktan sonra değerlendirilebilir; şimdiden kapsamı büyütmeyin.

### Faz H — Admin Yönetimi, Sepet UX, Özellik/Varyant Sistemi (2026-07-20, kullanıcı isteğiyle)

Kullanıcının doğrudan istediği 8+ maddelik geniş bir paket: admin kullanıcı/rol yönetimi, admin nav gruplama, sepet UX'i (adet düzenleme + listeleme ekranından sepete ekleme), üst menüye arama, admin-tanımlı kategori özellikleri + gerçek varyantlar (renk/depolama), log görüntüleme + Excel export, kampanya önceliğine göre ana sayfa banner seçimi, ve ayrı bir "Hesabım" sayfası. Kullanıcı ayrıca **tüm sorgulama işlemlerinin** sunucu tarafında filtrelenmesini istedi (asla "hepsini çek, ön yüzde filtrele" olmasın) — bu ilke aşağıdaki her alt maddede zaten uygulanıyor. Detaylı tasarım kararları (rol modeli, audit/error log ayrımı, `CategoryAttribute`/`ProductVariant` şemaları, varyant-ekseni önerisi) ve açık kararlar için plan belgesi: `C:\Users\mkaragoz\.claude\plans\compiled-wondering-valiant.md`.

**H.1 — Bağımsız, düşük riskli maddeler**: ✅ Tamamlandı (2026-07-20).
- Admin üst menü gruplama (`AdminNav.tsx`) — native `<details>/<summary>` ile "Katalog"/"Satış" dropdown'ları, "Panel" standalone kaldı; "Yönetim" grubu H.2'de eklendi.
- Kampanya önceliği (`priority` alanı) — ana sayfa banner'ı artık admin'in belirlediği önceliğe göre seçiliyor (`pickBestMarketingCampaign`), eşitlikte eski `discountValue` mantığına düşüyor (geriye uyumlu, 2 eski test değişmeden geçti + 2 yeni test eklendi).
- Üst menüye arama (`HeaderSearch.tsx`) — debounced anlık öneri (mevcut `$text` index, `limit(5)`) + Enter ile `/products?q=...`'a submit.
- "Hesabım" sayfası (`/account`) — `CheckoutForm.tsx`'in adres/kart mantığı `AddressManager.tsx`/`PaymentMethodManager.tsx`'e çıkarıldı (checkout hem de yeni sayfa aynı bileşenleri kullanıyor, kod tekrarı gitti).
- **Bulunan ve düzeltilen gerçek bug**: arama kutusu eklenince header'ın flex satırı (`flex-1` kategori nav + sabit-genişlik arama + genişleyen sağ nav) giriş yapıldığında kategori linklerini logonun üzerine bindiren dar bir dikey sütuna sıkıştırıyordu — Playwright ile yakalandı, header iki satıra (üst: logo+arama+hesap linkleri, alt: kategoriler tam genişlik) bölünerek kalıcı olarak çözüldü.
- Doğrulama: 88/88 backend testi, web tsc/lint/build temiz, gerçek tarayıcıda Playwright (arama, hesabım CRUD, checkout regresyon yok, header düzeltmesi 3 genişlikte doğrulandı).

**H.2 — Kullanıcı/Rol Yönetimi + Log Sistemi**: ✅ Tamamlandı (2026-07-21).
- Oturum bayatlığı düzeltildi — `apiIsAdmin.js` artık `req.session.isAdmin` (login anında alınan bayat bir anlık görüntü) yerine her istekte DB'den tazelenen `req.user.isAdmin`'e bakıyor; `postLogin`'deki gereksiz atama satırı kaldırıldı. Regresyon testiyle doğrulandı: bir admin başka bir kullanıcıyı demote ettiğinde, o kullanıcının **hâlâ açık olan** oturumu yeniden giriş yapmadan anında admin erişimini kaybediyor.
- `models/role.js` (yeni) + `User.role` (düz isim, ObjectId ref değil — roller nadiren yeniden adlandırılacağı için kabul edilebilir bir basitleştirme) + `{timestamps:true}`. `admin`/`customer` built-in rolleri `scripts/seed-roles.js` ile bir kere oluşturuldu ve mevcut kullanıcılar `isAdmin` değerine göre geriye dönük eşlendi (dev DB'de çalıştırıldı: 1 admin, 6 customer).
- **Kullanıcı isteğiyle netleşen kural**: bir admin **kendi hesabı üzerinde hiçbir işlem yapamaz** (rol değişikliği dahil), başka admin/kullanıcılar üzerinde yapabilir. Bu tek kural aynı zamanda sistemin hiç yöneticisiz kalamamasını da garanti ediyor (ayrı bir "son admin" sayacına gerek kalmadı — son admin ancak kendi kendini düşürerek 0'a inebilirdi, bu zaten engellendi).
- `/admin/users` (liste/arama/rol atama/sayfalama/Excel export/**kullanıcı silme**) + `/admin/roles` CRUD (built-in roller "(sistem)" etiketiyle düzenlenemez/silinemez, hâlâ kullanıcısı olan bir rol silinemez) + `AuditLog`/`ErrorLog` modelleri (ayrı modeller — farklı alan şekilleri, farklı yazma noktaları) + `/admin/logs` (tip/aktör/işlem/tarih filtresi, tıklanınca detay açan native `<dialog>` modal — projede ilk modal, Excel export). `AdminNav`'a "Yönetim" grubu eklendi (Kullanıcılar/Roller/Loglar).
- **Kullanıcı silme** (2026-07-21, kullanıcı isteğiyle sonradan eklendi): `DELETE /api/admin/users/:userid` — aynı "kendine işlem yapamaz" kuralı burada da geçerli (kendi hesabını silemez, satırda "Sil" butonu bile gösterilmiyor). Silme, o kullanıcının adres/kart kayıtlarını da (`Address`/`PaymentMethod`) öksüz bırakmamak için birlikte siliyor — siparişler zaten kendi `user`/`shippingAddress`/`paymentDisplay` anlık görüntüsünü taşıdığı için (bkz. `models/order.js`) sipariş geçmişi etkilenmiyor. `user.delete` audit log'a yazılıyor.
- `models/campaign.js`'in koşul tipi enum'una `'role'` şema-only olarak eklendi (kampanyaları role göre hedeflemek ileride kolay eklenebilsin diye — `evaluateCampaign.js`'e değerlendirme dalı ve admin UI'da koşul seçeneği bu fazda eklenmedi).
- Doğrulama: 107/107 backend testi (19 yeni test: rol yönetimi + kullanıcı silme + log sistemi), web tsc/lint/build temiz, Playwright critical-path + gerçek admin oturumuyla Yönetim dropdown/kullanıcı-rol değişimi/rol CRUD/log-detay-modal/kullanıcı silme uçtan uca doğrulandı (silme testinde yalnızca bu amaçla oluşturulmuş bir-kullanımlık test hesabı silindi, gerçek kullanıcı verisine dokunulmadı).
- **Not**: rol-değişikliği doğrulaması sırasında gerçek dev DB'de bir kullanıcının ("Mustafa") rolü test amaçlı geçici olarak değiştirilip hemen eski hâline döndürüldü — audit log bunu doğru şekilde kaydetti (bu, projenin canlı verisine dokunan bir test adımıydı; kullanıcıya ayrıca bildirildi).

**H.3 — Sepet UX**: ✅ Tamamlandı (2026-07-21).
- `PUT /api/cart/item` (yeni) — adet ayarlama; `quantity<=0` satırı tamamen kaldırıyor (`deleteCartItem` ile aynı davranış). `postCart` (mevcut +1 endpoint'i) artık opsiyonel bir `quantity` alanı kabul ediyor — listeleme ekranındaki direkt-ekle çağrıları hiç değişmeden aynı +1 davranışında kalıyor, ürün detayındaki adetli ekleme bunu kullanıyor. `GET /api/cart/count` (yeni, hafif — tüm sepeti çekmiyor) header rozeti için.
- `CartQuantityStepper.tsx` (yeni) — sepet sayfasında +/- ve manuel adet girişi; `+` stok sınırında devre dışı kalıyor. **Playwright'ta yakalanan ve düzeltilen gerçek bir tasarım eksikliği**: ilk sürümde `-` butonu adet 1'de devre dışı kalıyordu (kaldırma sadece ayrı "Sil" linkinden mümkündü) — standart sepet davranışına (adet 0'a inince satır kalksın) uymuyordu; `-` butonu artık 1'den 0'a inince satırı tamamen kaldırıyor, manuel "0" girişi de aynı şekilde çalışıyor, "Sil" linki de ayrı bir yol olarak kalıyor.
- `ProductCard.tsx` yeniden yapılandırıldı: dış eleman `<Link>` yerine `<div>` oldu (resim/başlık/açıklama iç bir `<Link>`'te), fiyat + `AddToCartButton` (değişmeden, direkt +1) Link'in dışında kardeş bir satır oldu — nested-interactive-element sorunu ve olay-yayılımı hack'i baştan önlendi.
- `ProductDetailAddToCart.tsx` (yeni) — ürün detayında adet input'u (min 1, max=stok) + "Sepete Ekle", `postCart`'a `quantity` gönderiyor.
- `SiteHeader.tsx`'e sepet ikonu (el yazımı SVG) + adet rozeti (0'dan büyükse görünür, farklı ürün sayısı — toplam adet değil) eklendi.
- Doğrulama: 112/112 backend testi (5 yeni test: çoklu-adet ekleme, adet ayarlama, sepet sayısı), web tsc/lint/build temiz, Playwright critical-path + gerçek tarayıcıda tüm akış (kart→rozet→detay-adetli-ekleme→stepper→checkout regresyon yok) uçtan uca doğrulandı.

**H.4 — Kategori Özellikleri + Varyant Sistemi**: ✅ Tamamlandı (2026-07-21).
- `CategoryAttribute` modeli (yeni) — kategori-bazlı, admin tanımlı özellikler; `valueType: 'select'|'text'`, `isVariantAxis`/`isFilterable` bayrakları tek şemada iki rolü ayırıyor (serbest metin özellikler şema-validator'larıyla varyant ekseni/filtrelenebilir olamıyor). Hangi özelliğin varyant ekseni olacağı (Renk/Depolama gibi) tamamen admin'in kararı — kodda özel isim kontrolü yok.
- `ProductVariant` modeli (yeni) — ürünün her gerçek satın alınabilir kombinasyonu (`attributes[]`) için ayrı `sku`/`stock`/`priceOverride` (mutlak kuruş, delta değil)/`imgUrl`. Kombinasyon tekilliği controller seviyesinde kontrol ediliyor (array-subdocument üzerinde unique index pratik değil). Varyantsız ürünler (kataloğun büyük çoğunluğu) bu koleksiyona hiç dokunmuyor — `Product.hasVariants:false` varsayılan, `Product.stock`/`price`/`sku` otorite kalmaya devam ediyor.
- Denormalizasyon: `Product.attributes`, varyant-ekseni değerlerinin `ProductVariant`'lardan çekilen union'ını da içeriyor (`utility/syncProductVariantDenormalization.js`, her varyant ekleme/düzenleme/silmede çalışıyor) — bu sayede `getProducts` filtrelemesi hâlâ tek bir `Product.find()`, `ProductVariant`'a hiç dokunmuyor, aggregation'a geçilmedi.
- `getProducts`: `?attr[<id>]=<değer>` → her seçili özellik kendi `$elemMatch` koşuluyla bir `$and` dizisine ekleniyor (farklı özellikler arasında VE, aynı özelliğin seçili değerleri arasında VEYA/`$in`) — mandatory "sunucu tarafında filtrele" ilkesiyle tam uyumlu.
- Sepet/sipariş varyant farkındalığı: `User.addToCart`/`getCart`/`setCartItemQuantity`/`deleteCartItem` hem `productId` hem opsiyonel `variantId`'ye göre eşleşiyor; `postOrder`'ın atomik stok-düşüm+rollback döngüsü artık `item.variantId` varsa `ProductVariant`, yoksa `Product` üzerinde çalışıyor (aynı desen, parametrize edildi); sipariş kalemi varyant snapshot'ı (`sku`/`label`) taşıyor ki ürün/varyant sonradan değişse de geçmiş doğru kalsın.
- Admin UI: kategori düzenleme sayfasında "Özellikler" bölümü (`CategoryAttributeManager.tsx`), ürün formunda seçili kategorilerin düz (varyant-olmayan) özellikleri için dinamik input'lar, ürün düzenleme sayfasında "Varyantlar" bölümü (`ProductVariantsForm.tsx`, sadece kategoride varyant-ekseni özellik varsa gösteriliyor).
- Storefront UI: `FilterPanel.tsx` (yeni, sıfır client JS — native checkbox `<form method="GET">`, `ProductFilters` ile hidden-input'larla karşılıklı state koruma) sol filtre paneli olarak `/products` ve `/categories/[id]`'e eklendi; `VariantSelector.tsx` (yeni, client) ürün detayında her varyant-ekseni özelliği ayrı bir buton satırı olarak gösteriyor, tam kombinasyon seçilene kadar "Sepete Ekle" `ProductPurchasePanel.tsx` içinde devre dışı kalıyor; sepet/sipariş sayfaları seçilen varyantın etiketini (`"Renk: Kırmızı"`) satırda gösteriyor.
- Doğrulama: 126/126 backend testi (14 yeni test — özellik/varyant CRUD, denormalizasyon senkronu, kombinasyon tekilliği, varyant-bazlı atomik stok düşümü), web tsc/lint/build temiz, mevcut `critical-path.spec.ts` regresyonsuz + yeni `variant-selector.spec.ts` (Playwright, kendi kendini temizleyen tek-kullanımlık test verisiyle: varyant seçilmeden sepete eklemenin engellendiğini, seçim sonrası akışın çalıştığını ve sepet satırında doğru etiketin göründüğünü uçtan uca doğruluyor).

### Sıralama Notları

- En sıkı bağımlılık: sequelize/mysql2 temizliği ile `validator` bağımlılık eklemesi **aynı commit'te** olmalı (Faz A tuzağı)
- Faz B, Faz D'nin gerçek kapısı — fiyat/stok/sipariş-zamanı olmadan checkout/dashboard düzeltmesi anlamlı şekilde başlayamaz
- **Faz C (frontend migrasyonu) Faz B'den sonra başlamalı** — API'nin baştan temiz sayısal fiyat/stok alanları döndürmesi, yeni frontend'in bunları yeniden string-parse etmesini gerektirmez
- Eksik özellikler (checkout, gerçek arama) doğrudan Faz C'nin Next.js'inde inşa edilsin — Pug'da inşa edip sonra taşımayın
- Test/CI'ı Faz A'da başlatıp her fazda kalınlaştırın — "önce her şeyi yaz, sonra test et" büyük patlamasından kaçının

---

## Bu Raporu Doğrulama

Bölüm 1 + Faz A/B/C için aşağıdaki adımların hepsi ✅ doğrulanmış durumda (bkz. "Durum" bölümü):
1. ~~`npm start` sonrası "Connected to MongoDB" + port mesajı, hatasız~~ ✅
2. ~~`GET /reset-password/:token` (geçersiz token) çökmeden JSON hata dönmeli~~ ✅
3. ~~Kayıt formuna zaten kullanılan e-posta girilince ikinci hesap oluşmamalı~~ ✅
4. ~~Admin dışı rotaya `imgUrl` dosyası POST edilince kaydedilmemeli~~ ✅
5. ~~Sızan kimlik bilgisi git geçmişinden temizlendi~~ ✅
6. ~~`web/` içinde `npm run build`/`eslint` hatasız; tüm sayfalar (admin dahil) API'den veri çekip render ediyor~~ ✅
7. Mobil genişlikte elle kontrol + Lighthouse/axe taraması — **yapılmadı**, Faz D bitince ele alınmalı

Faz D uygulandıkça ek doğrulama (her madde için):
8. Excel içe aktarımda kasıtlı olarak bozuk bir dosya (eksik zorunlu alan, var olmayan kategori/marka) yüklenince: (a) hiçbir ürün yazılmamalı, (b) önizlemede satır satır hata görünmeli
9. Checkout: kayıtlı adres/kart olmadan da akış tamamlanabilmeli (yeni adres/kart ekleme yolu çalışmalı); `Order` belgesinde teslimat adresi snapshot'ı görünmeli
10. Stoksuz bir ürün sepete eklenememeli / sipariş oluşturulamamalı

## Kritik Dosyalar (referans)

- `app.js` — Express giriş noktası: helmet, session, `/api` middleware sırası
- `controllers/`, `routes/`, `middleware/` — JSON API (backend iş mantığı burada yaşıyor, `web/` sadece tüketiyor)
- `models/` — Mongoose şemaları; Faz D'de `brand.js`, `address.js`, `paymentMethod.js` eklenecek, `product.js`'e `sku`/`isNewArrival`/`isFeatured` gelecek
- `web/app/` — Next.js sayfaları: `(storefront)` route grubu müşteri tarafı, `admin/` yönetim paneli
- `web/components/` — paylaşılan React bileşenleri (`ProductCard`, `ProductGrid`, admin formları vb.)
- `web/app/globals.css` — tasarım token'ları (v2 "Showroom" kimliği)

---

**Not**: Bölüm 1, Faz A/B/C tamamlandı (bkz. "Durum"). Faz D sürüyor — bu belgedeki güncel tablo sırasını takip edin, her madde kendi commit'i.
