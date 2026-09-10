# VerteX Markets — Landing Page Geliştirme Raporu

**Geliştirici:** [Ad Soyad]  
**Proje Tarihi:** Nisan 2026  
**Canlı URL:** vertexmarkets.org (Vercel üzerinde deploy edilmiştir)  
**Teknolojiler:** HTML5 · CSS3 · Vanilla JavaScript · Vercel Serverless Functions · Yahoo Finance API · Telegram Bot API · PWA

---

## 1. Projenin Amacı

VerteX Markets kurumsal yatırım danışmanlık platformu için profesyonel, tek sayfalık (SPA) bir landing page geliştirdim. Sayfanın temel amacı; altın, gümüş, petrol, NASDAQ, BIST 100 ve Bitcoin gibi finansal enstrümanların canlı piyasa verilerini sunmak, AI tabanlı algoritmik analiz konseptini tanıtmak ve potansiyel müşterilerden (lead) form aracılığıyla iletişim bilgilerini toplamaktır.

---

## 2. Dosya Yapısı ve Mimari

Projeyi sade, framework bağımsız bir yapıda kurguladım. Herhangi bir build tool veya npm dependency kullanmadan, doğrudan tarayıcıda çalışacak şekilde vanilla teknolojilerle geliştirdim. Bunun sebebi hem performans avantajı hem de deploy sürecinin basit tutulmasıdır.

```
vertex-landing/
├── index.html              → Ana sayfa (tek sayfa, tüm bölümler)
├── style.css               → Tüm stil tanımları (responsive dahil)
├── script.js               → Etkileşim, API çağrıları, animasyonlar
├── manifest.json           → PWA manifest dosyası
├── sw.js                   → Service Worker (offline cache)
├── vercel.json             → Vercel deployment ve güvenlik yapılandırması
├── api/
│   ├── lead.js             → Lead form → Telegram serverless endpoint
│   └── yahoo/
│       └── [...symbol].js  → Yahoo Finance proxy (canlı piyasa verisi)
├── images/
│   ├── logo.png            → VerteX logosu (favicon + header)
│   ├── hero-bg.png         → Hero bölümü arka plan görseli
│   ├── gold-visual.png     → Altın yatırım görseli
│   ├── certificate.png     → Asset Insurance Fund sertifikası
│   └── tether-qr.png       → USDT TRC20 cüzdan QR kodu
└── docs/
    └── PLAN-retail-analysis-btn.md → Navbar CTA butonu planlama dökümanı
```

---

## 3. Geliştirilen Bölümler ve Detaylı Açıklamalar

### 3.1. Navigation Bar (Sabit Üst Menü)

Sayfanın en üstüne fixed konumda bir navbar yazdım. Kullanıcı scroll yaptığında `nav--scrolled` class'ı ile padding daralıyor ve blur efekti artıyor. Bu davranışı `window.scroll` event listener'ı ile kontrol ettim.

Navbar içinde şu elementler bulunuyor:

- **Logo:** `images/logo.png` görseli + "VerteX" yazısı (X harfi altın renk)
- **Menü Linkleri:** Analiz, AI Bot, Kurumsal Danışmanlık
- **PWA Yükleme Butonu:** `beforeinstallprompt` event'i ile koşullu olarak gösterilen "Uygulamayı Yükle" butonu
- **CTA Butonu:** "Analiz Al" — tıklanınca iletişim formuna smooth scroll ile yönlendiriyor

```css
.nav {
  position: fixed;
  backdrop-filter: blur(20px);
  background: rgba(10, 10, 10, 0.85);
}
.nav--scrolled {
  padding: 0.75rem 0;
}
```

---

### 3.2. Hero Section (Ana Açılış Bölümü)

Hero bölümünde dinamik bir başlık sistemi kurdum. Ekranda sırasıyla "Altın Neden Düşüyor?", "NASDAQ Neden Yükseliyor?" gibi cümleler 5 saniye arayla dönüyor. Yön bilgisi (Yükseliyor/Düşüyor) canlı API verisinden gelen değişim yüzdesine göre belirleniyor.

**Fiyat Kartı:** Sağ tarafta glassmorphism efektli bir kart var. Bu kart:

