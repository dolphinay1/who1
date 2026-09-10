import os
import re

html_path = 'C:\\Users\\X\\.gemini\\antigravity\\scratch\\crypdolfin-portfolio\\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make the replacements for data-modal tags
# We need to replace each service card sequentially
service_count = 0
def replace_card(match):
    global service_count
    service_count += 1
    # Check if the card is the featured one
    classes = match.group(1)
    return f'<div class="{classes}" data-tilt data-modal="modal-sub-{service_count}" style="cursor: pointer;">'

content = re.sub(r'<div class="(service-card-v2(?: sc-featured)?)" data-tilt>', replace_card, content)

modals_html = """
    <!-- ════════════════════════════════════════
         SUBSCRIPTION TRANSFORMATION MODALS
         ════════════════════════════════════════ -->
    <!-- Sub Modal 1 -->
    <div class="modal-overlay" id="modal-sub-1">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi</span>
            <h3 class="modal-title">Butik İşletme Dönüşümü</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Yemek platformlarına %30-40 komisyon ödeyen, kendi müşteri datasına sahip olmayan ve fiziksel menü maliyetleriyle boğuşan sıradan bir işletme.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p><b>Tamamen komisyonsuz sipariş alan</b>, kendi dijital menüsü ve mobil uygulamasıyla müşterilerini sürekli geri getiren prestijli bir restoran markası!</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Bizi Bu Seviyeye Taşı</a>
        </div>
    </div>

    <!-- Sub Modal 2 -->
    <div class="modal-overlay" id="modal-sub-2">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi</span>
            <h3 class="modal-title">Kurumsal Web Varlığı</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>İnternette bulunamayan, mobilde kötü görünen ve müşterilere güven vermediği için ziyaretçilerin saniyeler içinde terk ettiği eski bir dijital vitrin.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p><b>7/24 sizin için çalışan</b>, Google aramalarında öne çıkan, cam gibi net tasarımıyla kaliteli ziyaretçileri anında müşteriye dönüştüren premium web sitesi.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Sitemi Yenile</a>
        </div>
    </div>

    <!-- Sub Modal 3 -->
    <div class="modal-overlay" id="modal-sub-3">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi</span>
            <h3 class="modal-title">Sosyal Medya Hakimiyeti</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Düzensiz, baştan savma paylaşımlar yapılan, görsel kimlikten ve profesyonellikten uzak, kimsenin etkileşime girmediği sıradan sosyal medya hesapları.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Kurumsal marka dilini bulmuş, her gün <b>yüksek estetikli ve stratejik içerikler</b> üreterek rakip tanımayan ve sektöründe otorite haline gelen fenomen hesaplar.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Markamı Yarat</a>
        </div>
    </div>

    <!-- Sub Modal 4 -->
    <div class="modal-overlay" id="modal-sub-4">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi <i data-lucide="star" style="width:14px;height:14px"></i></span>
            <h3 class="modal-title">Sıcak Müşteri Akışı</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Reklamlara on binlerce lira harcayıp, konuyla tamamen alakasız veya kalitesiz formlarla boğuşmaktan motivasyonunu yitirmiş bir satış ekibi.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Doğrudan almaya hazır, özel filtrelerden geçmiş <b>taze VIP müşteri datası</b> ile yorulmadan satış rekorları kıran ve prim şampiyonu olan bir ciro makinesi.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">VIP Datalara Ulaş</a>
        </div>
    </div>

    <!-- Sub Modal 5 -->
    <div class="modal-overlay" id="modal-sub-5">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi</span>
            <h3 class="modal-title">Şeffaf Satış Hunisi</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Satışların neden kaçtığını bilmeyen, Excel tablolarında kaybolmuş personeller ve potansiyeli paraya çeviremeyen karmaşık bir yönetim biçimi.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Hangi müşterinin satışa ne kadar yakın olduğunu anlık gören, sistemdeki sızıntıları tamamen kapatan <b>LTV (Ömür Boyu Değer) odaklı %100 ölçülebilir</b> satış süreci.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Sistemimi Analiz Et</a>
        </div>
    </div>

    <!-- Sub Modal 6 -->
    <div class="modal-overlay" id="modal-sub-6">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi</span>
            <h3 class="modal-title">Dev Organik Topluluk</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Bot hesaplarla şişirilmiş, içerde kimsenin etkileşime girmediği ve gerçek üyelerin sıkılıp sürekli kanaldan çıktığı güven vermeyen bir grup.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Her atılan post'a dakikalar içinde yüzlerce ateş atan, sadakati zirvede olan <b>10K+ organik lider</b> yatırımcılardan oluşan ve tek mesajla satış getiren aktif bir komünite.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Topluluğumu Yönet</a>
        </div>
    </div>

    <!-- Sub Modal 7 -->
    <div class="modal-overlay" id="modal-sub-7">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi</span>
            <h3 class="modal-title">Piyasaları Fetheden Yapay Zeka</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Uyku düzeninden vazgeçip 7/24 ekran başında grafik izleyen, psikolojik yorgunlukla hatalı işlemler yapıp sermayesini sıfırlayan stresli yatırımcı profili.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Piyasayı insan üstü hızla analiz eden, <b>duygusuz, disiplinli ve milisaniye pürüzsüzlüğünde</b> çalışan kişisel AI asistanı ile sadece kâr oranına odaklanan akıllı yatırım modeli.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Bot Ağına Katıl</a>
        </div>
    </div>

    <!-- Sub Modal 8 -->
    <div class="modal-overlay" id="modal-sub-8">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">Değişim Hikayesi</span>
            <h3 class="modal-title">Profesyonel Call Center Kurulumu</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Personelin kiminle ne, ne zaman konuştuğunu unutulduğu; çağrıların kaydedilmediği ve potansiyel alıcıların telefonda kaybedildiği kör noktalarla dolu bir süreç.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Satış ekibinin tek tıkla arama yaptığı, <b>her konuşmanın analiz için kaydedildiği</b>, tam otomatik MaskCRM entegrasyonu ile çağrıları iki kat yüksek dönüşüme (CR) ulaştıran profesyonel ağ.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Sistemi Entegre Et</a>
        </div>
    </div>

    <!-- Sub Modal 9 -->
    <div class="modal-overlay" id="modal-sub-9">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">VIP Değişim Hikayesi</span>
            <h3 class="modal-title">Garantili Yüksek Hacim FX/Crypto</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Düşük bütçeli, risk almaktan korkan veya piyasa mekaniklerine tamamen yabancı bir "soğuk kitleyi" ikna etmek için harcanan yüzlerce boşa geçmiş telefon dakikası.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Halihazırda işlem geçmişi olan, hacimli yatırımlar yapabilen ve <b>VIP muamelesi bekleyen premium kitle</b> sayesinde broker markasında aniden yaşanan büyüme sıçraması.</p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">Hacimi Yükselt</a>
        </div>
    </div>

    <!-- Sub Modal 10 -->
    <div class="modal-overlay" id="modal-sub-10">
        <div class="modal-content">
            <button class="modal-close"><i data-lucide="x"></i></button>
            <span class="modal-category">VIP Değişim Hikayesi</span>
            <h3 class="modal-title">Oyuncu Sadakat Operasyonu</h3>
            <div class="modal-body transformation-grid">
                <div class="trans-pane trans-before">
                    <div class="trans-icon trans-icon-red"><i data-lucide="x-circle"></i></div>
                    <h4>Önce:</h4>
                    <p>Büyük bonuslarla içeri alınıp ilk yatırımından sonra anında rakip sitelere kaçan (yüksek Churn rate), bir daha uğramayan doyumsuz ve vefasız oyuncu profili.</p>
                </div>
                <div class="trans-pane trans-after">
                    <div class="trans-icon trans-icon-green"><i data-lucide="check-circle-2"></i></div>
                    <h4>Sonra:</h4>
                    <p>Rakipleri unutmasını sağlayan, arka planda çalışan yapay zeka tetikleyicileri ile onlara en doğru anda dokunan; kendi iradesiyle her gün platforma dönen <b>sadık VIP kemik kitle.</b></p>
                </div>
            </div>
            <a href="#contact" class="btn-primary modal-cta">LTV'yi Zirveye Çıkar</a>
        </div>
    </div>

    <!-- Custom Cursor -->"""

content = content.replace('    <!-- Custom Cursor -->', modals_html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Modals injected successfully. Processed {service_count} service cards.")
