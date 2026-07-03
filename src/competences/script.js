(function () {
  'use strict';

  var LANG_KEY = 'cardlab-lang';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var I18N = {
    tr: {
      'meta.title': 'Yetkinlikler — Uzmanlık Alanları ve Beceriler',
      'nav.brand': 'Yetkinlikler',
      'nav.tag': '',
      'nav.lang': 'EN',
      'hero.eyebrow': '',
      'hero.title': 'Uzmanlık Alanlarım',
      'hero.sub':
        'İşletmelerin operasyonel verimliliğini artırmak ve dijital dönüşüm süreçlerini yönetmek adına, uçtan uca dijital ürün geliştirmeden yapay zeka entegrasyonlarına, pazarlama otomasyonlarından finansal analiz ve ekip liderliğine uzanan geniş bir yelpazede stratejik çözümler üretiyorum.',
      'hero.cta1': 'Yetkinlikleri Keşfet',
      'hero.cta2': 'Kategoriler',
      'sec.skills': 'Teknolojik Beceriler & Araçlar',
      'sec.skills.sub': 'Derin odak alanlarını görmek için bir yeteneğin üzerine gelin',
      'sec.grid': 'Tüm Yetkinlikler',
      'sec.grid.sub': 'Seçtiğiniz kategoriye göre filtrelenmiş detaylı uzmanlık maddeleri',
      'filter.showAll': 'Tümünü Göster',
      'sec.orbit': 'Kategoriler',
      'sec.orbit.sub': 'Filtrelemek ve ilgili yetkinliklere gitmek için bir kategori seçin',
      'footer.note': '',
      'carousel.1t': 'Teknoloji & Dijital',
      'carousel.1d': 'Web/mobil mimari, otomasyonlar ve AI entegrasyonu.',
      'carousel.2t': 'Pazarlama & Büyüme',
      'carousel.2d': 'Growth, CRM, e-ticaret ve AI destekli satış stratejileri.',
      'carousel.3t': 'Finans & Veri Analizi',
      'carousel.3d': 'Bütçe yönetimi, OPEX kontrolü ve performans raporlama.',
      'carousel.4t': 'Operasyon & Lojistik',
      'carousel.4d': 'Proje yönetimi, ekip liderliği ve saha koordinasyonu.',
      'card.1.title': 'Web & Mobil Mimari',
      'card.1.text': 'Back-office entegrasyonlu, ölçeklenebilir kurumsal web siteleri ve mobil uygulamaların geliştirilmesi.',
      'card.2.title': 'Hizmet Sektörü Dijitalleşmesi',
      'card.2.text': 'Restoran ve oteller için interaktif dijital menü, temassız sipariş ve operasyonel otomasyon entegrasyonu.',
      'card.3.title': 'Yapay Zeka (AI)',
      'card.3.text': 'Ürün geliştirme ve iş akışlarını hızlandırmak için AI araçlarının ve LLM teknolojilerinin entegre edilmesi.',
      'card.4.title': 'IT Altyapı & Sistem',
      'card.4.text': 'Kurumsal ağların kurgulanması, yazılım/donanım entegrasyonu, veri güvenliği ve optimizasyon.',
      'card.5.title': 'AI Pazarlama & Satış',
      'card.5.text': 'Hedef kitle analizi, lead oluşturma ve satış otomasyonlarında yapay zeka ile dönüşüm oranlarının artırılması.',
      'card.6.title': 'Dijital Marka & Büyüme',
      'card.6.text': 'Marka bilinirliğini maksimize etmeye yönelik veri odaklı, çok kanallı pazarlama stratejileri.',
      'card.7.title': 'E-Ticaret & CRM',
      'card.7.text': 'Online satış kanallarının, pazar yeri fiyatlandırmalarının ve CRM süreçlerinin ticari büyüme hedefli yönetimi.',
      'card.8.title': 'Finansal Planlama',
      'card.8.text': 'Bilanço ve gelir-gider analizi, nakit akışı takibi ve operasyonel finansal sürdürülebilirlik.',
      'card.9.title': 'Maliyet Kontrolü',
      'card.9.text': 'Tedarik zinciri, donanım ve envanter analizleriyle operasyonel giderlerin (OPEX) minimize edilmesi.',
      'card.10.title': 'Veri Odaklı Raporlama',
      'card.10.text': 'Satış, POS ve e-ticaret metriklerinin ölçümlenerek, ROI odaklı yönetim raporlarının sunulması.',
      'card.11.title': 'Saha & Turizm Personel Seçimi',
      'card.11.text': 'Turizm, organizasyon ve büyük etkinlik projeleri için norm kadro analizi, seçme-yerleştirme ve saha yönetimi.',
      'card.12.title': 'Proje Yönetimi (PLM)',
      'card.12.text': 'Fikir aşamasından pazara sunma (go-to-market) aşamasına kadar teknik ve fiziksel projelerin planlanması.',
      'card.13.title': 'Çok Kültürlü Ekip Liderliği',
      'card.13.text': 'Hizmet ve turizm sektöründe, uluslararası düzeyde IT, pazarlama, mutfak (gastronomi) ve saha ekiplerinin yönetimi.',
      'card.14.title': 'Hizmet Sektörü Darboğaz Çözümü',
      'card.14.text': 'Yiyecek-içecek, otelcilik ve hızlı hizmet sektörlerinde zaman planlaması, operasyonel rota ve kriz yönetimi.'
    },
    en: {
      'meta.title': 'Competencies — Areas of Expertise & Skills',
      'nav.brand': 'Competencies',
      'nav.tag': '',
      'nav.lang': 'TR',
      'hero.eyebrow': '',
      'hero.title': 'Areas of Expertise',
      'hero.sub':
        'To increase operational efficiency and lead digital transformation processes, I develop strategic solutions ranging from end-to-end digital product development to AI integrations, marketing automation, financial analysis, and team leadership.',
      'hero.cta1': 'Explore Competencies',
      'hero.cta2': 'Categories',
      'sec.skills': 'Tech Stack & Tools',
      'sec.skills.sub': 'Hover over a skill to reveal its deep focus areas',
      'sec.grid': 'All Competencies',
      'sec.grid.sub': 'Detailed competency items filtered by your selected category',
      'filter.showAll': 'Show All',
      'sec.orbit': 'Categories',
      'sec.orbit.sub': 'Select a category to filter and navigate to corresponding competencies',
      'footer.note': '',
      'carousel.1t': 'Technology & Digital',
      'carousel.1d': 'Web/mobile architecture, automations, and AI integration.',
      'carousel.2t': 'Marketing & Growth',
      'carousel.2d': 'Growth, CRM, e-commerce, and AI-powered sales strategies.',
      'carousel.3t': 'Finance & Data Analytics',
      'carousel.3d': 'Budget management, OPEX control, and performance reporting.',
      'carousel.4t': 'Operations & Logistics',
      'carousel.4d': 'Project management, team leadership, and staffing coordination.',
      'card.1.title': 'Web & Mobile Architecture',
      'card.1.text': 'Development of end-to-end scalable enterprise websites and mobile apps with back-office integrations.',
      'card.2.title': 'Hospitality Digitization',
      'card.2.text': 'Interactive digital menus, contactless ordering, and operational automation for restaurants and hotels.',
      'card.3.title': 'Artificial Intelligence (AI)',
      'card.3.text': 'Integration of AI tools and LLM technology into product development and workflows to accelerate operations.',
      'card.4.title': 'IT Infrastructure & Systems',
      'card.4.text': 'Design of corporate IT networks, software/hardware integration, data security, and service optimization.',
      'card.5.title': 'AI Marketing & Sales',
      'card.5.text': 'Using AI tools in target audience analysis, lead generation, and sales automation to maximize conversions.',
      'card.6.title': 'Digital Brand & Growth',
      'card.6.text': 'Planning data-driven, multi-channel marketing strategies to maximize brand awareness locally and globally.',
      'card.7.title': 'E-Commerce & CRM',
      'card.7.text': 'Management of online sales channels, marketplace pricing, and CRM workflows aligned with commercial growth.',
      'card.8.title': 'Financial Planning',
      'card.8.text': 'Balance sheet analysis, cash flow tracking, and ensuring financial sustainability in business operations.',
      'card.9.title': 'Cost Control',
      'card.9.text': 'Analyzing supply chain, IT hardware, and inventory to minimize operational expenditures (OPEX).',
      'card.10.title': 'Data-Driven Reporting',
      'card.10.text': 'Measuring sales, POS, and e-commerce data to present performance (ROI) reports supporting strategic decisions.',
      'card.11.title': 'Field & Tourism Recruitment',
      'card.11.text': 'Manpower planning, sourcing, placement, and field management for tourism, hospitality, and large-scale event projects.',
      'card.12.title': 'Project Management (PLM)',
      'card.12.text': 'Planning and delivery of technical and physical projects from ideation to go-to-market.',
      'card.13.title': 'Multicultural Team Leadership',
      'card.13.text': 'Leadership and coordination of international IT, marketing, culinary (gastronomy), and field teams in service and hospitality sectors.',
      'card.14.title': 'Service Bottleneck Resolution',
      'card.14.text': 'Advanced timing, operational routing, and crisis management in food & beverage, hospitality, and quick services.'
    }
  };

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'tr';
  }

  function applyLang(lang) {
    var pack = I18N[lang] || I18N.tr;
    document.documentElement.lang = lang;
    document.documentElement.dir = 'ltr';
    localStorage.setItem(LANG_KEY, lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && pack.hasOwnProperty(key)) el.textContent = pack[key];
    });

    var langBtn = document.querySelector('[data-lang-toggle]');
    if (langBtn) {
      langBtn.textContent = lang === 'tr' ? I18N.tr['nav.lang'] : I18N.en['nav.lang'];
      langBtn.setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye Geç');
    }
  }

  function initLang() {
    var btn = document.querySelector('[data-lang-toggle]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyLang(getLang() === 'tr' ? 'en' : 'tr');
    });
    applyLang(getLang());
  }

  function initReveal() {
    var blocks = [].slice.call(document.querySelectorAll('.section--reveal'));
    if (!blocks.length) return;
    if (reduced) {
      blocks.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        });
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    blocks.forEach(function (el) {
      io.observe(el);
    });
  }

  function initHeroMotion() {
    var shell = document.querySelector('[data-hero-motion]');
    if (!shell || reduced) return;
    shell.addEventListener('mousemove', function (e) {
      var r = shell.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      shell.style.setProperty('--hx', (x * 28).toFixed(1) + 'px');
      shell.style.setProperty('--hy', (y * 22).toFixed(1) + 'px');
    });
    shell.addEventListener('mouseleave', function () {
      shell.style.setProperty('--hx', '0px');
      shell.style.setProperty('--hy', '0px');
    });
  }

  /* ——— Spotlight stage carousel (2D translate; viewport dir=ltr for stable math) ——— */
  function initCarousel() {
    var root = document.querySelector('[data-carousel]');
    if (!root) return;
    var viewport = root.querySelector('[data-carousel-viewport]');
    var track = root.querySelector('[data-carousel-track]');
    var panels = [].slice.call(root.querySelectorAll('[data-carousel-panel]'));
    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var dots = [].slice.call(root.querySelectorAll('[data-carousel-dots] button'));
    var live = root.querySelector('[data-carousel-live]');
    var n = panels.length;
    if (n < 1 || !track || !viewport) return;

    var idx = 0;
    var w = 0;
    var swipe = { active: false, startX: 0, hasMoved: false, pid: null };

    function measure() {
      w = viewport.clientWidth || 0;
      if (w < 1) return;
      panels.forEach(function (p) {
        p.style.flex = '0 0 ' + w + 'px';
        p.style.width = w + 'px';
        p.style.maxWidth = w + 'px';
      });
    }

    function announce() {
      if (!live) return;
      var lang = getLang();
      live.textContent =
        lang === 'tr' ? 'Slayt ' + (idx + 1) + ' / ' + n : 'Slide ' + (idx + 1) + ' of ' + n;
    }

    function render() {
      if (w < 1) measure();
      var offset = -idx * w;
      if (!reduced) {
        track.style.transition = 'transform 0.55s cubic-bezier(0.2, 0.85, 0.25, 1)';
      } else {
        track.style.transition = 'none';
      }
      track.style.transform = 'translate3d(' + offset + 'px,0,0)';
      dots.forEach(function (d, j) {
        var on = j === idx;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      announce();
    }

    function go(delta) {
      idx = (idx + delta + n * 100) % n;
      render();
    }

    measure();
    if (w < 1) {
      requestAnimationFrame(function () {
        measure();
        render();
      });
    } else {
      render();
    }

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () {
        measure();
        render();
      });
      ro.observe(viewport);
    } else {
      window.addEventListener('resize', function () {
        measure();
        render();
      });
    }

    if (prev)
      prev.addEventListener('click', function (e) {
        e.stopPropagation();
        go(-1);
      });
    if (next)
      next.addEventListener('click', function (e) {
        e.stopPropagation();
        go(1);
      });

    dots.forEach(function (d, j) {
      d.addEventListener('click', function () {
        idx = j;
        render();
      });
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        idx = 0;
        render();
      } else if (e.key === 'End') {
        e.preventDefault();
        idx = n - 1;
        render();
      }
    });

    // POINTER EVENT DRAG LOGIC WITH SENSITIVITY THRESHOLD TO ALLOW CLICKS
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      swipe.active = true;
      swipe.startX = e.clientX;
      swipe.hasMoved = false;
      swipe.pid = e.pointerId;
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!swipe.active || e.pointerId !== swipe.pid) return;
      var dx = e.clientX - swipe.startX;
      if (Math.abs(dx) > 10) {
        swipe.hasMoved = true;
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
    });

    viewport.addEventListener('pointerup', function (e) {
      if (!swipe.active || e.pointerId !== swipe.pid) return;
      swipe.active = false;
      swipe.pid = null;

      if (swipe.hasMoved) {
        var dx = e.clientX - swipe.startX;
        if (Math.abs(dx) >= 40) {
          if (dx < 0) go(1);
          else go(-1);
        }
      }
    });

    viewport.addEventListener('pointercancel', function () {
      swipe.active = false;
      swipe.pid = null;
    });
  }

  function initSkillsHover() {
    var items = document.querySelectorAll(".skill-item");
    var descBox = document.querySelector(".skills-desc");
    if (!descBox) return;
    
    items.forEach(function (item) {
      item.addEventListener("mouseenter", function () {
        var desc = item.getAttribute("data-desc");
        descBox.textContent = desc;
        descBox.classList.add("active");
      });
      item.addEventListener("mouseleave", function () {
        descBox.classList.remove("active");
      });
    });
  }

  /* ——— Category Filtering + Smooth Scrolling ——— */
  function initCategoryFilters() {
    var categoryCards = document.querySelectorAll('[data-filter-category]');
    var showAllBtn = document.querySelector('[data-filter-all]');
    var competencyCards = document.querySelectorAll('#competency-grid .ux-parent');
    var gridSection = document.getElementById('competency-grid-section');

    categoryCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var category = card.getAttribute('data-filter-category');
        if (!category) return;

        competencyCards.forEach(function (c) {
          var cCat = c.getAttribute('data-category');
          if (cCat === category) {
            c.classList.remove('filtered-out');
          } else {
            c.classList.add('filtered-out');
          }
        });

        if (gridSection) {
          gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    if (showAllBtn) {
      showAllBtn.addEventListener('click', function () {
        competencyCards.forEach(function (c) {
          c.classList.remove('filtered-out');
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLang();
      initReveal();
      initHeroMotion();
      initCarousel();
      initSkillsHover();
      initCategoryFilters();
    });
  } else {
    initLang();
    initReveal();
    initHeroMotion();
    initCarousel();
    initSkillsHover();
    initCategoryFilters();
  }
})();