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
    title: "Crypdolfin",
    desc: "Kripto para analizi, büyüme stüdyosu ve Web3 portfolyo platformu. Blockchain veri analitiği, modern cüzdan takipleri ve yatırımcı özetleri içerir.",
    tags: ["Web3", "Next.js", "Tailwind CSS", "Ethers.js"],
    img: "./images/proj1.png",
    url: "https://github.com/dolphinay1/crypdolfin-portfolio"
  },
  excel_conversion: {
    title: "Excel Converter",
    desc: "Karmaşık Excel ve CSV ham veri tabanlarını otomatik olarak temizleyen, B2B lead listelerini yapılandıran ve normalize eden gelişmiş veri dönüşüm aracı.",
    tags: ["Python", "Pandas", "OpenPyXL", "Data Processing"],
    img: "./images/proj2.png",
    url: "https://github.com/dolphinay1/excel_conversion"
  },
  lead_bot: {
    title: "B2B Lead Bot",
    desc: "Google Haritalar ve LinkedIn gibi platformlardan B2B şirket e-postalarını, telefon numaralarını ve sosyal medya bağlantılarını toplayan Playwright tabanlı kazıma botu.",
    tags: ["Node.js", "Playwright", "Web Scraping", "Automation"],
    img: "./images/proj3.png",
    url: "https://github.com/dolphinay1/lead_bot"
  },
  marketbot: {
    title: "MarketBot",
    desc: "Kripto para borsalarında likidite sağlamak ve fiyat farklarından yararlanmak amacıyla geliştirilmiş otomatik piyasa yapıcı ve arbitraj botu.",
    tags: ["Python", "WebSockets", "Binance API", "Algorithmic Trading"],
    img: "./images/proj4.png",
    url: "https://github.com/dolphinay1/marketbot"
  },
  webiotrader: {
    title: "WebioTrader",
    desc: "Finansal işlemler, grafik analizleri ve pazar takipleri sunan, webiotrader.com üzerinde barındırılan interaktif portföy yönetim portalı.",
    tags: ["HTML5", "CSS3", "Vanilla JS", "TradingView Widgets"],
    img: "./images/proj5.png",
    url: "http://webiotrader.com"
  },
  teandsugar: {
    title: "Tea & Sugar",
    desc: "Spor istatistiklerini, bahis kasalarını ve cüzdan bakiyelerini yönetmek için tasarlanmış geniş kapsamlı backoffice yönetim paneli.",
    tags: ["React", "Express.js", "MongoDB", "Admin Panel"],
    img: "./images/proj6.png",
    url: "https://github.com/dolphinay1/teandsugar"
  },
  tostlama: {
    title: "Tostlama",
    desc: "Restoran ve kafeler için tasarlanmış, tostlama.vercel.app adresinde yayınlanan, temassız karekod (QR) menü sipariş ve yönetim platformu.",
    tags: ["React.js", "Next.js", "Firebase Realtime DB", "QR System"],
    img: "./images/proj7.png",
    url: "https://tostlama.vercel.app"
  },
  vertex: {
    title: "VerteX Markets",
    desc: "Modern finans pazarlarına yönelik premium açılış sayfası (landing page) ve Telegram sinyal entegrasyonu sunan pazarlama platformu.",
    tags: ["CSS Grid", "Animations", "Telegram Bot API", "UI/UX"],
    img: "./images/proj8.png",
    url: "https://github.com/dolphinay1/vertex-landing"
  },
  future_ai: {
    title: "AI Automation Hub",
    desc: "Gelecek Proje: Yapay zeka ajanlarını (AI Agents) tek bir merkezden yöneten, otonom iş akışları ve API orkestrasyon paneli.",
    tags: ["AI Agents", "LangChain", "Node.js", "FastAPI"],
    img: "./images/proj9.png",
    url: "#"
  },
  future_web3: {
    title: "Web3 Decentra Dashboard",
    desc: "Gelecek Proje: Kullanıcıların DeFi protokollerindeki tüm varlık ve yield farming metriklerini tek bir ekranda toplayan gösterge paneli.",
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
