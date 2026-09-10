export const translations = {
  tr: {
    "logo": "KİŞİSEL KİMLİK",
    "window-title": "Who is Yunus?",
    "hero-line1": "Yunus Aslında",
    "hero-line2": "Tam",
    "hero-line3": "Olarak Şöyle Biri.",
    "about-eyebrow": "KİMLİĞİM VE YAKLAŞIMIM",
    "about-heading": "İnsanı Anlamak,<br />Sistemi İnşa Etmek.",
    "about-desc": "Teknolojinin rasyonel dünyası ve insan ilişkilerinin samimiyetini dengeleyebilen; karakterini kelimelerle pazarlamayı reddedip, işine duyduğu saygı ve netliğiyle var olmayı benimsemiş biri.",
    "card1-title": "Köklerim ve Karakterim",
    "card1-desc": "25 yaşındayım, İstanbul'da yaşıyorum. İtalyan bir anne ve Erzincanlı bir babanın oğlu olarak, zıtlıkların uyumunu ve farklılıkları kucaklamayı erken yaşta öğrendim. İ.Ü. Cerrahpaşa'daki Turizm İşletmeciliği eğitimimle de derinleşen bu kültürel altyapı, bana insanları anlama ve koordine etme yeteneği kazandırdı. Karakterimi 'yardımsever' veya 'uyumlu' gibi ezberlenmiş sıfatlarla övmek yerine; ekiplere taşıdığım şeffaflık, netlik ve samimiyetle göstermeyi daha doğru buluyorum.",
    "card1-link": "HİKAYEMİ KEŞFET ➔",
    "card2-title": "Saha Pratiği ve Merak",
    "card2-desc": "Hayatı sadece masa başında değil, kendi girişimlerimi kurup sahanın zorluklarıyla yüzleşerek öğrendim. Satış, pazarlama ve hizmet sektöründeki 7 yılı aşkın serüvenim bana kriz anlarındaki sükunetle çözüm üretmeyi öğretti. Diksiyondan gastronomiye, stres yönetiminden moda illüstrasyonuna uzanan eğitimlerim rastgele bir liste değil; insana, estetiğe ve hayata duyduğum çok yönlü merakın birer kanıtı.",
    "card2-link": "NELER ÖĞRENDİM? ➔",
    "card3-title": "Dijital Zanaat ve Vizyon",
    "card3-desc": "Bilgisayarlara duyduğum kişisel tutku, zamanla matematiksel analize ve sistem kurma becerisine dönüştü. Bugün, pazarlama dünyasındaki tecrübemi yazılım ve Yapay Zeka (AI) ile harmanlayarak, karmaşık süreçleri sadeleştiren mimariler kuruyorum. Vizyonum 'elit hizmetler' gibi içi boş vaatler satmak değil; insan odağından kopmadan, sistematik işleyen ve kendi kendini büyüten şeffaf sistemler inşa etmek.",
    "card3-link": "DİJİTAL YAKLAŞIMIM ➔",
    "cta-quote-text": "“<em>İyi yapılmış bir iş</em>, iyi söylenmiş bir <em>sözden</em> daima daha iyidir.”",
    "cta-quote-author": "— Benjamin Franklin",
    "menu-about": "Hakkımda",
    "menu-experiences": "Deneyimler",
    "menu-competences": "Yetkinlikler",
    "menu-projects": "Projeler",
    "folder-about": "Yunus Kimdir?",
    "folder-experiences": "Deneyimler",
    "folder-competences": "Yetkinlikler",
    "folder-projects": "Projeler"
  },
  en: {
    "logo": "PERSONAL IDENTITY",
    "window-title": "Who is Yunus?",
    "hero-line1": "Yunus Is Actually",
    "hero-line2": "Exactly",
    "hero-line3": "Like This.",
    "about-eyebrow": "MY IDENTITY & APPROACH",
    "about-heading": "Understanding People,<br />Building Systems.",
    "about-desc": "Balancing the rational world of technology with human relationships; refusing to market character with words, existing through respect and clarity in work.",
    "card1-title": "Roots & Character",
    "card1-desc": "I am 25 years old, living in Istanbul. As the son of an Italian mother and an Erzincan father, I learned early on to embrace diversity and the harmony of contrasts. This cultural background, enriched by my Tourism Management education at Istanbul University-Cerrahpaşa, gave me the ability to understand and coordinate people. Rather than praising my character with rote adjectives like 'helpful' or 'adaptable', I find it more accurate to demonstrate it through the transparency, clarity, and sincerity I bring to teams.",
    "card1-link": "EXPLORE MY STORY ➔",
    "card2-title": "Field Practice & Curiosity",
    "card2-desc": "I learned life not just sitting behind a desk, but by founding my own startups and facing the challenges of the field. My journey of over 7 years in sales, marketing, and the service sector taught me to produce solutions calmly during crises. My training, spanning from diction to gastronomy, stress management to fashion illustration, is not a random list; it is proof of my multi-faceted curiosity about people, aesthetics, and life.",
    "card2-link": "WHAT I'VE LEARNED ➔",
    "card3-title": "Digital Craft & Vision",
    "card3-desc": "My personal passion for computers evolved over time into mathematical analysis and system building skills. Today, blending my marketing experience with software and Artificial Intelligence (AI), I design architectures that simplify complex processes. My vision is not to sell empty promises like 'elite services', but to build transparent systems that function systematically and grow self-sufficiently without losing focus on people.",
    "card3-link": "MY DIGITAL APPROACH ➔",
    "cta-quote-text": "“<em>Well done</em> is better than <em>well said</em>.”",
    "cta-quote-author": "— Benjamin Franklin",
    "menu-about": "About",
    "menu-experiences": "Experiences",
    "menu-competences": "Skills",
    "menu-projects": "Projects",
    "folder-about": "Who is Yunus?",
    "folder-experiences": "Experiences",
    "folder-competences": "Competences",
    "folder-projects": "Projects"
  }
};

