import pandas as pd
import re
import os

def parse_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to match Name followed by a 12-digit number starting with 90
    # The name can contain Turkish characters, spaces, parentheses, dots
    pattern = r'([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\(\)./&-]+?)\s+(90\d{10})'
    
    matches = re.findall(pattern, content)
    
    data = []
    for name, phone in matches:
        # Clean up name: remove extra whitespace and leading/trailing whitespace
        clean_name = ' '.join(name.strip().split())
        if clean_name:
            data.append({
                'mail': 'test@gmail.com',
                'telefon': phone,
                'ad soyad': clean_name,
                'kaynak': 'YRN'
            })
    
    return data

def save_to_excel(data, output_path):
    df = pd.DataFrame(data)
    # Reorder columns as requested: mail - telefon - ad soyad - kaynak
    df = df[['mail', 'telefon', 'ad soyad', 'kaynak']]
    df.to_excel(output_path, index=False)
    print(f"Successfully saved {len(df)} records to {output_path}")

if __name__ == "__main__":
    base_path = r"C:\Users\1111\.gemini\antigravity\scratch\excel_conversion"
    input_file = os.path.join(base_path, "data.txt")
    output_file = os.path.join(base_path, "leads.xlsx")
    
    records = parse_data(input_file)
    if records:
        save_to_excel(records, output_file)
    else:
        print("No records found.")
