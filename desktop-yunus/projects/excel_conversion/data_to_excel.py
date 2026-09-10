import pandas as pd
import re

raw_data = """test@gmail.com - 5051234567 - Ornek Kullanici - RYL
test@gmail.com - 5329876543 - Diger Kullanici - RYL"""

def format_phone(phone):
    phone = re.sub(r'\D', '', phone) # Remove non-digits
    if phone.startswith('90'):
        return '+' + phone
    elif phone.startswith('5'):
        return '+90' + phone
    else:
        return phone # Fallback for unexpected formats

lines = raw_data.strip().split('\n')
data_rows = []

for line in lines:
    parts = [p.strip() for p in line.split(' - ')]
    
    # Handle different segment counts
    if len(parts) == 4:
        email, phone, name, source = parts
    elif len(parts) == 3:
        # Check if first part is email
        if '@' in parts[0]:
            email, phone, name = parts
            source = 'RYL' # Default source based on context
        else:
            # Format like 905525183998 - ayhan sansar - RYL
            email = 'test@gmail.com' # Default email
            phone, name, source = parts
    elif len(parts) == 2:
        # Very short like 118051 - Yeni Kayıt
        email = 'test@gmail.com'
        phone = parts[0]
        name = parts[1]
        source = 'RYL'
    else:
        continue

    formatted_phone = format_phone(phone)
    data_rows.append({
        'mail': email,
        'telefon': formatted_phone,
        'ad soyad': name,
        'kaynak': source
    })

df = pd.DataFrame(data_rows)
df.to_excel('leads.xlsx', index=False)
print("leads.xlsx generated successfully.")
