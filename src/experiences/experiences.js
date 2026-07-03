/**
 * Experiences Module — Scoped version of original yunus/scroll/script.js
 * Contains the 10 work experiences with TR/EN dynamic translation support.
 */

const ExperiencesModule = (() => {
  // Define all state variables at the top to prevent temporal dead zone (TDZ) errors
  let lenis = null;
  let rafId = null;
  let items = [];
  let currentLang = 'tr';
  let initialized = false;
  let lastTime = 0;

  let world = null;
  let viewport = null;
  let feedbackVel = null;
  let feedbackFPS = null;
  let mouseMoveHandler = null;
  let fallbackWheelHandler = null;

  const CONFIG = {
    starCount: 150,
    zGap: 800,
    camSpeed: 2.5,
    colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff']
  };

  const TEXTS = {
    tr: ["DENEYIMLER", "TEKNOLOJI", "ORGANIZASYON", "HIZMET", "MEDYA"],
    en: ["EXPERIENCES", "TECHNOLOGY", "ORGANIZATION", "HOSPITALITY", "MEDIA"]
  };

  const EXPERIENCES = {
    tr: [
      {
        id: "EXP-001",
        company: "X Kurumu (Yurtdışı)",
        position: "IT Müdürü & Marketing Ekip Kaptanı",
        description: "Bilgi teknolojileri altyapısını yönetirken çok kültürlü marketing ekibine liderlik ettim. IT sistemleri entegrasyonu ve veri güvenliğini sağlayarak operasyonları dijitalleştirdim. Marka bilinirliğini artıracak global marketing stratejileri kurguladım.",
        duration: "Ağustos 2025 – Haziran 2026",
        field: "Yazılım & Pazarlama"
      },
      {
        id: "EXP-002",
        company: "Marketing Yönetimi",
        position: "Freelancer",
        description: "Kurumların global büyüme hedeflerine yönelik veriye dayalı dijital pazarlama stratejileri kurguladım. Marka bilinirliğine doğrudan katkı sağlayarak pazarlama kampanyalarının verimliliğini optimize ettim.",
        duration: "4+ Yıl",
        field: "Dijital Pazarlama"
      },
      {
        id: "EXP-003",
        company: "PC Abi",
        position: "Kurucu / Satış & Teknik Servis",
        description: "Online satış stratejileriyle müşteri portföyünü %70 artırdım. Teknik servis süreçlerini optimize ederek teslimat sürelerini düşürdüm. Stok, müşteri ilişkisi ve fiyatlandırma dahil tüm operasyonu bireysel yürüttüm.",
        duration: "1 Yıl 5 Ay",
        field: "Teknoloji & Girişim"
      },
      {
        id: "EXP-004",
        company: "Saha Ekip Koordinatörü",
        position: "Freelancer",
        description: "Organizasyon projeleri için dönemsel personel tedarik süreçlerini uçtan uca yönettim. Aday arama, mülakat, seçme ve operasyon bazlı yerleştirme aşamalarını koordine ettim. Sahada ekibin sevk, idare ve performans denetimini üstlendim.",
        duration: "6 Ay",
        field: "Saha Koordinasyon"
      },
      {
        id: "EXP-005",
        company: "Ayvalık (Yerel Esnaf)",
        position: "Operasyon Sorumlusu",
        description: "Servis, karşılama ve mutfak ekiplerini koordine ettim. Yoğun saatlerde ekip liderliği yaparak hizmet kalitesini artırdım. Tedarik ve stok süreçlerini yöneterek maliyet kontrolüne doğrudan katkı sağladım.",
        duration: "6 Ay",
        field: "Operasyon Yönetimi"
      },
      {
        id: "EXP-006",
        company: "Yemeksepeti",
        position: "Saha Dağıtım Sorumlusu (Kurye)",
        description: "Teslimat süreçlerinde rota ve zaman optimizasyonu yaptım. Yoğun çalışma saatlerinde hatasız ve hızlı teslimat sağlayarak operasyonel verimlilik ve müşteri memnuniyeti hedeflerine katkıda bulundum.",
        duration: "8 Ay",
        field: "Lojistik & Dağıtım"
      },
      {
        id: "EXP-007",
        company: "Ayvalık Fly Beach",
        position: "Servis Sorumlusu",
        description: "Sipariş, kasa ve vardiya planlaması süreçlerini yönettim. POS sistemleri üzerinden günlük satış raporları hazırladım. Müşteri memnuniyetini koruma odaklı olarak şikayetlerin çözümünde birebir sorumluluk aldım.",
        duration: "5 Ay",
        field: "Hizmet Sektörü"
      },
      {
        id: "EXP-008",
        company: "Kat Sorumlusu",
        position: "Avlu Bomonti, Şişli",
        description: "Rezervasyon karşılama, masa koordinasyonu ve müşteri taleplerine yanıt verdim. Günlük personel planlaması ve servis içi kontrol süreçlerinde operasyonel sorumluluk üstlendim.",
        duration: "4 Ay",
        field: "Hizmet & Rezervasyon"
      },
      {
        id: "EXP-009",
        company: "Point Hotel Taksim",
        position: "Stajyer",
        description: "Garsonluk, meydancılık, spa ve kat görevlisi olarak çeşitli birimlerde görev alarak lüks otel operasyonları hakkında kapsamlı saha tecrübesi kazandım.",
        duration: "9 Ay",
        field: "Turizm & Otelcilik"
      },
      {
        id: "EXP-010",
        company: "Siente Tekstil",
        position: "Sosyal Medya Yönetimi (Freelancer)",
        description: "Kurumun dijital kanallarını yöneterek sosyal medya etkileşim oranlarını %45 oranında artırdım. Özgün içerik planlaması ve hedef kitle analiziyle marka bilinirliğini güçlendirdim.",
        duration: "6 Ay",
        field: "Sosyal Medya & İçerik"
      }
    ],
    en: [
      {
        id: "EXP-001",
        company: "X Institution (Abroad)",
        position: "IT Manager & Marketing Team Leader",
        description: "Led a multicultural marketing team while managing the IT infrastructure. Digitalized operational processes by ensuring system integration and data security. Developed global digital marketing strategies to boost brand awareness.",
        duration: "August 2025 – June 2026",
        field: "IT & Digital Marketing"
      },
      {
        id: "EXP-002",
        company: "Marketing Management",
        position: "Freelancer",
        description: "Designed data-driven digital marketing strategies aligned with international expansion goals. Directly increased brand awareness and optimized the performance of global marketing campaigns.",
        duration: "4+ Years",
        field: "Digital Marketing"
      },
      {
        id: "EXP-003",
        company: "PC Abi",
        position: "Founder / Sales & Tech Support",
        description: "Grew customer portfolio by 70% using online sales strategies. Optimized technical service workflows to reduce delivery times. Managed all business operations single-handedly: inventory, customer relations, pricing.",
        duration: "1 Year 5 Months",
        field: "Tech & Entrepreneurship"
      },
      {
        id: "EXP-004",
        company: "Field Team Coordinator",
        position: "Freelancer",
        description: "Managed end-to-end recruitment and staffing for event projects. Coordinated candidate screening, interviews, selection, and operational placements. Controlled field operations, team administration, and performance reviews to ensure service quality.",
        duration: "6 Months",
        field: "Event Operations"
      },
      {
        id: "EXP-005",
        company: "Ayvalık (Local Business)",
        position: "Operations Supervisor",
        description: "Coordinated service, hosting, and kitchen teams. Led operations during busy hours to increase service quality. Managed supply chain and inventory levels to contribute to cost control.",
        duration: "6 Months",
        field: "Operations"
      },
      {
        id: "EXP-006",
        company: "Yemeksepeti",
        position: "Field Delivery Logistics",
        description: "Optimized route planning and time management for food delivery processes. Contributed to customer satisfaction by ensuring zero-error delivery performance during peak operational hours.",
        duration: "8 Months",
        field: "Logistics & Delivery"
      },
      {
        id: "EXP-007",
        company: "Ayvalık Fly Beach",
        position: "Service Supervisor",
        description: "Managed guest orders, checkout operations, and shift scheduling. Prepared daily sales reports using POS systems. Took direct responsibility for resolving customer complaints and maintaining guest satisfaction.",
        duration: "5 Months",
        field: "Hospitality"
      },
      {
        id: "EXP-008",
        company: "Floor Supervisor",
        position: "Avlu Bomonti, Sisli",
        description: "Handled reservation hosting, table coordination, and customer relations. Took charge of daily staff shift planning and in-service quality control audits.",
        duration: "4 Months",
        field: "Hospitality & Hosting"
      },
      {
        id: "EXP-009",
        company: "Point Hotel Taksim",
        position: "Intern",
        description: "Worked across multiple departments including service, housekeeping, spa, and front-desk. Gained comprehensive operational experience and knowledge in luxury hotel management.",
        duration: "9 Months",
        field: "Tourism & Hotel Mgmt"
      },
      {
        id: "EXP-010",
        company: "Siente Tekstil",
        position: "Social Media Specialist (Freelancer)",
        description: "Managed social media platforms and successfully grew engagement rates by 45%. Strengthened follower interactions and brand image through original content planning and audience analysis.",
        duration: "6 Months",
        field: "Social Media & Content"
      }
    ]
  };

  const state = {
    scroll: 0,
    velocity: 0,
    targetSpeed: 0,
    mouseX: 0,
    mouseY: 0
  };

  function buildScene() {
    if (!world) return;

    world.innerHTML = '';
    items = [];

    const exps = EXPERIENCES[currentLang];
    const headings = TEXTS[currentLang];

    // Layout arrangement:
    // 0: heading ("DENEYIMLER" / "EXPERIENCES")
    // 1-2: cards (IT Müdürü, Marketing)
    // 3: heading ("TEKNOLOJI" / "TECHNOLOGY")
    // 4: card (PC Abi)
    // 5: heading ("ORGANIZASYON" / "ORGANIZATION")
    // 6-8: cards (Saha Ekip, Ayvalık Yerel, Yemeksepeti)
    // 9: heading ("HIZMET" / "HOSPITALITY")
    // 10-12: cards (Ayvalık Fly Beach, Kat Sorumlusu, Point Hotel)
    // 13: heading ("MEDYA" / "MEDIA")
    // 14: card (Siente Tekstil)
    const sceneItems = [
      { type: 'heading', value: headings[0] }, // Index 0
      { type: 'card', value: exps[0], index: 0 },
      { type: 'card', value: exps[1], index: 1 },
      { type: 'heading', value: headings[1] }, // Index 3
      { type: 'card', value: exps[2], index: 2 },
      { type: 'heading', value: headings[2] }, // Index 5
      { type: 'card', value: exps[3], index: 3 },
      { type: 'card', value: exps[4], index: 4 },
      { type: 'card', value: exps[5], index: 5 },
      { type: 'heading', value: headings[3] }, // Index 9
      { type: 'card', value: exps[6], index: 6 },
      { type: 'card', value: exps[7], index: 7 },
      { type: 'card', value: exps[8], index: 8 },
      { type: 'heading', value: headings[4] }, // Index 13
      { type: 'card', value: exps[9], index: 9 }
    ];

    CONFIG.itemCount = sceneItems.length;
    CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

    // Use window dimensions to guarantee calculations are non-zero even before layout reflow
    const referenceWidth = window.innerWidth;
    const referenceHeight = window.innerHeight;

    sceneItems.forEach((itemData, i) => {
      const el = document.createElement('div');
      el.className = 'item';

      if (itemData.type === 'heading') {
        const txt = document.createElement('div');
        txt.className = 'big-text';
        txt.innerText = itemData.value;
        el.appendChild(txt);
        items.push({
          el, type: 'text',
          x: 0, y: 0, rot: 0,
          baseZ: -i * CONFIG.zGap
        });
      } else {
        const exp = itemData.value;
        const card = document.createElement('div');
        card.className = 'card';
        const randId = Math.floor(1000 + Math.random() * 9000);
        card.innerHTML = `
          <div class="card-header">
              <span class="card-id">ID-${randId}</span>
              <div style="width: 10px; height: 10px; background: var(--accent);"></div>
          </div>
          <h2>${exp.company}</h2>
          <div class="exp-position">${exp.position}</div>
          <div class="exp-desc">${exp.description}</div>
          <div class="card-footer">
              <span>DURATION: ${exp.duration}</span>
              <span>FIELD: ${exp.field}</span>
          </div>
          <div style="position:absolute; bottom:2rem; right:2rem; font-size:4rem; opacity:0.1; font-weight:900; font-family: var(--font-display); color: #fff;">0${itemData.index + 1}</div>
        `;
        el.appendChild(card);

        // Spiral positioning based on index relative to window dimensions
        const angle = (i / sceneItems.length) * Math.PI * 6;
        const x = Math.cos(angle) * (referenceWidth * 0.28);
        const y = Math.sin(angle) * (referenceHeight * 0.25);
        const rot = (Math.random() - 0.5) * 30;

        items.push({
          el, type: 'card',
          x, y, rot,
          baseZ: -i * CONFIG.zGap
        });
      }
      world.appendChild(el);
    });

    // Create Stars
    for (let i = 0; i < CONFIG.starCount; i++) {
      const el = document.createElement('div');
      el.className = 'star';
      world.appendChild(el);
      items.push({
        el, type: 'star',
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        baseZ: -Math.random() * CONFIG.loopSize
      });
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;

    world = document.getElementById('world');
    viewport = document.getElementById('viewport');
    feedbackVel = document.getElementById('vel-readout');
    feedbackFPS = document.getElementById('fps');

    if (!world) return;

    // Reset lang toggle buttons classes on init
    currentLang = 'tr';
    const trBtn = document.getElementById('expLangTR');
    const enBtn = document.getElementById('expLangEN');
    if (trBtn) trBtn.classList.add('active');
    if (enBtn) enBtn.classList.remove('active');

    buildScene();

    // Mouse Move event contained inside window body
    const body = document.querySelector('.exp-window-body');
    mouseMoveHandler = (e) => {
      const rect = body.getBoundingClientRect();
      state.mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      state.mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    if (body) {
      body.addEventListener('mousemove', mouseMoveHandler);
    }

    // Initialize Lenis within scrollable wrapper to prevent page scrolling
    const scrollWrapper = body.querySelector('.exp-scroll-wrapper');
    const scrollProxy = body.querySelector('.scroll-proxy');
    
    try {
      if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
          wrapper: scrollWrapper,
          content: scrollProxy || scrollWrapper,
          eventsTarget: body,
          smooth: true,
          lerp: 0.08,
          direction: 'vertical',
          gestureDirection: 'vertical',
          smoothTouch: true
        });

        lenis.on('scroll', ({ scroll, velocity }) => {
          state.scroll = scroll;
          state.targetSpeed = velocity;
        });
      } else {
        throw new Error("Lenis library not loaded");
      }
    } catch (err) {
      console.warn("Lenis failed, using fallback scroll:", err);
      fallbackWheelHandler = (e) => {
        state.scroll += e.deltaY * 0.6;
        state.targetSpeed = e.deltaY * 0.35;
      };
      body.addEventListener('wheel', fallbackWheelHandler, { passive: true });
    }

    if (trBtn) {
      trBtn.onclick = () => switchLanguage('tr');
    }
    if (enBtn) {
      enBtn.onclick = () => switchLanguage('en');
    }

    lastTime = performance.now();
    rafId = requestAnimationFrame(raf);
  }

  function raf(time) {
    if (lenis) lenis.raf(time);

    // FPS
    const delta = time - lastTime;
    lastTime = time;
    if (feedbackFPS && time % 10 < 1) feedbackFPS.innerText = Math.round(1000 / delta);

    // Smooth Velocity & Friction Decay
    state.velocity += (state.targetSpeed - state.velocity) * 0.1;
    state.targetSpeed *= 0.92;

    // HUD Updates
    if (feedbackVel) feedbackVel.innerText = Math.abs(state.velocity).toFixed(2);
    const coordEl = document.getElementById('coord');
    if (coordEl) coordEl.innerText = `${state.scroll.toFixed(0)}`;

    const debugEl = document.getElementById('exp-debug-log');
    if (debugEl) {
      const firstItem = items[0];
      const details = firstItem ? `Opacity: ${firstItem.el.style.opacity} | Transform: ${firstItem.el.style.transform}` : 'No items';
      const vSize = viewport ? `${viewport.offsetWidth}x${viewport.offsetHeight}` : 'Null';
      debugEl.innerText = `World: ${world ? 'Exists' : 'Null'} | Viewport: ${vSize} | Items Array: ${items.length} | World Children: ${world ? world.children.length : 'null'} | ${details}`;
    }

    if (!world || !viewport) {
      rafId = requestAnimationFrame(raf);
      return;
    }

    // 1. Camera Tilt & Shake
    const tiltX = state.mouseY * 5 - state.velocity * 0.5;
    const tiltY = state.mouseX * 5;

    world.style.transform = `
        rotateX(${tiltX}deg) 
        rotateY(${tiltY}deg)
    `;

    // 2. Dynamic Perspective (Warp)
    const baseFov = 1000;
    const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
    viewport.style.perspective = `${fov}px`;

    // 3. Item Loop
    const cameraZ = state.scroll * CONFIG.camSpeed;

    items.forEach(item => {
      let relZ = item.baseZ + cameraZ;
      const modC = CONFIG.loopSize;

      let vizZ = ((relZ % modC) + modC) % modC;
      if (vizZ > 500) vizZ -= modC;

      let alpha = 1;
      if (vizZ < -3000) alpha = 0;
      else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;

      if (vizZ > 100 && item.type !== 'star') alpha = 1 - ((vizZ - 100) / 400);

      if (alpha < 0) alpha = 0;
      item.el.style.opacity = alpha;

      if (alpha > 0) {
        let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

        if (item.type === 'star') {
          const stretch = Math.max(1, Math.min(1 + Math.abs(state.velocity) * 0.1, 10));
          trans += ` scale3d(1, 1, ${stretch})`;
        } else if (item.type === 'text') {
          trans += ` rotateZ(${item.rot}deg)`;
          if (Math.abs(state.velocity) > 1) {
            const offset = state.velocity * 2;
            item.el.style.textShadow = `${offset}px 0 red, ${-offset}px 0 cyan`;
          } else {
            item.el.style.textShadow = 'none';
          }
        } else {
          const t = time * 0.001;
          const float = Math.sin(t + item.x) * 10;
          trans += ` rotateZ(${item.rot}deg) rotateY(${float}deg)`;
        }

        item.el.style.transform = trans;
      }
    });

    rafId = requestAnimationFrame(raf);
  }

  function switchLanguage(lang) {
    if (currentLang === lang) return;
    currentLang = lang;

    document.querySelectorAll('.exp-lang-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(lang === 'tr' ? 'expLangTR' : 'expLangEN');
    if (activeBtn) activeBtn.classList.add('active');

    buildScene();
  }

  function destroy() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }

    const body = document.querySelector('.exp-window-body');
    if (body) {
      if (mouseMoveHandler) {
        body.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
      }
      if (fallbackWheelHandler) {
        body.removeEventListener('wheel', fallbackWheelHandler);
        fallbackWheelHandler = null;
      }
    }

    items = [];
    initialized = false;
  }

  return { init, destroy };
})();

window.ExperiencesModule = ExperiencesModule;