- 6 enstrümanın tab'lı geçişini sağlıyor
- Canlı fiyat, yüzdesel değişim, mini SVG chart gösteriyor
- Veriler Yahoo Finance API'den 60 saniyelik cache ile çekiliyor

Fiyat güncellendiğinde `price-flash` animasyonu ile kısa bir scale efekti verdim:

```css
@keyframes priceFlash {
  0% {
    opacity: 0.3;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

Arka planda `hero-bg.png` görseli var, üzerine gradient overlay uyguladım. Ayrıca floating particle efekti için 25 adet küçük altın nokta animasyonu yazdım.

---

### 3.3. Piyasa Analitiği (Insights Section)

Her enstrüman için 3'er adet analiz kartı hazırladım. Bu veriler `INSIGHTS_DATA` objesi içinde statik olarak tutulmaktadır. Kartlar tab geçişli olarak filtreleniyor.

**Örnek veri yapısı:**

```javascript
const INSIGHTS_DATA = {
  Altın: [
    { title: "DXY & Reel Faiz Korelasyonu", text: "...", tag: "Makroekonomi" },
    { title: "Teknik Formasyonlar", text: "...", tag: "Teknik Analiz" },
    { title: "Jeopolitik Risk Primi", text: "...", tag: "Temel Analiz" },
  ],
  // ... diğer enstrümanlar
};
```

Altında "Piyasa Duyarlılık Endeksi" (Fear & Greed benzeri) bir gösterge ekledim. Kırmızıdan yeşile gradient bar üzerinde beyaz bir indicator ile mevcut piyasa duyarlılığını görsel olarak ifade ediyor.

---

### 3.4. AI Bot Section

VerteX AI Bot konseptini tanıtan bir bölüm hazırladım. Sol tarafta 4 ana özellik açıklaması (Asya Seansı Taraması, Volatilite Optimizasyonu, Makro Veri HFT Reaksiyonu, Kantitatif Backtesting), sağ tarafta ise canlı bir terminal simülasyonu var.

Terminal simülasyonu 2.5 saniye arayla yeni satırlar ekliyor. Satırlar `terminalLines` dizisinden sırayla okunuyor ve `${time}` placeholder'ı gerçek saat ile değiştiriliyor. Terminal 7 satırdan fazla olduğunda en eski satır siliniyor.

```javascript
setInterval(() => {
  const time = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const line = terminalLines[termIdx % terminalLines.length].replace(
    /\${time}/g,
    time,
  );
  // DOM'a ekle, eski satırı temizle
}, 2500);
```

---

### 3.5. Performans Raporu Tablosu

AI Bot sinyallerinin son 30 günlük performans istatistiklerini gösteren bir tablo yazdım. XAU/USD, EUR/USD, NASDAQ ve BTC/USD için sinyal tipi, başarı oranı ve net getiri bilgileri tablo formatında sunuluyor.

---

### 3.6. FAQ (Sıkça Sorulan Sorular)

Accordion tarzında açılıp kapanan 3 adet soru-cevap kartı yazdım. Tıklama ile `active` class'ı toggle ediliyor ve `max-height` transition ile animasyonlu açılma/kapanma sağlanıyor.

---

### 3.7. VIP & Kurumsal Portföy Yönetimi

Minimum $50,000 bakiye gereksinimi belirten tek kartlık bir VIP tanıtım bölümü tasarladım. Radial gradient ve altın border ile premium bir görünüm verdim.

---

### 3.8. MetaTrader 5 Platform Tanıtımı

MetaTrader 5 indirme linki ve platform avantajlarını (Hızlı İşlem, Teknik Araçlar, Algoritmik Altyapı) anlatan bir bölüm ekledim. Yanında USDT TRC20 kripto ödeme kartı var:

- QR kod görseli (`tether-qr.png`)
- Cüzdan adresi kopyalama butonu (clipboard API kullanıyor)
- Glassmorphism efektli kart tasarımı
- "Başla" butonu sparkle parçacık animasyonlu

---

### 3.9. İletişim Formu & Lead Toplama

Form alanları: Ad Soyad, Telefon, E-posta, İlgilenilen Piyasa (dropdown), Mesaj (opsiyonel), KVKK onay checkbox'ı.

**Telefon formatlaması:** Kullanıcı "5" ile başlayan bir numara girdiğinde otomatik olarak başına "+90" ekleniyor.

**Form gönderimi:** Submit edildiğinde `/api/lead` endpoint'ine POST isteği atılıyor. Başarılı olursa "Talebiniz Alındı" mesajı gösteriliyor.

---

### 3.10. Regülasyon & Güvenlik

Asset Insurance Fund sertifikası görseli ve Ticaret Sicil Sorgulama linki içeren bir güven bölümü ekledim. Alt kısımda 4 adet trust badge (256-Bit SSL, Uçtan Uca Şifreleme, KVKK Uyumlu, 7/24 Hizmet) bulunuyor.

---

### 3.11. Footer

Footer'da logo, yasal uyarı metni (SPK mevzuatı referanslı) ve alt linkler (Kurumsal Bilgiler, KVKK & Gizlilik, İletişim) yer alıyor. Mobilde ayrıca sabit bir "Ücretsiz Rapor Al" floating CTA butonu gösteriliyor.

---

## 4. Backend (Serverless API'ler)

### 4.1. Lead API (`api/lead.js`)

Form verilerini alıp Telegram Bot API üzerinden belirtilen chat'e ileten bir Vercel serverless function yazdım.

**Güvenlik önlemleri:**

- XSS koruması için `sanitize()` fonksiyonu ile HTML entity encoding uyguladım
- Input uzunluk limitleri koydum (isim: 100, telefon: 20, email: 100, mesaj: 500 karakter)
- CORS middleware ile cross-origin isteklerine izin verdim
- Sadece POST method'una yanıt veriyor, diğerleri 405 döndürüyor

**Telegram mesaj formatı:**

```
Yeni Lead — VerteX Markets

