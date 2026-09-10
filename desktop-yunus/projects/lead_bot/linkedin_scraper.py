import time
import pandas as pd
from playwright.sync_api import sync_playwright
from utils import extract_mobile_number, filter_emails, clean_person_name, is_duplicate, save_to_history

def run_linkedin_scraper(keyword, location=""):
    print(f"\n[LINKEDIN] {keyword} {location} araması Google üzerinden başlatılıyor...")
    
    # Dorking query
    # Hedefimiz profilinde mobil numara olan kişileri bulmak.
    query = f'site:linkedin.com/in "{keyword}" "{location}" "05" OR "0 5"'
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(locale="tr-TR")
        page = context.new_page()

        page.goto("https://www.google.com", timeout=60000)
        
        try:
            page.click("button:has-text('Tümünü kabul et')", timeout=3000)
        except:
            pass

        page.fill("textarea[name='q'], input[name='q']", query)
        page.keyboard.press("Enter")
        
        print("\n⏳ Lütfen Google açıldığında 'Ben Robot Değilim' testi çıkarsa çözün.")
        print("Sayfanın tam yüklenmesi için 90 saniye kadar bekliyorum...")
        try:
            page.wait_for_selector('div#search', timeout=90000)
        except:
            print("Arama sonuçları 90 saniye içinde yüklenmedi. Tarama atlanıyor.")
        
        print("Sayfa yüklendi, sonuçlar taranıyor...")
        
        # Sadece ilk 3 sayfayı tarayalım
        for i in range(3):
            time.sleep(2)
            search_items = page.query_selector_all('div.g')
            
            for item in search_items:
                try:
                    title_elem = item.query_selector('h3')
                    snippet_elem = item.query_selector('div.VwiC3b')
                    link_elem = item.query_selector('a')
                    
                    if not title_elem or not snippet_elem:
                        continue
                        
                    title = title_elem.inner_text()
                    snippet = snippet_elem.inner_text()
                    url = link_elem.get_attribute("href") if link_elem else ""
                    
                    # Bio'daki snippet içerisinden numarayı ayıklıyoruz
                    mobile = extract_mobile_number(snippet)
                    
                    # Eğer mobil numara yoksa, atla (kullanıcı sadece mobil olanları istiyor)
                    if not mobile:
                        continue
                    
                    if is_duplicate(mobile):
                        continue
                        
                    email = filter_emails(snippet)
                    
                    name = title.split("-")[0].strip()
                    name = clean_person_name(name)
                    
                    results.append({
                        "Ad Soyad": name,
                        "Email": email,
                        "No": mobile,
                        "Meslek": keyword
                    })
                except Exception:
                    continue
                    
            # Sonraki sayfa
            try:
                next_btn = page.query_selector("a#pnnext")
                if next_btn:
                    next_btn.click()
                    time.sleep(3)
                else:
                    break
            except:
                break
                
        browser.close()

    if results:
        print("\nVeriler kaydediliyor...")
        df = pd.DataFrame(results)
        df = df.drop_duplicates(subset=['No'])
        
        df = df[["Ad Soyad", "Email", "No", "Meslek"]]
        save_to_history(df['No'].tolist())
        
        filename = f"leads_linkedin_{keyword.replace(' ', '_')}.xlsx"
        df.to_excel(filename, index=False)
        print(f"Başarılı! LinkedIn üzerinden {len(df)} yeni kişi bulundu ve {filename} dosyasına kaydedildi.")
    else:
        print("Yeni bir kişi bulunamadı (ya da bulunanlar daha önce çekilmiş).")
