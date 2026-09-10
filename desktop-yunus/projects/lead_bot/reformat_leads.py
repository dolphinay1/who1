import os
import pandas as pd
from utils import clean_person_name, extract_mobile_number, save_to_history

def reformat_existing_files():
    files = [f for f in os.listdir('.') if f.endswith('.xlsx') and f.startswith('leads_')]
    if not files:
        print("Mevcut excel dosyası bulunamadı.")
        return
        
    for file in files:
        print(f"İşleniyor: {file}")
        try:
            df = pd.read_excel(file)
            
            # Eski kolon isimlerini yenilere eşitle
            col_map = {
                "İsim Soyisim": "Ad Soyad",
                "İsim/İşletme": "Ad Soyad",
                "Mail": "Email"
            }
            df = df.rename(columns=col_map)
            
            if "Ad Soyad" not in df.columns:
                continue
                
            # İsimleri temizle (Hukuk Bürosu vb. sil)
            df["Ad Soyad"] = df["Ad Soyad"].apply(lambda x: clean_person_name(str(x)) if pd.notna(x) else "")
            
            # Numaraları temizle ve sadece mobilleri bırak
            if "No" in df.columns:
                df["No"] = df["No"].apply(lambda x: extract_mobile_number(str(x)) if pd.notna(x) else "")
                
            # Sadece mobil numarası olanları tut
            df = df[df["No"] != ""]
            
            # Kendi içinde çiftleri sil
            df = df.drop_duplicates(subset=["No"])
            
            # Kolonları eksikse tamamla ve sırala
            for col in ["Ad Soyad", "Email", "No", "Meslek"]:
                if col not in df.columns:
                    df[col] = ""
                    
            df = df[["Ad Soyad", "Email", "No", "Meslek"]]
            
            # Geçmiş (history) dosyasına kaydet
            save_to_history(df['No'].tolist())
            
            # Dosyanın üzerine yaz
            df.to_excel(file, index=False)
            print(f"Guncellendi: {file}")
            
        except Exception as e:
            print(f"{file} islenirken hata olustu: {e}")

if __name__ == '__main__':
    reformat_existing_files()
