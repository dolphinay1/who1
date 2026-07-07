// Check for CSS.registerProperty support to handle animated custom properties
if (typeof window.CSS !== 'undefined' && typeof window.CSS.registerProperty === 'function') {
  document.body.style.setProperty('--supported', '1');
  document.body.classList.add('registerProperty-supported');
} else {
  document.body.style.setProperty('--not-supported', '1');
  document.body.classList.add('registerProperty-not-supported');
}

// Project database containing detailed information for each card
const projectsData = {
  crypdolfin: {
    title: "WEB3 Portfolio",
    desc: "Yazılım geliştiriciler ve teknoloji profesyonelleri için tasarlanmış; modern web standartlarına uygun, yüksek performanslı dijital özgeçmiş ve interaktif portfolyo sergileme platformu. Yetkinliklerin ve projelerin görsel olarak zengin bir arayüzle sunulmasını sağlar.",
    tags: ["Web3", "Next.js", "Tailwind CSS", "Ethers.js"],
    img: "./images/proj1.png",
    url: "https://github.com/dolphinay1/crypdolfin-portfolio"
  },
  excel_conversion: {
    title: "Excel Converter",
    desc: "Büyük ölçekli, karmaşık ve yapılandırılmamış Excel/CSV veri tabanlarını yüksek doğrulukla işleyen; veri analitiği, temizleme, normalizasyon ve B2B veri optimizasyonu gerçekleştiren kurumsal veri mühendisliği aracı.",
    tags: ["Python", "Pandas", "OpenPyXL", "Data Processing"],
    img: "./images/proj2.png",
    url: "https://github.com/dolphinay1/excel_conversion"
  },
  lead_bot: {
    title: "B2B Lead Bot",
    desc: "Hedeflenen kurumsal ağları ve web altyapılarını tarayarak yüksek kaliteli satış fırsatlarını (Lead) otomatik olarak tespit eden, doğrulayan ve yapılandırılmış veri formatlarında raporlayan otonom veri toplama ve analiz sistemi.",
    tags: ["Node.js", "Playwright", "Web Scraping", "Automation"],
    img: "./images/proj3.png",
    url: "https://github.com/dolphinay1/lead_bot"
  },
  marketbot: {
    title: "MarketBot",
    desc: "Kampanya yönetim süreçlerini ve pazarlama operasyonlarını optimize ederek dijital reklamcılık serüvenini kolaylaştırmak, dönüşüm oranlarını artırmak ve veri analitiği sunmak amacıyla geliştirilmiş yenilikçi pazarlama platformu.",
    tags: ["Python", "WebSockets", "Binance API", "Algorithmic Trading"],
    img: "./images/proj4.png",
    url: "https://github.com/dolphinay1/marketbot"
  },
  webiotrader: {
    title: "WebioTrader",
    desc: "Gerçek zamanlı piyasa veri akışları, gelişmiş grafik analiz araçları ve interaktif portföy izleme modülleriyle donatılmış, yüksek performanslı kurumsal finansal işlem ve analiz portalı.",
    tags: ["HTML5", "CSS3", "Vanilla JS", "TradingView Widgets"],
    img: "./images/proj5.png",
    url: "http://webiotrader.com"
  },
  teandsugar: {
    title: "Tea & Sugar",
    desc: "Gelişmiş spor istatistikleri veri modellerini, risk yönetimimi algoritmalarını ve çoklu dijital cüzdan bakiyelerini güvenli bir altyapıyla koordine eden, yüksek hacimli operasyonlara özel backoffice yönetim paneli.",
    tags: ["React", "Express.js", "MongoDB", "Admin Panel"],
    img: "./images/proj6.png",
    url: "https://github.com/dolphinay1/teandsugar"
  },
  tostlama: {
    title: "Tostlama",
    desc: "Yiyecek-içecek sektörü işletmeleri için geliştirilmiş; anlık sipariş takibi, dinamik bulut tabanlı menü yönetimi ve temassız QR ödeme entegrasyonu sunan yeni nesil SaaS sipariş ve restoran yönetim platformu.",
    tags: ["React.js", "Next.js", "Firebase Realtime DB", "QR System"],
    img: "./images/proj7.png",
    url: "https://tostlama.vercel.app"
  },
  vertex: {
    title: "VerteX Markets",
    desc: "Küresel finansal piyasalar için özel olarak tasarlanmış, yüksek dönüşüm odaklı dijital açılış sayfası (landing page) ve anlık işlem sinyallerini güvenle ileten otonom Telegram bot entegrasyonlu pazarlama altyapısı.",
    tags: ["CSS Grid", "Animations", "Telegram Bot API", "UI/UX"],
    img: "./images/proj8.png",
    url: "https://github.com/dolphinay1/vertex-landing"
  },
  future_ai: {
    title: "AI Automation Hub",
    desc: "Gelecek Proje: Yapay zeka ajanlarının (AI Agents) iş akışlarını, karar alma mekanizmalarını ve API entegrasyonlarını tek bir panelden yöneten, otonom iş süreçleri tasarlama ve orkestrasyon sistemi.",
    tags: ["AI Agents", "LangChain", "Node.js", "FastAPI"],
    img: "./images/proj9.png",
    url: "#"
  },
  future_web3: {
    title: "Web3 Decentra Dashboard",
    desc: "Gelecek Proje: Merkeziyetsiz finans (DeFi) ekosistemindeki likidite havuzları, yield farming gelirleri ve akıllı sözleşme cüzdan varlıklarını anlık veri akışlarıyla izleyen kapsamlı Web3 portföy takip ekranı.",
    tags: ["DeFi", "Web3.js", "Smart Contracts", "GraphQL"],
    img: "./images/proj10.png",
    url: "#"
  }
};

// Modal open operation
function openProject(projectId) {
  const project = projectsData[projectId];
  if (!project) return;
  
  document.getElementById('modalImage').src = project.img;
  document.getElementById('modalTitle').textContent = project.title;
  document.getElementById('modalDesc').textContent = project.desc;
  
  const tagsContainer = document.getElementById('modalTags');
  tagsContainer.innerHTML = '';
  project.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'modal-tag';
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });
  
  const visitBtn = document.getElementById('modalBtn');
  if (project.url === '#') {
    visitBtn.style.display = 'none';
  } else {
    visitBtn.style.display = 'block';
    visitBtn.href = project.url;
  }
  
  document.getElementById('projectModal').classList.add('active');
}

// Modal close operation
function closeModal() {
  document.getElementById('projectModal').classList.remove('active');
}

// Close when clicking outside content box
function closeModalOnBackdrop(event) {
  if (event.target === document.getElementById('projectModal')) {
    closeModal();
  }
}

// Close on pressing Escape key
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});