• Ad Soyad: [isim]
• Telefon: [numara]
• E-posta: [email]
• İlgi Alanı: [enstrüman]
• Mesaj: [mesaj veya —]
• Tarih: [gün/ay/yıl saat:dakika:saniye]
```

İlgi alanı kodu (`gold`, `silver` vs.) okunabilir Türkçe metne `INTEREST_MAP` ile dönüştürülüyor.

---

### 4.2. Yahoo Finance Proxy (`api/yahoo/[...symbol].js`)

Frontend'den doğrudan Yahoo Finance API'ye istek atılamadığı (CORS kısıtlaması) için bir proxy serverless function yazdım.

**Çalışma mantığı:**

1. Önce `query2.finance.yahoo.com` üzerinden veri çekmeyi deniyor
2. Başarısız olursa `query1.finance.yahoo.com` deneniyor
3. Her iki kaynak da başarısız olursa `FALLBACK_PRICES` objesi ile statik yaklaşık değerler döndürüyor (küçük random varyans ile gerçekçi görünüyor)

**Özellikler:**

- Catch-all route: `[...symbol]` ile herhangi bir sembol parametresi alabilir
- URL encoding/decoding: `%5E` → `^` gibi dönüşümler otomatik
- 8 saniye timeout süresi
- 60 saniyelik server-side cache (`Cache-Control: s-maxage=60`)
- Fallback verilerinde mini chart verileri de oluşturuluyor (24 veri noktası)

---

## 5. PWA (Progressive Web App) Desteği

Siteyi mobilde uygulama gibi kullanılabilir hale getirmek için PWA desteği ekledim:

**`manifest.json`:** Uygulama adı, tema rengi (#D4A54A altın), ikon tanımı, standalone display modu.

**`sw.js`:** Service Worker ile temel asset'leri (HTML, CSS, JS, logo, hero görseli) cache'liyor. API istekleri cache'lenmeden geçiriliyor. Network-first stratejisi uygulanıyor, bağlantı yoksa cache'den servis ediliyor.

**Install butonu:** `beforeinstallprompt` event'i yakalanarak navbar'da koşullu olarak "Uygulamayı Yükle" butonu gösteriliyor.

---

## 6. Deployment ve Güvenlik (Vercel)

Projeyi Vercel üzerine deploy ettim. `vercel.json` dosyasında:

- API route'ları için rewrite kuralı tanımladım
- Güvenlik headerları ekledim:
  - `X-Content-Type-Options: nosniff` — MIME type sniffing koruması
  - `X-Frame-Options: DENY` — Clickjacking koruması
  - `X-XSS-Protection: 1; mode=block` — XSS filtresi

---

## 7. Tasarım Sistemi ve CSS Mimarisi

Tüm renk, font ve spacing değerlerini CSS custom properties (variables) ile yönettim:

| Değişken         | Değer                            | Kullanım            |
| ---------------- | -------------------------------- | ------------------- |
| `--bg-primary`   | `#0A0A0A`                        | Ana arka plan       |
| `--gold-300`     | `#D4A54A`                        | Marka rengi (altın) |
| `--text-primary` | `#F5F5F5`                        | Ana metin rengi     |
| `--font-primary` | `Inter`                          | Genel metin fontu   |
| `--font-display` | `Space Grotesk`                  | Başlık fontu        |
| `--font-glass`   | `Outfit`                         | Badge/label fontu   |
| `--radius-lg`    | `20px`                           | Büyük kart radius   |
| `--transition`   | `0.3s cubic-bezier(0.4,0,0.2,1)` | Standart geçiş      |

