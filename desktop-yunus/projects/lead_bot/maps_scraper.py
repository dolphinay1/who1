import time
import pandas as pd
from playwright.sync_api import sync_playwright
from utils import extract_mobile_number, filter_emails, clean_person_name, is_duplicate, save_to_history

def run_maps_scraper(keyword, location=""):
    search_query = f"{keyword} {location}".strip()
    print(f"\n[GOOGLE MAPS] '{search_query}' için arama başlatılıyor...")
    
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(locale="tr-TR")
        page = context.new_page()

        page.goto("https://www.google.com/maps", timeout=60000)
        
        try:
            page.click("button:has-text('Tümünü kabul et'), button:has-text('Kabul ediyorum')", timeout=3000)
        except:
            pass

        try:
            page.wait_for_selector("input#searchboxinput, input[name='q'], input#search", timeout=15000)
            page.fill("input#searchboxinput, input[name='q'], input#search", search_query)
            page.keyboard.press("Enter")
        except Exception as e:
            print(f"\nArama kutusu otomatik doldurulamadı! Lütfen açılan tarayıcıda aramanızı kendiniz yapın.")
            print("Bot sonuçları yakalamak için bekliyor...")
        
        print("\n⏳ Sonuçların listelenmesi bekleniyor. Eğer Google Captcha sorarsa çözmek için 90 saniyeniz var...")
        
        try:
            page.wait_for_selector('div[role="feed"]', timeout=90000)
        except Exception:
            print("90 saniye doldu, bot yine de ekrandaki veriyi okumayı deneyecek...")
            pass
            
        previous_count = 0
        scroll_attempts = 0
        max_scroll_attempts = 15
        
        while scroll_attempts < max_scroll_attempts:
            items = page.query_selector_all('div[role="feed"] > div > div > a')
            current_count = len(items)
            
            if current_count > previous_count:
                previous_count = current_count
                scroll_attempts = 0
            else:
                scroll_attempts += 1
                
            if page.locator("text=Sonuçların sonuna ulaştınız").is_visible() or page.locator("text=You've reached the end of the list").is_visible():
                break
                
            if items:
                try:
                    items[-1].focus()
                    page.keyboard.press("PageDown")
                except:
                    pass
            
            time.sleep(1.5)
            
        links = page.query_selector_all('div[role="feed"] > div > div > a')
        place_urls = []
        for link in links:
            href = link.get_attribute("href")
            if href and "/maps/place/" in href:
                place_urls.append(href)
                
        place_urls = list(dict.fromkeys(place_urls))
        print(f"Toplam {len(place_urls)} işletme bulundu. Analiz ediliyor...")
        
        for index, url in enumerate(place_urls):
            print(f"[{index+1}/{len(place_urls)}] İşletme kontrol ediliyor...")
            try:
                page.goto(url, timeout=30000)
                time.sleep(2)
                
                phone = ""
                try:
                    phone_elem = page.query_selector("button[data-item-id^='phone:tel:']")
                    if phone_elem:
                        phone_div = phone_elem.query_selector("div.Io6YTe")
                        phone = phone_div.inner_text() if phone_div else ""
                except:
                    pass
                
                # FİLTRELEME: Sadece mobil numara ise al, yoksa direkt atla!
                mobile_no = extract_mobile_number(phone)
                if not mobile_no:
                    print("  -> Sabit hat veya numara yok (Eleniyor)")
                    continue
                
                if is_duplicate(mobile_no):
                    print(f"  -> Bu numara daha önce çekilmiş ({mobile_no}), atlanıyor.")
                    continue
                    
                name = ""
                try:
                    name_elem = page.query_selector("h1")
                    raw_name = name_elem.inner_text() if name_elem else ""
                    name = clean_person_name(raw_name)
                except:
                    pass
                    
                profession = ""
                try:
                    prof_elem = page.query_selector("button.DkEaL")
                    profession = prof_elem.inner_text() if prof_elem else ""
                except:
                    pass
                    
                website = ""
                try:
                    website_elem = page.query_selector("a[data-item-id='authority']")
                    if website_elem:
                        website = website_elem.get_attribute("href")
                except:
                    pass
                
                email = ""
                if website:
                    print(f"  -> Mobil No Bulundu ({mobile_no}). Web sitesi taratılıyor...")
                    # For simplicity in maps scraper, we don't fully scrape website again here unless we want to.
                    # We will reuse the website request logic from the first scraper.
                    import requests
                    from bs4 import BeautifulSoup
                    try:
                        resp = requests.get(website, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        email = filter_emails(soup.get_text())
                    except:
                        pass
                else:
                    print(f"  -> Mobil No Bulundu ({mobile_no}). Web sitesi yok.")
                    
                results.append({
                    "Ad Soyad": name,
                    "Email": email,
                    "No": mobile_no,
                    "Meslek": profession
                })
                
            except Exception as e:
                continue

        browser.close()

    if results:
        df = pd.DataFrame(results)
        df = df.drop_duplicates(subset=['No'])
        
        df = df[["Ad Soyad", "Email", "No", "Meslek"]]
        save_to_history(df['No'].tolist())
        
        filename = f"leads_maps_{search_query.replace(' ', '_')}.xlsx"
        df.to_excel(filename, index=False)
        print(f"Başarılı! Yeni ve temizlenmiş {len(df)} adet kayıt {filename} dosyasına kaydedildi.")
    else:
        print("Yeni bir kişi bulunamadı (ya da bulunanlar daha önce çekilmiş).")
