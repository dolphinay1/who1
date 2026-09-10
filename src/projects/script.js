import "../space/security.js";

const projectsData = [
  {
    id: "crypdolfin",
    number: "01",
    repo: "dolphinay1 / crypdolfin-portfolio",
    url: "https://github.com/dolphinay1/crypdolfin-portfolio",
    starCount: 10,
    configFile: "next.config.js",
    category: { tr: "MÜŞTERİ", en: "CLIENT" },
    title: { tr: "WEB3 PORTFOLIO", en: "WEB3 PORTFOLIO" },
    fileTimes: {
      tr: ["2 saat önce", "2 saat önce", "5 saat önce", "1 gün önce"],
      en: ["2 hours ago", "2 hours ago", "5 hours ago", "1 day ago"]
    },
    desc: {
      tr: "Yazılım geliştiriciler ve teknoloji profesyonelleri için tasarlanmış; modern web standartlarına uygun, yüksek performanslı dijital özgeçmiş ve interaktif portfolyo sergileme platformu. Yetkinliklerin ve projelerin görsel olarak zengin bir arayüzle sunulmasını sağlar.",
      en: "Designed for software developers and technology professionals; a high-performance digital resume and interactive portfolio showcasing platform compliant with modern web standards. Provides visual presentation of competencies and projects."
    }
  },
  {
    id: "excel_conversion",
    number: "02",
    repo: "dolphinay1 / excel_conversion",
    url: "https://github.com/dolphinay1/excel_conversion",
    starCount: 8,
    configFile: "requirements.txt",
    category: { tr: "KURUMSAL", en: "ENTERPRISE" },
    title: { tr: "Excel Converter", en: "Excel Converter" },
    fileTimes: {
      tr: ["dün", "dün", "2 gün önce", "3 gün önce"],
      en: ["yesterday", "yesterday", "2 days ago", "3 days ago"]
    },
    desc: {
      tr: "Büyük ölçekli, karmaşık ve yapılandırılmamış Excel/CSV veri tabanlarını yüksek doğrulukla işleyen; veri analitiği, temizleme, normalizasyon ve B2B veri optimizasyonu gerçekleştiren kurumsal veri mühendisliği aracı.",
      en: "Enterprise data engineering tool that processes large-scale, complex and unstructured Excel/CSV databases with high accuracy; performs data analytics, cleaning, normalization, and B2B data optimization."
    }
  },
  {
    id: "lead_bot",
    number: "03",
    repo: "dolphinay1 / lead_bot",
    url: "https://github.com/dolphinay1/lead_bot",
    starCount: 15,
    configFile: "playwright.config.js",
    category: { tr: "OTOMASYON", en: "AUTOMATION" },
    title: { tr: "B2B Lead Bot", en: "B2B Lead Bot" },
    fileTimes: {
      tr: ["3 gün önce", "3 gün önce", "4 gün önce", "1 hafta önce"],
      en: ["3 days ago", "3 days ago", "4 days ago", "1 week ago"]
    },
    desc: {
      tr: "Hedeflenen kurumsal ağları ve web altyapılarını tarayarak yüksek kaliteli satış fırsatlarını (Lead) otomatik olarak tespit eden, doğrulayan ve yapılandırılmış veri formatlarında raporlayan otonom veri toplama ve analiz sistemi.",
      en: "Autonomous data collection and analysis system that automatically detects, verifies, and reports high-quality B2B sales opportunities (Leads) in structured formats by scanning target networks and web infrastructures."
    }
  },
  {
    id: "marketbot",
    number: "04",
    repo: "dolphinay1 / crypto-marketbot",
    url: "https://github.com/dolphinay1/marketbot",
    starCount: 12,
    configFile: "config.yaml",
    category: { tr: "FİNANS", en: "FINANCE" },
    title: { tr: "MarketBot", en: "MarketBot" },
    fileTimes: {
      tr: ["1 hafta önce", "1 hafta önce", "2 hafta önce", "3 hafta önce"],
      en: ["1 week ago", "1 week ago", "2 weeks ago", "3 weeks ago"]
    },
    desc: {
      tr: "Kampanya yönetim süreçlerini ve pazarlama operasyonlarını optimize ederek dijital reklamcılık serüvenini kolaylaştırmak, dönüşüm oranlarını artırmak ve veri analitiği sunmak amacıyla geliştirilmiş yenilikçi pazarlama platformu.",
      en: "Innovative marketing platform developed to simplify the digital advertising journey, increase conversion rates, and provide data analytics by optimizing campaign management processes and marketing operations."
    }
  },
  {
    id: "webiotrader",
    number: "05",
    repo: "dolphinay1 / webiotrader-web",
    url: "http://webiotrader.com",
    starCount: 9,
    configFile: "tradingview-setup.js",
    category: { tr: "YATIRIM PORTALİ", en: "TRADING PORTAL" },
    title: { tr: "WebioTrader", en: "WebioTrader" },
    fileTimes: {
      tr: ["2 hafta önce", "2 hafta önce", "3 hafta önce", "1 ay önce"],
      en: ["2 weeks ago", "2 weeks ago", "3 weeks ago", "1 month ago"]
    },
    desc: {
      tr: "Gerçek zamanlı piyasa veri akışları, gelişmiş grafik analiz araçları ve interaktif portföy izleme modülleriyle donatılmış, yüksek performanslı kurumsal finansal işlem ve analiz portalı.",
      en: "High-performance enterprise financial transaction and analysis portal equipped with real-time market data streams, advanced chart analysis tools, and interactive portfolio monitoring modules."
    }
  },
  {
    id: "teandsugar",
    number: "06",
    repo: "dolphinay1 / tea-sugar-backoffice",
    url: "https://github.com/dolphinay1/teandsugar",
    starCount: 14,
    configFile: "docker-compose.yml",
    category: { tr: "YÖNETİM PANELİ", en: "BACKOFFICE PANEL" },
    title: { tr: "Tea & Sugar", en: "Tea & Sugar" },
    fileTimes: {
      tr: ["3 hafta önce", "3 hafta önce", "1 ay önce", "1.5 ay önce"],
      en: ["3 weeks ago", "3 weeks ago", "1 month ago", "1.5 months ago"]
    },
    desc: {
      tr: "Gelişmiş spor istatistikleri veri modellerini, risk yönetimimi algoritmalarını ve çoklu dijital cüzdan bakiyelerini güvenli bir altyapıyla koordine eden, yüksek hacimli operasyonlara özel backoffice yönetim paneli.",
      en: "Specialized backoffice management panel for high-volume operations, coordinating advanced sports statistics data models, risk management algorithms, and multiple digital wallet balances under a secure infrastructure."
    }
  },
  {
    id: "tostlama",
    number: "07",
    repo: "dolphinay1 / tostlama-restoran",
    url: "https://tostlama.vercel.app",
    starCount: 11,
    configFile: ".env.example",
    category: { tr: "SAAS PLATFORMU", en: "SAAS PLATFORM" },
    title: { tr: "Tostlama", en: "Tostlama" },
    fileTimes: {
      tr: ["1 ay önce", "1 ay önce", "1.5 ay önce", "2 ay önce"],
      en: ["1 month ago", "1 month ago", "1.5 months ago", "2 months ago"]
    },
    desc: {
      tr: "Yiyecek-içecek sektörü işletmeleri için geliştirilmiş; anlık sipariş takibi, dinamik bulut tabanlı menü yönetimi ve temassız QR ödeme entegrasyonu sunan yeni nesil SaaS sipariş ve restoran yönetim platformu.",
      en: "New generation SaaS ordering and restaurant management platform for food and beverage sector businesses, offering instant order tracking, dynamic cloud-based menu management, and contactless QR payment integration."
    }
  },
  {
    id: "vertex",
    number: "08",
    repo: "dolphinay1 / vertex-telegram-bot",
    url: "https://github.com/dolphinay1/vertex-landing",
    starCount: 7,
    configFile: "webpack.config.js",
    category: { tr: "PAZARLAMA", en: "MARKETING" },
    title: { tr: "VerteX Markets", en: "VerteX Markets" },
    fileTimes: {
      tr: ["1.5 ay önce", "1.5 ay önce", "2 ay önce", "2.5 ay önce"],
      en: ["1.5 months ago", "1.5 months ago", "2 months ago", "2.5 months ago"]
    },
    desc: {
      tr: "Küresel finansal piyasalar için özel olarak tasarlanmış, yüksek dönüşüm odaklı dijital açılış sayfası (landing page) ve anlık işlem sinyallerini güvenle ileten otonom Telegram bot entegrasyonlu pazarlama altyapısı.",
      en: "High-conversion digital landing page specifically designed for global financial markets, featuring an autonomous Telegram bot integration that securely transmits real-time trading signals."
    }
  },
  {
    id: "future_ai",
    number: "09",
    repo: "dolphinay1 / ai-agents-orchestrator",
    url: "#",
    starCount: 22,
    configFile: "fastapi-app.py",
    category: { tr: "GELECEK PROJE", en: "UPCOMING PROJECT" },
    title: { tr: "AI Automation Hub", en: "AI Automation Hub" },
    fileTimes: {
      tr: ["2 ay önce", "2 ay önce", "2.5 ay önce", "3 ay önce"],
      en: ["2 months ago", "2 months ago", "2.5 months ago", "3 months ago"]
    },
    desc: {
      tr: "Gelecek Proje: Yapay zeka ajanlarının (AI Agents) iş akışlarını, karar alma mekanizmalarını ve API entegrasyonlarını tek bir panelden yöneten, otonom iş süreçleri tasarlama ve orkestrasyon sistemi.",
      en: "Upcoming Project: Autonomous workflow design and orchestration system for managing AI agents' tasks, decision-making mechanisms, and API integrations from a single control panel."
    }
  },
  {
    id: "future_web3",
    number: "10",
    repo: "dolphinay1 / web3-decentral-dashboard",
    url: "#",
    starCount: 19,
    configFile: "hardhat.config.js",
    category: { tr: "GELECEK PROJE", en: "UPCOMING PROJECT" },
    title: { tr: "Web3 Decentra Dashboard", en: "Web3 Decentra Dashboard" },
    fileTimes: {
      tr: ["3 ay önce", "3 ay önce", "3.5 ay önce", "4 ay önce"],
      en: ["3 months ago", "3 months ago", "3.5 months ago", "4 months ago"]
    },
    desc: {
      tr: "Gelecek Proje: Merkeziyetsiz finans (DeFi) ekosistemindeki likidite havuzları, yield farming gelirleri ve akıllı sözleşme cüzdan varlıklarını anlık veri akışlarıyla izleyen kapsamlı Web3 portföy takip ekranı.",
      en: "Upcoming Project: Comprehensive Web3 portfolio tracking dashboard that monitors liquidity pools, yield farming yields, and smart contract wallet assets in the decentralized finance (DeFi) ecosystem with real-time data streams."
    }
  }
];

