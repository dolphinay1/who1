# Mimari Yapı (Modül Haritası)

Bu belge, projedeki modüllerin sınırlarını, sorumluluklarını ve bağımlılık haritasını açıklamaktadır.

## Modüller

### 1. `intro` (Giriş Ekranı)
- **Konum:** `src/intro/`
- **Sorumluluk:** Kullanıcıyı karşılayan WebGL yağmur animasyonunu, arka plan sesini ve Liquid Glass Switcher butonlarını yönetir.
- **Bağımlılıklar:** Dış kütüphane olan `raindrops.js` kütüphanesini dinamik olarak yükler.

### 2. `space` (Ana Ekran)
- **Konum:** `src/space/`
- **Sorumluluk:** Giriş ekranı geçildikten sonra tam ekran olarak çalışan WebGL Space Anomaly gölgelendirici (shader) canvasını yönetir.
- **Bağımlılıklar:** Bağımsızdır.

### 3. Core Router (Çekirdek Yönlendirici)
- **Konum:** `src/script.js`
- **Sorumluluk:** `intro` modülünden gelen tetiklemeyi dinler, `intro` kaynaklarını bellekten temizler ve `space` modülünü başlatarak viewports geçişini yönetir.