export function applyTranslation(lang) {
  const elements = document.querySelectorAll("[data-translate]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-translate");
    if (translations[lang] && translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });
}

export function initMonaxGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // Scoped animations running inside .window-content
  gsap.set(".window-content .nav", { opacity: 0, y: -20 });
  gsap.set(".window-content .headline .word > span", { y: "105%" });
  gsap.set(".window-content #inlineImg, .window-content #ideaPill", { scale: 0 });
  gsap.set(".window-content .feat-card, .window-content .cta-inner", { opacity: 0 });

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .to(".window-content .nav", { opacity: 1, y: 0, duration: 0.8 }, 0.1)
    .to(".window-content .line-1 .word > span", { y: "0%", duration: 0.9 }, 0.3)
    .to(".window-content .line-2 .word > span", { y: "0%", duration: 0.9 }, 0.45)
    .to(".window-content #inlineImg", { scale: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.4)
    .to(".window-content #ideaPill", { scale: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.55)
    .to(".window-content .line-3 .word > span", { y: "0%", duration: 0.9 }, 0.6);

  // Bobbing effects inside the window
  gsap.to(".window-content #inlineImg", {
    y: "+=6",
    rotation: 2,
    duration: 2.8,
    delay: 1.8,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });
  gsap.to(".window-content #ideaPill", {
    y: "+=5",
    rotation: -1.5,
    duration: 3.2,
    delay: 2.0,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });

  ScrollTrigger.create({
    trigger: ".window-content .hero",
    scroller: ".window-content",
    start: "top top",
    end: "bottom top",
    scrub: 0.8,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(".window-content .headline", { y: -50 * p, opacity: 1 - p * 0.4 });
    }
  });

  gsap.from(".window-content .eyebrow, .window-content .features-head h2, .window-content .features-head p", {
    opacity: 0,
    y: 30,
    duration: 0.9,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".window-content .features-head", scroller: ".window-content", start: "top 80%" }
  });
  
  gsap.to(".window-content .feat-card", {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.12,
    ease: "power3.out",
    scrollTrigger: { trigger: ".window-content .features-grid", scroller: ".window-content", start: "top 50%" }
  });

  gsap.to(".window-content .cta-inner", {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: { trigger: ".window-content .cta-section", scroller: ".window-content", start: "top 80%" }
  });
}