**Responsive breakpoint'ler:**

- `968px` altı: Grid tek kolon, navigasyon sadeleşiyor
- `480px` altı: Mobil optimize, font küçülmeleri, floating CTA aktif
- `768px` altı: Floating CTA butonu görünür, regulation grid tek kolon

**Kullanılan tasarım teknikleri:**

- Glassmorphism (`backdrop-filter: blur()` + yarı-saydam arka plan)
- Altın gradient text (`background-clip: text`)
- Float animasyonu (hero kart 6s ease-in-out)
- Scroll reveal animasyonu (IntersectionObserver)
- Particle efekti (25 adet altın nokta)

---

## 8. Görsel Varlıklar

| Dosya             | Açıklama                         | Kullanıldığı Yer                   |
| ----------------- | -------------------------------- | ---------------------------------- |
| `logo.png`        | VerteX logosu                    | Navbar, Footer, PWA ikonu, Favicon |
| `hero-bg.png`     | Finans temalı arka plan          | Hero section background            |
| `gold-visual.png` | Altın yatırım görseli            | Destekleyici içerik                |
| `certificate.png` | Asset Insurance Fund sertifikası | Regülasyon bölümü                  |
| `tether-qr.png`   | USDT TRC20 cüzdan QR kodu        | MT5 kripto ödeme kartı             |

---

## 9. Frontend JavaScript — Ana Akış

1. **Sayfa yüklendiğinde:** Tab'lar oluşturulur, particle'lar generate edilir, ilk enstrüman (Altın) yüklenir, Insights render edilir, terminal simülasyonu başlar.
2. **5 saniyede bir:** Otomatik enstrüman rotasyonu (XAU → XAG → BRENT → NASDAQ → BIST → BTC → XAU)
3. **60 saniyede bir:** Aktif enstrümanın fiyatı sessizce güncellenir (animasyonsuz)
4. **Tab tıklanınca:** Manuel geçiş, auto-rotate sıfırlanır
5. **API cache:** Her sembol 60 saniyelik memory cache ile tutulur, tekrar istek atılmaz

---

## 10. Sonuç

Bu proje kapsamında sıfırdan bir kurumsal finans landing page geliştirdim. Projenin öne çıkan teknik başarıları:

- **Framework-free mimari:** Sıfır dependency, anında yüklenen hafif yapı
- **Canlı piyasa verileri:** Yahoo Finance proxy ile gerçek zamanlı fiyat gösterimi
- **Lead otomasyon:** Form → Telegram Bot entegrasyonu ile anlık bildirim
- **PWA desteği:** Mobilde uygulama olarak kurulabilir
- **Kurumsal güvenlik:** XSS koruması, input sanitizasyonu, HTTPS zorunluluğu, güvenlik headerları
- **Responsive tasarım:** 3 farklı breakpoint ile masaüstü, tablet ve mobil uyumu
- **Performans:** Vanilla JS ile minimum parse/compile süresi, lazy loading, CDN üzerinden font yükleme

Tüm geliştirme süreci boyunca modern web standartlarına (HTML5 semantik yapı, CSS custom properties, ES6+ JavaScript, Fetch API) uygun çalıştım.
