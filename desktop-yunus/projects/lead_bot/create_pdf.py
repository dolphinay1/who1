import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts for Turkish characters
# Use standard Windows fonts
font_path = "C:\\Windows\\Fonts\\arial.ttf"
font_bold_path = "C:\\Windows\\Fonts\\arialbd.ttf"
if os.path.exists(font_path) and os.path.exists(font_bold_path):
    pdfmetrics.registerFont(TTFont('Arial', font_path))
    pdfmetrics.registerFont(TTFont('Arial-Bold', font_bold_path))
    font_name = 'Arial'
    font_bold_name = 'Arial-Bold'
else:
    font_name = 'Helvetica'
    font_bold_name = 'Helvetica-Bold'

output_file = "C:\\Users\\1111\\.gemini\\antigravity\\scratch\\Yatirim_Iade_Sozlesmesi.pdf"
doc = SimpleDocTemplate(output_file, pagesize=A4,
                        rightMargin=50, leftMargin=50,
                        topMargin=50, bottomMargin=50)

styles = getSampleStyleSheet()

# Custom Styles
title_style = ParagraphStyle(
    name='TitleStyle',
    fontName=font_bold_name,
    fontSize=16,
    alignment=TA_CENTER,
    spaceAfter=20,
    textColor=colors.HexColor("#1A365D")
)

subtitle_style = ParagraphStyle(
    name='SubtitleStyle',
    fontName=font_bold_name,
    fontSize=12,
    alignment=TA_CENTER,
    spaceAfter=30,
    textColor=colors.HexColor("#2D3748")
)

heading_style = ParagraphStyle(
    name='HeadingStyle',
    fontName=font_bold_name,
    fontSize=12,
    spaceBefore=15,
    spaceAfter=8,
    textColor=colors.HexColor("#2C5282")
)

normal_style = ParagraphStyle(
    name='NormalStyle',
    fontName=font_name,
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=8,
    leading=14
)

list_style = ParagraphStyle(
    name='ListStyle',
    fontName=font_name,
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=5,
    leading=14,
    leftIndent=20
)

signature_style = ParagraphStyle(
    name='SignatureStyle',
    fontName=font_bold_name,
    fontSize=10,
    alignment=TA_CENTER
)

story = []

# Header / Logos could be added here if we had an image
# story.append(Image("logo.png", width=100, height=50))

story.append(Paragraph("VERTEX YATIRIM", subtitle_style))
story.append(Paragraph("KAYIP İADE BİRİMİ", subtitle_style))
story.append(Spacer(1, 10))