let currentLang = "tr";

// Dynamic mockup generator
function renderProjects() {
  const container = document.querySelector(".projects-list");
  if (!container) return;

  container.innerHTML = "";

  projectsData.forEach((project) => {
    const card = document.createElement("div");
    card.className = "project-card";

    // Set translation text
    const categoryText = project.category[currentLang];
    const titleText = project.title[currentLang];
    const descText = project.desc[currentLang];
    const buttonText = currentLang === "tr" ? "PROJEYİ AÇ" : "LIVE PROJECT";

    // Extract dynamic file times
    const times = project.fileTimes[currentLang];

    card.innerHTML = `
      <div class="project-card__header">
        <div class="project-card__header-left">
          <span class="project-card__number hero-heading">${project.number}</span>
          <div class="project-card__info">
            <span class="project-card__category">${categoryText}</span>
            <h3 class="project-card__title">${titleText}</h3>
          </div>
        </div>
        ${project.url !== "#" ? `<a href="${project.url}" target="_blank" class="project-card__link-btn">${buttonText}</a>` : ""}
      </div>

      <div class="github-mockup">
        <!-- Mockup Header -->
        <div class="github-mockup__header">
          <div class="github-mockup__repo-info">
            <svg class="github-mockup__icon" height="16" viewBox="0 0 16 16" width="16"><path fill="#8b949e" fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
            <span class="github-mockup__path">dolphinay1 / <span class="github-mockup__path-repo">${project.id}</span></span>
            <span class="github-mockup__badge">Public</span>
          </div>
          <div class="github-mockup__star-btn">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><path fill="#8b949e" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694z"></path></svg>
            <span>Star ${project.starCount}</span>
          </div>
        </div>

        <!-- Files List with inline dates on the right -->
        <div class="github-mockup__files">
          <div class="github-mockup__file-row">
            <div class="github-mockup__file-info">
              <svg class="github-mockup__file-icon" aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><path fill="#cca01d" d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2A1.75 1.75 0 004.98 1H1.75z"></path></svg>
              <span>src</span>
            </div>
            <span class="github-mockup__file-time">${times[0]}</span>
          </div>
          <div class="github-mockup__file-row">
            <div class="github-mockup__file-info">
              <svg class="github-mockup__file-icon" aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><path fill="#8b949e" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.293 3.293c.329.329.513.774.513 1.237v9.207A1.75 1.75 0 0113.586 16H3.75A1.75 1.75 0 012 14.25V1.75zm1.5 0v12.5c0 .138.112.25.25.25h9.586a.25.25 0 00.25-.25V6h-3.25a1.75 1.75 0 01-1.75-1.75V1H3.75a.25.25 0 00-.25.25zM11 1.604V4.25c0 .138.112.25.25.25h2.646L11 1.604z"></path></svg>
              <span>package.json</span>
            </div>
            <span class="github-mockup__file-time">${times[1]}</span>
          </div>
          <div class="github-mockup__file-row">
            <div class="github-mockup__file-info">
              <svg class="github-mockup__file-icon" aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><path fill="#8b949e" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.293 3.293c.329.329.513.774.513 1.237v9.207A1.75 1.75 0 0113.586 16H3.75A1.75 1.75 0 012 14.25V1.75zm1.5 0v12.5c0 .138.112.25.25.25h9.586a.25.25 0 00.25-.25V6h-3.25a1.75 1.75 0 01-1.75-1.75V1H3.75a.25.25 0 00-.25.25zM11 1.604V4.25c0 .138.112.25.25.25h2.646L11 1.604z"></path></svg>
              <span>${project.configFile}</span>
            </div>
            <span class="github-mockup__file-time">${times[2]}</span>
          </div>
          <div class="github-mockup__file-row">
            <div class="github-mockup__file-info">
              <svg class="github-mockup__file-icon" aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><path fill="#8b949e" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.293 3.293c.329.329.513.774.513 1.237v9.207A1.75 1.75 0 0113.586 16H3.75A1.75 1.75 0 012 14.25V1.75zm1.5 0v12.5c0 .138.112.25.25.25h9.586a.25.25 0 00.25-.25V6h-3.25a1.75 1.75 0 01-1.75-1.75V1H3.75a.25.25 0 00-.25.25zM11 1.604V4.25c0 .138.112.25.25.25h2.646L11 1.604z"></path></svg>
              <span>README.md</span>
            </div>
            <span class="github-mockup__file-time">${times[3]}</span>
          </div>
        </div>

        <!-- README block -->
        <div class="github-mockup__readme-container">
          <div class="github-mockup__readme">
            <div class="github-mockup__readme-header">
              <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16"><path fill="#8b949e" d="M0 1.75A.75.75 0 01.75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0111.006 1h4.245a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-4.507a2.25 2.25 0 00-1.591.659l-.622.621a.75.75 0 01-1.06 0l-.622-.621A2.25 2.25 0 005.258 13H.75a.75.75 0 01-.75-.75V1.75zm8.5 9.75a3.744 3.744 0 012.506-1h4.244V2.5h-4.244a2.25 2.25 0 00-2.25 2.25v6.75zM7 4.75A2.25 2.25 0 004.75 2.5H1.5v8.25h4.258a3.744 3.744 0 012.506 1V4.75z"></path></svg>
              <span>README.md</span>
            </div>
            <div class="github-mockup__readme-body">
              <h4 class="github-mockup__readme-title">${titleText}</h4>
              <div class="github-mockup__readme-divider"></div>
              <p class="github-mockup__readme-text">${descText}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Global setLanguage function triggered by the parent portfolio page
window.setLanguage = function (lang) {
  if (lang !== "tr" && lang !== "en") return;
  currentLang = lang;

  const mainTitleEl = document.getElementById("proj-main-title");
  if (mainTitleEl) {
    mainTitleEl.textContent = lang === "tr" ? "PROJELERİM" : "PROJECTS";
  }

  renderProjects();
};

// Render initial projects on page load
document.addEventListener("DOMContentLoaded", () => {
  renderProjects();
});
