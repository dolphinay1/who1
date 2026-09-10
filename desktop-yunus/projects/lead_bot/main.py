import os
from maps_scraper import run_maps_scraper
from linkedin_scraper import run_linkedin_scraper


def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    while True:
        clear_screen()
        print("=" * 60)
        print("🚀 GELİŞMİŞ B2B LEAD TOPLAMA BOTU (MOBİL NUMARA ODAKLI)")
        print("=" * 60)
        print("Bu sistem sadece '05xx' ile başlayan mobil numaraları çeker.")
        print("444, 212, 0850 vb. numaralar otomatik olarak filtrelenir.")
        print("-" * 60)
        print("1. [GOOGLE MAPS] İşletmeleri Tara (Kesin Mobil Filtreli)")
        print("2. [LINKEDIN] Karar Vericileri Tara (Doğrudan Şahıs)")
        print("3. [HEPSİ] Aynı Anda Tüm Kanalları Tara")
        print("0. Çıkış")
        print("=" * 60)
        
        choice = input("Lütfen bir seçenek girin (0-3): ").strip()
        
        if choice == "0":
            print("Çıkış yapılıyor...")
            break
            
        if choice not in ["1", "2", "3"]:
            print("Geçersiz seçenek. Lütfen tekrar deneyin.")
            input("Devam etmek için Enter'a basın...")
            continue
            
        keyword = input("\nAnahtar Kelime / Meslek (Örn: Avukat, Kurucu, Diş Hekimi): ").strip()
        location = input("Şehir / Bölge (İsteğe Bağlı, boş bırakabilirsiniz): ").strip()
        
        if not keyword:
            print("Anahtar kelime boş bırakılamaz!")
            input("Devam etmek için Enter'a basın...")
            continue
            
        if choice == "1":
            run_maps_scraper(keyword, location)
        elif choice == "2":
            run_linkedin_scraper(keyword, location)
        elif choice == "3":
            print("\n🚨 TÜM KANALLAR TARANIYOR (Bu işlem uzun sürebilir!) 🚨")
            run_linkedin_scraper(keyword, location)
            run_maps_scraper(keyword, location)
            print("\n🎉 TÜM TARAMALAR TAMAMLANDI!")
            
        input("\nİşlem tamamlandı. Ana menüye dönmek için Enter'a basın...")

if __name__ == "__main__":
    main()