story.append(Paragraph("FOREX YATIRIM VE İADE SÖZLEŞMESİ", title_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Tarih: 29.04.2026", normal_style))
story.append(Spacer(1, 10))

# Taraflar
story.append(Paragraph("TARAFLAR", heading_style))
story.append(Paragraph("<b>1. Şirket:</b> Vertex Yatırım", normal_style))
story.append(Paragraph("<b>2. Yatırımcı:</b> Zamirullah Kakar", normal_style))
story.append(Paragraph("İşbu Sözleşme, yukarıda bilgileri yer alan Şirket ve Yatırımcı arasında aşağıda belirtilen şartlar dâhilinde akdedilmiştir.", normal_style))

# Madde 1
story.append(Paragraph("Madde 1 – Sözleşmenin Konusu", heading_style))
story.append(Paragraph("İşbu sözleşme, yatırımcı tarafından sağlanan fonların forex piyasalarında değerlendirilmesine ilişkin usul ve şartları ile Kayıp İade Birimi'nin uygulamalarını düzenler.", normal_style))

# Madde 2
story.append(Paragraph("Madde 2 – Yatırım Tutarı", heading_style))
story.append(Paragraph("Yatırımcı, şirkete mevcut yatırım bakiyesinin/teminatının %10'u tutarında ek yatırım yapmayı kabul ve taahhüt eder.", normal_style))

# Madde 3
story.append(Paragraph("Madde 3 – İşlem Şartları (Lot Koşulu)", heading_style))
story.append(Paragraph("<b>3.1.</b> Şirket, yatırımcı adına gerçekleştirilecek işlemlerde toplam işlem hacminin en az %1 lot oranına ulaşmasını hedefler.", list_style))
story.append(Paragraph("<b>3.2.</b> \"%1 lot şartı\", yatırım tutarına oranla açılan pozisyon büyüklüğünün toplam işlem hacmi içindeki oranını ifade eder.", list_style))
story.append(Paragraph("<b>3.3.</b> Bu şartın nasıl hesaplanacağı ve uygulanacağı, taraflar arasında ayrıca yazılı olarak belirlenir ve yatırımcının hesabına yansıtılır.", list_style))

# Madde 4
story.append(Paragraph("Madde 4 – Getiri ve Ödeme Koşulu", heading_style))
story.append(Paragraph("<b>4.1.</b> Şirket, aşağıdaki şartların eksiksiz yerine getirilmesi halinde yatırımcıya ödeme yapmayı kabul eder:", list_style))
story.append(Paragraph("• Belirlenen işlem hacmi (%1 lot şartı) tamamlanmış olmalıdır.", list_style))
story.append(Paragraph("• İşlemler şirketin belirlediği stratejiye uygun yürütülmelidir.", list_style))
story.append(Paragraph("<b>4.2.</b> Bu şartların sağlanması durumunda, şirket yatırımcıya azami <b>369.269 ₺</b> tutarında ödeme yapmayı taahhüt eder.", list_style))
story.append(Paragraph("<b>4.3.</b> Belirtilen tutar garanti edilmiş kesin bir kazanç olmayıp, yalnızca performans, işlem hacmi ve piyasa koşullarına bağlı olarak öngörülen hedef getiridir.", list_style))

# Madde 5
story.append(Paragraph("Madde 5 – Sorumluluğun Sınırlandırılması", heading_style))
story.append(Paragraph("Forex piyasaları yüksek volatilite ve risk içerdiğinden; Şirket, önceden öngörülemeyen piyasa koşullarından veya olağanüstü ekonomik gelişmelerden kaynaklanan doğrudan zararlardan sorumlu tutulamaz.", normal_style))

# Madde 6
story.append(Paragraph("Madde 6 – Sözleşme Süresi", heading_style))
story.append(Paragraph("İşbu Sözleşme, yatırımın (fonun) şirketin resmi hesaplarına ulaştığı tarihten itibaren geçerlilik kazanır ve karşılıklı yükümlülükler tamamlanana dek yürürlükte kalır.", normal_style))

# Madde 7
story.append(Paragraph("Madde 7 – Uyuşmazlıkların Çözümü", heading_style))
story.append(Paragraph("İşbu sözleşmenin uygulanmasından doğabilecek her türlü uyuşmazlığın çözümünde İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.", normal_style))

# Madde 8
story.append(Paragraph("Madde 8 – Yürürlük", heading_style))
story.append(Paragraph("8 (Sekiz) maddeden ibaret olan işbu Sözleşme, taraflarca tüm hükümleri okunup, anlaşılmak suretiyle serbest iradeleriyle imzalanmış ve yürürlüğe girmiştir.", normal_style))

story.append(Spacer(1, 40))

# Signatures
data = [
    [Paragraph("<b>ŞİRKET YETKİLİSİ</b>", signature_style), Paragraph("<b>YATIRIMCI</b>", signature_style)],
    [Spacer(1, 40), Spacer(1, 40)],
    [Paragraph("<b>Ad Soyad:</b> Can Efe<br/><b>Unvan:</b> Kayıp İade Birimi Yetkilisi<br/><b>İmza:</b>", signature_style), 
     Paragraph("<b>İsim Soyisim:</b> Zamirullah Kakar<br/><b>İmza:</b>", signature_style)]
]

table = Table(data, colWidths=[200, 200])
table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))

story.append(table)

doc.build(story)
print(f"PDF successfully generated at: {output_file}")
