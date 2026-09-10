(async function() {
    // --- AYARLAR ---
    const ATLANACAK_KISI_SAYISI = 100; // İlk 100 kişiyi atlar, silmeye 101.'den başlar.
    
    const ISLEM_TIPI = "kaldir"; 
    const MIN_BEKLEME = 25000; 
    const MAX_BEKLEME = 45000; 
    
    const ILK_BUTON_METİNLERİ = ["çıkar", "kaldır", "remove"];
    const ONAY_BUTONU_METİNLERİ = ["çıkar", "kaldır", "remove"];
    // ---------------

    console.log("%c[Insta-Cleaner] Başlatılıyor...", "color: #00ff00; font-size: 16px; font-weight: bold;");
    if(ATLANACAK_KISI_SAYISI > 0) {
        console.log(`[Insta-Cleaner] Baştaki ${ATLANACAK_KISI_SAYISI} kişi atlanacak...`);
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const rastgeleBekleme = () => Math.floor(Math.random() * (MAX_BEKLEME - MIN_BEKLEME + 1)) + MIN_BEKLEME;

    // Belirtilen kapsayıcı içindeki butonları bulur
    const butonBul = (arananMetinler, kapsayici = document) => {
        const butonlar = Array.from(kapsayici.querySelectorAll('button, div[role="button"], a[role="button"]'));
        return butonlar.filter(btn => {
            const btnMetni = btn.innerText.trim().toLowerCase();
            return arananMetinler.some(aranan => btnMetni === aranan || btnMetni.includes(aranan));
        });
    };

    let islemSayisi = 0;
    let ayniSayidaKalmaSayaci = 0;

    while (true) {
        let hedefButonlar = butonBul(ILK_BUTON_METİNLERİ);
        
        // Liste popup'ındaki butonları al (Onay ekranındakileri hariç tut)
        hedefButonlar = hedefButonlar.filter(btn => {
            const popup = btn.closest('[role="dialog"]');
            if (popup) {
                const tumDialoglar = Array.from(document.querySelectorAll('[role="dialog"]'));
                // Eğer buton, en son açılan (onay) penceresindeyse yoksay
                if (tumDialoglar.length > 1 && popup === tumDialoglar[tumDialoglar.length - 1]) {
                    return false;
                }
            }
            return true;
        });

        // Belirtilen kişiyi bulana kadar listeyi aşağı kaydır
        if (hedefButonlar.length <= ATLANACAK_KISI_SAYISI) {
            console.log(`[Insta-Cleaner] Liste kaydırılıyor... (Şu anki kişi sayısı: ${hedefButonlar.length}, Atlanacak: ${ATLANACAK_KISI_SAYISI})`);
            
            const dialoglar = document.querySelectorAll('[role="dialog"]');
            if (dialoglar.length > 0) {
                const scrollAlanlari = dialoglar[0].querySelectorAll('div[style*="overflow"], div[style*="position: relative"]');
                let kaydirildi = false;
                for (let alan of scrollAlanlari) {
                    if (alan.scrollHeight > alan.clientHeight) {
                        alan.scrollTop = alan.scrollHeight;
                        kaydirildi = true;
                        break;
                    }
                }
                if (!kaydirildi) {
                    const tumDivler = dialoglar[0].querySelectorAll('div');
                    for (let div of tumDivler) {
                        if (div.scrollHeight > div.clientHeight) {
                            div.scrollTop = div.scrollHeight;
                            break;
                        }
                    }
                }
            } else {
                 window.scrollTo(0, document.body.scrollHeight);
            }
            
            await sleep(3500); // Instagram'ın yüklemesi için bekle
            
            let yeniHedefButonlar = butonBul(ILK_BUTON_METİNLERİ);
            if (yeniHedefButonlar.length === hedefButonlar.length) {
                ayniSayidaKalmaSayaci++;
                if (ayniSayidaKalmaSayaci > 3) {
                    console.log("%c[Insta-Cleaner] Daha fazla kişi yüklenemiyor. Ya listenin sonuna gelindi ya da tarayıcı listeyi kilitledi.", "color: #ffcc00; font-size: 14px;");
                    console.log("%cÖNERİ: Atlanacak kişi sayısını 0 yapıp listeyi sizin silmek istediğiniz yere kadar fareyle kaydırıp kodu tekrar çalıştırın.", "color: #ffcc00;");
                    break;
                }
            } else {
                ayniSayidaKalmaSayaci = 0; 
            }
            continue; 
        }

        // ATLANACAK_KISI_SAYISI'nı geçtik, sıradaki butonu bul
        const islemButonu = hedefButonlar[ATLANACAK_KISI_SAYISI];
        
        console.log(`[Insta-Cleaner] İşlem başlatılıyor... (Sıra: ${ATLANACAK_KISI_SAYISI + 1}, Toplam silinen: ${islemSayisi})`);
        
        islemButonu.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(800);
        islemButonu.click();
        
        await sleep(2500); // Onay popup'ının açılmasını bekle

        let onaylandi = false;
        const dialoglar = document.querySelectorAll('[role="dialog"]');
        
        // SADECE EN ÜSTTEKİ ONAY PENCERESİNDE ARAMA YAP
        if (dialoglar.length > 1) {
            const onayPopup = dialoglar[dialoglar.length - 1]; // İkinci/son popup
            const onayButonlari = butonBul(ONAY_BUTONU_METİNLERİ, onayPopup);
            
            if (onayButonlari.length > 0) {
                onayButonlari[0].click(); // Gerçek Onay Butonu
                onaylandi = true;
                islemSayisi++;
            }
        }
        
        if (!onaylandi) {
            console.log("%c[Insta-Cleaner] Onay popup'ı bulunamadı! İptal ediliyor...", "color: red;");
            
            // Onay butonu bulunamazsa İptal'e basıp kapat
            if (dialoglar.length > 1) {
                const onayPopup = dialoglar[dialoglar.length - 1];
                const iptalButonlari = butonBul(["iptal", "cancel"], onayPopup);
                if(iptalButonlari.length > 0) iptalButonlari[0].click();
            }
            await sleep(2000);
            
            islemButonu.style.display = 'none'; // Hata veren butonu gizle ki sonsuz döngü olmasın
            continue;
        }

        const beklemeSuresi = rastgeleBekleme();
        console.log(`%c[Insta-Cleaner] Başarılı! Ban yememek için ${beklemeSuresi/1000} sn bekleniyor...`, "color: #00ffff;");
        await sleep(beklemeSuresi);
    }
    
    console.log(`%c[Insta-Cleaner] BİTİŞ! Toplam ${islemSayisi} kişiye işlem yapıldı.`, "color: #00ff00; font-size: 16px; font-weight: bold;");
})();
