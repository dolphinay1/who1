// Check for CSS.registerProperty support to handle animated custom properties
if (typeof window.CSS !== 'undefined' && typeof window.CSS.registerProperty === 'function') {
  document.body.style.setProperty('--supported', '1');
  document.body.classList.add('registerProperty-supported');
} else {
  document.body.style.setProperty('--not-supported', '1');
  document.body.classList.add('registerProperty-not-supported');
}

// Project database containing detailed bilingual information for each card
const projectsData = {
  tr: {
    crypdolfin: {
      title: "WEB3 PORTFOLIO",
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
  },
  en: {
    crypdolfin: {
      title: "WEB3 PORTFOLIO",
      desc: "Designed for software developers and technology professionals; a high-performance digital resume and interactive portfolio showcasing platform compliant with modern web standards. Provides visual presentation of competencies and projects.",
      tags: ["Web3", "Next.js", "Tailwind CSS", "Ethers.js"],
      img: "./images/proj1.png",
      url: "https://github.com/dolphinay1/crypdolfin-portfolio"
    },
    excel_conversion: {
      title: "Excel Converter",
      desc: "Enterprise data engineering tool that processes large-scale, complex and unstructured Excel/CSV databases with high accuracy; performs data analytics, cleaning, normalization, and B2B data optimization.",
      tags: ["Python", "Pandas", "OpenPyXL", "Data Processing"],
      img: "./images/proj2.png",
      url: "https://github.com/dolphinay1/excel_conversion"
    },
    lead_bot: {
      title: "B2B Lead Bot",
      desc: "Autonomous data collection and analysis system that automatically detects, verifies, and reports high-quality B2B sales opportunities (Leads) in structured formats by scanning target networks and web infrastructures.",
      tags: ["Node.js", "Playwright", "Web Scraping", "Automation"],
      img: "./images/proj3.png",
      url: "https://github.com/dolphinay1/lead_bot"
    },
    marketbot: {
      title: "MarketBot",
      desc: "Innovative marketing platform developed to simplify the digital advertising journey, increase conversion rates, and provide data analytics by optimizing campaign management processes and marketing operations.",
      tags: ["Python", "WebSockets", "Binance API", "Algorithmic Trading"],
      img: "./images/proj4.png",
      url: "https://github.com/dolphinay1/marketbot"
    },
    webiotrader: {
      title: "WebioTrader",
      desc: "High-performance enterprise financial transaction and analysis portal equipped with real-time market data streams, advanced chart analysis tools, and interactive portfolio monitoring modules.",
      tags: ["HTML5", "CSS3", "Vanilla JS", "TradingView Widgets"],
      img: "./images/proj5.png",
      url: "http://webiotrader.com"
    },
    teandsugar: {
      title: "Tea & Sugar",
      desc: "Specialized backoffice management panel for high-volume operations, coordinating advanced sports statistics data models, risk management algorithms, and multiple digital wallet balances under a secure infrastructure.",
      tags: ["React", "Express.js", "MongoDB", "Admin Panel"],
      img: "./images/proj6.png",
      url: "https://github.com/dolphinay1/teandsugar"
    },
    tostlama: {
      title: "Tostlama",
      desc: "New generation SaaS ordering and restaurant management platform for food and beverage sector businesses, offering instant order tracking, dynamic cloud-based menu management, and contactless QR payment integration.",
      tags: ["React.js", "Next.js", "Firebase Realtime DB", "QR System"],
      img: "./images/proj7.png",
      url: "https://tostlama.vercel.app"
    },
    vertex: {
      title: "VerteX Markets",
      desc: "High-conversion digital landing page specifically designed for global financial markets, featuring an autonomous Telegram bot integration that securely transmits real-time trading signals.",
      tags: ["CSS Grid", "Animations", "Telegram Bot API", "UI/UX"],
      img: "./images/proj8.png",
      url: "https://github.com/dolphinay1/vertex-landing"
    },
    future_ai: {
      title: "AI Automation Hub",
      desc: "Upcoming Project: Autonomous workflow design and orchestration system for managing AI agents' tasks, decision-making mechanisms, and API integrations from a single control panel.",
      tags: ["AI Agents", "LangChain", "Node.js", "FastAPI"],
      img: "./images/proj9.png",
      url: "#"
    },
    future_web3: {
      title: "Web3 Decentra Dashboard",
      desc: "Upcoming Project: Comprehensive Web3 portfolio tracking dashboard that monitors liquidity pools, yield farming yields, and smart contract wallet assets in the decentralized finance (DeFi) ecosystem with real-time data streams.",
      tags: ["DeFi", "Web3.js", "Smart Contracts", "GraphQL"],
      img: "./images/proj10.png",
      url: "#"
    }
  }
};

let currentLang = 'tr';
let activeProjectId = null;

// Modal open operation
function openProject(projectId) {
  const project = projectsData[currentLang][projectId];
  if (!project) return;

  activeProjectId = projectId;
  
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
    visitBtn.textContent = currentLang === 'tr' ? 'Projeye Git' : 'Visit Project';
  }
  
  document.getElementById('projectModal').classList.add('active');
}

// Modal close operation
function closeModal() {
  document.getElementById('projectModal').classList.remove('active');
  activeProjectId = null;
}

// Close when clicking outside content box
function closeModalOnBackdrop(event) {
  if (event.target === document.getElementById('projectModal')) {
    closeModal();
  }
}

// Global setLanguage trigger function (called from parent script.js)
window.setLanguage = function(lang) {
  if (lang !== 'tr' && lang !== 'en') return;
  currentLang = lang;

  // Translate main header title
  const mainTitleEl = document.getElementById('proj-main-title');
  if (mainTitleEl) {
    mainTitleEl.textContent = lang === 'tr' ? 'PROJELERİM' : 'PROJECTS';
  }

  // Update card static title translations if any
  const cards = document.querySelectorAll('.chrome-card');
  cards.forEach(card => {
    // Determine card id by onclick attribute
    const onclickAttr = card.getAttribute('onclick');
    if (onclickAttr) {
      const match = onclickAttr.match(/openProject\('([^']+)'\)/);
      if (match && match[1]) {
        const pId = match[1];
        const titleEl = card.querySelector('.title');
        if (titleEl && projectsData[currentLang][pId]) {
          titleEl.textContent = projectsData[currentLang][pId].title;
        }
      }
    }
  });

  // If a modal is open, refresh it in the new language
  if (activeProjectId) {
    openProject(activeProjectId);
  }
};

// Bind functions to window to expose them from ES Modules to inline onclick attributes
window.openProject = openProject;
window.closeModal = closeModal;
window.closeModalOnBackdrop = closeModalOnBackdrop;

// Close on pressing Escape key
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});
