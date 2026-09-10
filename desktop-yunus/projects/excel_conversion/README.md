# Excel Conversion Utility

[![Language](https://img.shields.io/badge/Language-Python-blue)](#)
[![Status](https://img.shields.io/badge/Status-Completed-success)](#)

A python data parser utility to format raw text logs of contact leads, clean duplicate values, parse international phone numbers, and export them into structured Excel worksheets.

![Showcase](./showcase.png)

---

## 🇹🇷 Türkçe Açıklama

### Özellikler
- **Ham Metin Ayrıştırma**: Düzensiz e-posta, telefon ve isim listelerini regex ile tarar ve ayıklar.
- **Uluslararası Telefon Formatlama**: Telefon numaralarını tespit ederek standart `+90` (veya ilgili ülke kodu) formatına çevirir.
- **Excel Çıktısı**: Ayrıştırılan verileri `leads.xlsx` adında, sütunları düzenlenmiş Excel dosyası olarak kaydeder.
- **Tekilleştirme**: Aynı telefon numarasına ait mükerrer kayıtları temizler.

### Kurulum
```bash
pip install pandas openpyxl
```

### Kullanım
```bash
python data_to_excel.py
```

---

## 🇬🇧 English Description

### Features
- **Raw Text Parsing**: Extracts emails, phone numbers, and names from unstructured text input using regex.
- **Phone Formatting**: Standardizes extracted phone numbers to international formats (e.g. `+90...`).
- **Excel Output**: Automatically writes cleaned data rows into formatted `leads.xlsx` spreadsheet files.
- **De-duplication**: Filters out duplicate entries based on unique phone numbers.

### Installation
```bash
pip install pandas openpyxl
```

### Usage
```bash
python data_to_excel.py
```
