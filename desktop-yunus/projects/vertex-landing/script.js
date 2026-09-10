const INSTRUMENTS = [
  {
    symbol: "XAU/USD",
    name: "Altın",
    yahooSymbol: "GC=F",
    prefix: "$",
    decimals: 2,
  },
  {
    symbol: "XAG/USD",
    name: "Gümüş",
    yahooSymbol: "SI=F",
    prefix: "$",
    decimals: 2,
  },
  {
    symbol: "BRENT",
    name: "Petrol",
    yahooSymbol: "BZ=F",
    prefix: "$",
    decimals: 2,
  },
  {
    symbol: "NASDAQ",
    name: "NASDAQ",
    yahooSymbol: "^IXIC",
    prefix: "",
    decimals: 2,
  },
  {
    symbol: "BIST 100",
    name: "BIST 100",
    yahooSymbol: "XU100.IS",
    prefix: "",
    decimals: 0,
  },
  {
    symbol: "BTC/USD",
    name: "Bitcoin",
    yahooSymbol: "BTC-USD",
    prefix: "$",
    decimals: 0,
  },
];
const INSIGHTS_DATA = {
  Altın: [
    {
      title: "DXY & Reel Faiz Korelasyonu",
      text: "FED'in dot plot projeksiyonları ve terminal rate beklentisi, DXY üzerinden altın ons fiyatını doğrudan fiyatlar. Reel faizler sıfıra yaklaştığında altın güvenli liman primini artırır.",
      tag: "Makroekonomi",
    },
    {
      title: "Teknik Formasyonlar",
      text: "Orta vadede Fibonacci %61.8 geri çekilme seviyeleri majör destek olarak çalışır. RSI(14) ve MACD sinyalleri ile momentum kırılımları (breakout) trend yönünü teyit eder.",
      tag: "Teknik Analiz",
    },
    {
      title: "Jeopolitik Risk Primi",
      text: "Küresel tedarik zinciri şokları ve çatışma riskleri piyasa volatilitesini artırdığında, fon yöneticileri (smart money) portföylerini altın ile hedge eder.",
      tag: "Temel Analiz",
    },
  ],
  Gümüş: [
    {
      title: "Endüstriyel Talep Rasyosu",
      text: "Küresel gümüş arzının %50'sinden fazlası PV (güneş panelleri) ve EV sektörüne akar. PMI verilerindeki genişleme gümüş endüstriyel talebini destekler.",
      tag: "Sektörel",
    },
    {
      title: "Gold/Silver Ratio (GSR)",
      text: "Tarihsel ortalaması 60-80 bandında olan GSR rasyosu daraldığında, gümüş altına kıyasla out-perform eder (daha hızlı değer kazanır).",
      tag: "Teknik Analiz",
    },
    {
      title: "Enflasyon Hedge Dinamiği",
      text: "Yüksek beta karakteristiği ile gümüş, enflasyonist baskı dönemlerinde hem sanayi metali hem de değerli maden olarak asimetrik getiri potansiyeli sunar.",
      tag: "Makroekonomi",
    },
  ],
  Petrol: [
    {
      title: "OPEC+ Arz Politikaları",
      text: "Üretim kesintisi kotaları ve stratejik petrol rezervi (SPR) verileri, global supply-demand dengesini oluşturur. Backwardation piyasa yapısı fiyatları yukarı iter.",
      tag: "Temel Analiz",
    },
    {
      title: "Çin Endüstriyel Büyümesi",
      text: "Dünyanın en büyük petrol ithalatçısı olan Çin'in sanayi üretimi ve imalat PMI verileri, varil talebi projeksiyonlarının öncü göstergesidir.",
      tag: "Makroekonomi",
    },
    {
      title: "EIA Haftalık Stok Verileri",
      text: "ABD haftalık ham petrol envanterleri (Crude Oil Inventories), Cushing Oklahoma doluluk oranları kısa vadeli fiyat aksiyonunu (price action) belirler.",
      tag: "Veri Takibi",
    },
  ],
  NASDAQ: [
    {
      title: "Bilanço Sezonu (Earnings)",
      text: "Magnificent 7 (Muhteşem Yedili) teknoloji devlerinin EPS (Hisse Başına Kar) ve forward guidance raporları endeksin beta katsayısını yönlendirir.",
      tag: "Sektörel",
    },
    {
      title: "Tahvil Getirileri (Yields)",
      text: "10 yıllık ABD Hazine tahvil getirileri (US10Y) ile ters korelasyon. İskonto oranları düştüğünde büyüme (growth) hisselerinin bugünkü değeri artar.",
      tag: "Makroekonomi",
    },
    {
      title: "AI CapEx Yatırımları",
      text: "Yapay zeka altyapısına yönelik kurumsal sermaye harcamaları (CapEx), yarı iletken ve bulut bilişim şirketlerinin ralli yakıtını oluşturur.",
      tag: "Trend",
    },
  ],
  "BIST 100": [
    {
      title: "TCMB Para Politikası",
      text: "Politika faizi, likidite adımları ve enflasyon raporu sunumları, TL varlıkların risksiz getiri alternatifini belirleyerek hisse senedi çarpanlarını etkiler.",
      tag: "Makroekonomi",
    },
    {
      title: "Yabancı Takas Oranı",
      text: "Yurt dışı yerleşiklerin hisse senedi portföy girişleri (foreign inflows) ve CDS (Kredi Temerrüt Takası) primlerindeki düşüş trendin ivmesini belirler.",
      tag: "Fon Akışı",
    },
    {
      title: "Kur Korumalı Maliyet",
      text: "Dolar/TL paritesindeki stabilizasyon veya hareketlilik, BIST'teki ihracatçı ve ithalatçı şirketlerin (FX pozisyonlarına göre) bilanço beklentilerini şekillendirir.",
      tag: "Döviz",
    },
  ],
  Bitcoin: [
    {
      title: "On-Chain Metrikleri",
      text: "Madencilik zorluk derecesi, hash rate, borsa rezervleri (exchange netflow) ve balina cüzdan hareketleri, arz şoku ve talep dengesini gösterir.",
      tag: "On-Chain",
    },
    {
      title: "Kurumsal Adaptasyon",
      text: "Spot ETF (Borsa Yatırım Fonu) net para girişleri ve kurumsal hazine alımları (ör. MicroStrategy), derinlik ve likiditeyi artırarak kurumsal FOMO yaratır.",
      tag: "Trend",
    },
    {
      title: "Regülasyon Baskısı",
      text: 'SEC/CFTC davaları, MiCA regülasyonları ve FED faiz döngüsü kriptonun "risk-on" varlık olarak fiyatlanma elastikiyetini (beta) test eder.',
      tag: "Yasal",
    },
  ],
};
const priceCache = {};
let currentIndex = 0;
let autoRotateInterval = null;
document.addEventListener("DOMContentLoaded", () => {
  const heroInstrument = document.getElementById("heroInstrument");
  const heroDirection = document.getElementById("heroDirection");
  const cardSymbol = document.getElementById("cardSymbol");
  const cardChange = document.getElementById("cardChange");
  const cardPrice = document.getElementById("cardPrice");
  const cardUpdate = document.getElementById("cardUpdate");
  const chartLine = document.getElementById("chartLine");
  const chartArea = document.getElementById("chartArea");
  const cardTabs = document.getElementById("cardTabs");
  const insightTabs = document.getElementById("insightTabs");
  const insightsGrid = document.getElementById("insightsGrid");
  INSTRUMENTS.forEach((inst, i) => {
    const tab = document.createElement("button");
    tab.className = `hero__card-tab${i === 0 ? " active" : ""}`;
    tab.textContent = inst.name;
    tab.addEventListener("click", () => {
      switchTo(i);
      resetAutoRotate();
    });
    cardTabs.appendChild(tab);
  });
  INSTRUMENTS.forEach((inst, i) => {
    const tab = document.createElement("button");
    tab.className = `insight-tab${i === 0 ? " active" : ""}`;
    tab.textContent = inst.name;
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".insight-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderInsights(inst.name);
    });
    insightTabs.appendChild(tab);
  });
  const pc = document.getElementById("particles");
  for (let i = 0; i < 25; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.left = Math.random() * 100 + "%";
    const s = Math.random() * 3 + 1 + "px";
    p.style.width = s;
    p.style.height = s;
    p.style.animationDuration = Math.random() * 15 + 10 + "s";
    p.style.animationDelay = Math.random() * 10 + "s";
    pc.appendChild(p);
  }
  window.addEventListener("scroll", () => {
    document
      .getElementById("nav")
      .classList.toggle("nav--scrolled", window.scrollY > 60);
  });
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("animate-in");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  document
    .querySelectorAll(
      ".aibot__container, .contact__info, .contact__form-wrapper, .faq",
    )
    .forEach((el) => obs.observe(el));
  document.querySelectorAll(".faq-item__header").forEach((header) => {
    header.addEventListener("click", () => {
      const item = header.parentElement;
      const isActive = item.classList.contains("active");
      document
        .querySelectorAll(".faq-item")
        .forEach((i) => i.classList.remove("active"));
      if (!isActive) item.classList.add("active");
    });
  });
  async function fetchPrice(inst) {
    const cached = priceCache[inst.yahooSymbol];
    if (cached && Date.now() - cached.ts < 60000) return cached.data;
    try {
      const url = `/api/yahoo/${encodeURIComponent(inst.yahooSymbol)}?interval=1d&range=1d`;
      const res = await fetch(url);
      const json = await res.json();
      const meta = json.chart.result[0].meta;
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose;
      const change = ((price - prevClose) / prevClose) * 100;
      const result = {
        price,
        change,
        prevClose,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
      };
      priceCache[inst.yahooSymbol] = { data: result, ts: Date.now() };
      return result;
    } catch (err) {
      console.warn(`Yahoo API error for ${inst.symbol}:`, err);
      if (cached) return cached.data;
      return { price: 0, change: 0, prevClose: 0, high: 0, low: 0 };
    }
  }
  async function fetchChartData(inst) {
    try {
      const url = `/api/yahoo/${encodeURIComponent(inst.yahooSymbol)}?interval=15m&range=1d`;
      const res = await fetch(url);
      const json = await res.json();
      const quotes = json.chart.result[0].indicators.quote[0];
      return quotes.close.filter((v) => v !== null);
    } catch {
      return genChart();
    }
  }
  function genChart() {
    const pts = [];
    let v = 50;
    for (let i = 0; i < 24; i++) {
      v += (Math.random() - 0.48) * 8;
      v = Math.max(10, Math.min(90, v));
      pts.push(v);
    }
    return pts;
  }
  function updateCard(inst, data) {
    const isUp = data.change >= 0;
    cardSymbol.textContent = inst.symbol;
    const parts = data.price.toFixed(inst.decimals).split(".");
    const intPart = Number(parts[0]).toLocaleString("en-US");
    cardPrice.innerHTML = `${inst.prefix}${intPart}${parts[1] ? `<span class="hero__card-decimal">.${parts[1]}</span>` : ""}`;
    cardPrice.classList.add("price-flash");
    setTimeout(() => cardPrice.classList.remove("price-flash"), 600);
    cardChange.textContent = `${isUp ? "▲" : "▼"} ${isUp ? "+" : ""}${data.change.toFixed(2)}%`;
    cardChange.className = `hero__card-change ${isUp ? "positive" : "negative"}`;
    chartLine.setAttribute("stroke", isUp ? "#22c55e" : "#ef4444");
    chartArea.setAttribute(
      "fill",
      isUp ? "url(#chartGradUp)" : "url(#chartGradDown)",
    );
    cardUpdate.textContent = `Son güncelleme: ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  function drawChart(pts) {
    if (!pts || pts.length < 2) return;
    const w = 300,
      h = 80,
      pad = 2;
    const min = Math.min(...pts),
      max = Math.max(...pts),
      range = max - min || 1;
    const coords = pts.map((v, i) => ({
      x: (i / (pts.length - 1)) * w,
      y: h - pad - ((v - min) / range) * (h - pad * 2),
    }));
    let d = `M${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const cpx = (coords[i - 1].x + coords[i].x) / 2;
      d += ` C${cpx},${coords[i - 1].y} ${cpx},${coords[i].y} ${coords[i].x},${coords[i].y}`;
    }
    chartLine.setAttribute("d", d);
    chartArea.setAttribute("d", `${d} L${w},${h} L0,${h} Z`);
  }
  function animateText(inst, data) {
    const isUp = data.change >= 0;
    const dirText = heroDirection.querySelector(".direction-text");
    heroInstrument.classList.add("fade-out");
    dirText.classList.add("fade-out");
    setTimeout(() => {
      heroInstrument.textContent = inst.name;
      dirText.textContent = isUp ? "Yükseliyor?" : "Düşüyor?";
      dirText.className = `direction-text ${isUp ? "direction-up" : "direction-down"}`;
      heroInstrument.classList.remove("fade-out");
      heroInstrument.classList.add("fade-in");
      dirText.classList.remove("fade-out");
      dirText.classList.add("fade-in");
      requestAnimationFrame(() => {
        heroInstrument.classList.remove("fade-in");
        dirText.classList.remove("fade-in");
      });
    }, 400);
  }
  const SVG_ICONS = [
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4Z"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  ];
  function renderInsights(name) {
    const data = INSIGHTS_DATA[name] || INSIGHTS_DATA["Altın"];
    insightsGrid.innerHTML = "";
    data.forEach((item, i) => {
      const card = document.createElement("article");
      card.className = "insight-card animate-in";
      card.dataset.index = String(i + 1).padStart(2, "0");
      card.innerHTML = `<div class="insight-card__icon">${SVG_ICONS[i % 3]}</div><h3 class="insight-card__title">${item.title}</h3><p class="insight-card__text">${item.text}</p><div class="insight-card__tag">${item.tag}</div>`;
      insightsGrid.appendChild(card);
    });
  }
  async function switchTo(index, animate = true) {
    currentIndex = index;
    const inst = INSTRUMENTS[index];
    document
      .querySelectorAll(".hero__card-tab")
      .forEach((t, i) => t.classList.toggle("active", i === index));
    const [priceData, chartData] = await Promise.all([
      fetchPrice(inst),
      fetchChartData(inst),
    ]);
    if (animate) animateText(inst, priceData);
    else {
      heroInstrument.textContent = inst.name;
      const dt = heroDirection.querySelector(".direction-text");
      dt.textContent = priceData.change >= 0 ? "Yükseliyor?" : "Düşüyor?";
      dt.className = `direction-text ${priceData.change >= 0 ? "direction-up" : "direction-down"}`;
    }
    updateCard(inst, priceData);
    drawChart(chartData);
  }
  function startAutoRotate() {
    autoRotateInterval = setInterval(
      () => switchTo((currentIndex + 1) % INSTRUMENTS.length),
      5000,
    );
  }
  function resetAutoRotate() {
    clearInterval(autoRotateInterval);
    startAutoRotate();
  }
  const terminalLines = [
    '<span class="t-gray">[${time}]</span> <span class="t-muted">SYSTEM:</span> Algoritmik tarama başlatıldı...',
    '<span class="t-gold">XAU/USD</span> — Fibonacci %61.8 desteğinden tepki hacmi artıyor',
    '<span class="t-green">▲ AL SİNYALİ:</span> BTC/USD RSI(14) pozitif uyumsuzluk gösteriyor',
    '<span class="t-red">▼ DİKKAT:</span> BRENT VIX endeksiyle korelasyon kırılımı test ediliyor',
    '<span class="t-gold">XAG/USD</span> — Endüstriyel arz şoku algılanıyor, likidite dar',
    '<span class="t-green">▲ BIST100</span> Yabancı (foreign inflows) takas oranı %38.2 direncini aştı',
    '<span class="t-gray">[${time}]</span> <span class="t-muted">HFT ENGINE:</span> Makro senaryolar güncellendi ✓',
    '<span class="t-gold">NASDAQ</span> — Opsiyon piyasasında put/call rasyosu ekstrem bölgede',
    '<span class="t-red">▼ RİSK UYARISI:</span> FED faiz swapları beklentileri 25bps yukarı çekti',
    '<span class="t-green">▲ FIRSAT:</span> Gümüş/Altın (GSR) paritesinde tarihsel mean-reversion fırsatı',
  ];
  const terminal = document.getElementById("aiTerminal");
  let termIdx = 0;
  setInterval(() => {
    if (!terminal) return;
    const time = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const line = terminalLines[termIdx % terminalLines.length].replace(
      /\$\{time\}/g,
      time,
    );
    const div = document.createElement("div");
    div.className = "terminal-line terminal-new";
    div.innerHTML = line;
    terminal.appendChild(div);
    if (terminal.children.length > 7) terminal.removeChild(terminal.firstChild);
    terminal.scrollTop = terminal.scrollHeight;
    termIdx++;
  }, 2500);
  switchTo(0, false);
  renderInsights("Altın");
  startAutoRotate();
  setInterval(() => {
    switchTo(currentIndex, false);
  }, 60000);
  document.getElementById("leadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerHTML =
      '<span>Gönderiliyor...</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>';
    const leadData = {
      fullName: document.getElementById("fullName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      interest: document.getElementById("interest").value,
      message: document.getElementById("message").value,
    };
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
      const result = await res.json();
      if (result.ok) {
        document.getElementById("formSuccess").classList.add("active");
      } else {
        alert("Gönderim sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        btn.disabled = false;
        btn.innerHTML =
          '<span>Ücretsiz Rapor Talebini İlet</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      }
    } catch (err) {
      console.error("Lead submit error:", err);
      document.getElementById("formSuccess").classList.add("active");
    }
  });
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      document
        .querySelector(this.getAttribute("href"))
        ?.scrollIntoView({ behavior: "smooth" });
    });
  });
  document.getElementById("phone").addEventListener("input", (e) => {
    let v = e.target.value.replace(/[^\d+]/g, "");
    if (v.startsWith("5")) v = "+90" + v;
    e.target.value = v;
  });
  const copyBtn = document.getElementById("copyTetherBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const addr = document.getElementById("tetherAddress").textContent;
      navigator.clipboard.writeText(addr).then(() => {
        copyBtn.classList.add("copied");
        copyBtn.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
        }, 2000);
      });
    });
  }
  const depositBtn = document.getElementById("depositStartBtn");
  if (depositBtn) {
    depositBtn.addEventListener("click", () => {
      document
        .querySelector("#contact")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  }
});
const s = document.createElement("style");
s.textContent =
  "@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}";
document.head.appendChild(s);
