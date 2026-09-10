import re
import os

HISTORY_FILE = "lead_history.txt"

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return set(f.read().splitlines())
    return set()

def save_to_history(numbers):
    history = load_history()
    new_numbers = set(numbers) - history
    if new_numbers:
        with open(HISTORY_FILE, "a", encoding="utf-8") as f:
            for num in new_numbers:
                f.write(num + "\n")

def is_duplicate(number):
    history = load_history()
    return number in history

def extract_mobile_number(text):
    if not text:
        return ""
        
    cleaned = re.sub(r'[^\d+]', '', text)
    
    if cleaned.startswith('+90'):
        cleaned = '0' + cleaned[3:]
    elif cleaned.startswith('90') and len(cleaned) == 12:
        cleaned = '0' + cleaned[2:]
    
    if len(cleaned) == 10 and cleaned.startswith('5'):
        cleaned = '0' + cleaned
        
    if len(cleaned) >= 11 and cleaned.startswith('05'):
        mobile_candidate = cleaned[:11]
        return mobile_candidate
        
    return ""

def filter_emails(text):
    if not text: return ""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    found_emails = re.findall(email_pattern, text)
    emails = set()
    for email in found_emails:
        if not email.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            emails.add(email.lower())
    return ", ".join(list(emails))

def clean_person_name(name):
    """
    Kurum isimlerini silip sadece şahıs isimlerini ayıklamaya çalışır.
    """
    if not name: return ""
    
    name = re.split(r'\s*[-|/]\s*', name)[0]
    
    stopwords = [
        "hukuk", "bürosu", "danışmanlık", "kliniği", "polikliniği", 
        "avukatlık", "ortaklığı", "hastanesi", "a.ş.", "ltd.", "şti.", 
        "ve", "partners", "law", "firm", "klinik", "muayenehanesi", "merkezi",
        "ofisi", "arabuluculuk", "akademi"
    ]
                 
    titles = ["av.", "avukat", "dr.", "doktor", "uzm.", "uzman", "prof.", "doç.", "dt.", "diş", "hekimi", "opr.", "op."]
    
    name = name.replace(',', ' ').replace('.', ' ')
    words = name.split()
    cleaned_words = []
    
    for w in words:
        w_lower = w.lower()
        if w_lower in stopwords or w_lower in titles:
            continue
            
        is_stop = False
        for stop in stopwords:
            if stop in w_lower and len(stop) > 3:
                is_stop = True
                break
        if is_stop:
            continue
            
        cleaned_words.append(w)
        
    final_name = " ".join(cleaned_words).title()
    if not final_name.strip():
        clean_no_title = [w for w in words if w.lower() not in titles]
        return " ".join(clean_no_title).title()
        
    return final_name
