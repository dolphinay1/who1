# Tea & Sugar — Sports & Gaming Backoffice

[![Language](https://img.shields.io/badge/Language-Node.js%20%7C%20Express-green)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)](#)
[![Status](https://img.shields.io/badge/Status-Completed-success)](#)

A comprehensive administrative backoffice system and gaming portal written in Node.js (Express) and PostgreSQL, featuring live sports data integration, promotions, and slot machine simulators.

![Showcase](./showcase.png)

---

## 🇹🇷 Türkçe Açıklama

### Özellikler
- **Backoffice Yönetim Paneli**: Kullanıcı bakiyeleri, kuponlar, klanlar ve hesap hareketleri için gelişmiş veri panoları.
- **Canlı Spor Entegrasyonları**: Canlı maç skorları ve oranları için API entegrasyonları.
- **Promosyon & Kampanya Modülleri**: Kullanıcılara özel bonus kodları ve ödül havuzları.
- **Güvenli JWT Kimlik Doğrulaması**: Admin ve üye rolleri için oturum ve yetki kontrolü.
- **SQL Şemaları**: PostgreSql için optimize edilmiş ilişkisel veri şemaları (Faz 1 & Faz 2).

### Kurulum
1. Gerekli paketleri kurun:
   ```bash
   npm install
   ```
2. `.env` dosyasını yapılandırın (Şablona `.env.example` dosyasından bakabilirsiniz).
3. Veri tabanını kurun ve admin hesabını oluşturun:
   ```bash
   node init_db_pg.js
   node create_admin.js
   ```

### Çalıştırma
```bash
npm start
```

---

## 🇬🇧 English Description

### Features
- **Admin Management Panel**: Full control dashboards to manage user wallets, coupon matches, clans, and transaction logs.
- **Live Sports Data Integration**: Seamless connection to match lists and odd variations using API services.
- **Bonus & Promotional Workflows**: Special codes and loyalty rewards automation.
- **Secure JWT Auth**: Session validation with roles for Admins and Standard Users.
- **Relational SQL Database**: Advanced structured tables (Phase 1 & 2 schemas) optimized for PostgreSQL.

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example`.
3. Initialize the database and seed admin account:
   ```bash
   node init_db_pg.js
   node create_admin.js
   ```

### Run
```bash
npm start
```
