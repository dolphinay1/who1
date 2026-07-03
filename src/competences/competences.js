/* ============================================================
   COMPETENCES MODULE — Scoped JS from cards and python projects
   ============================================================ */

(function () {
  'use strict';

  var LANG_KEY = 'comp-lang';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var I18N = {
    en: {
      'site.title': 'CARD LAB Neon glass · 3D cards · UI lab',
      'nav.brand': 'CARD LAB',
      'nav.lang': 'العربية',
      'hero.eyebrow': 'Interactive shape lab',
      'hero.title': 'Dimensional interface cards',
      'hero.sub': 'Glass, neon depth, and tactile motion — hover cards for parallax, then open the spotlight deck. Built to scale from prototype to production.',
      'hero.cta1': 'Explore the grid',
      'hero.cta2': 'Spotlight deck',
      'sec.skills': 'Core Competencies',
      'sec.skills.sub': 'Hover over a skill to reveal its deep focus areas',
      'sec.grid': 'Shape system',
      'sec.grid.sub': 'Six structural variants: orb glass, chamfer cut, neo surface, cinema wide, crystal facet, layered stack.',
      'sec.orbit': 'Spotlight deck',
      'sec.orbit.sub': 'Four panels in a stable horizontal stage — arrows, dots, keyboard, and swipe.',
      'card.orb.title': 'Orb glass',
      'card.orb.text': 'Soft pill body with stacked glass and concentric depth cues.',
      'card.chamfer.title': 'Chamfer cut',
      'card.chamfer.text': 'Precision corners via clip-path — reads sharp on dark UI.',
      'card.brutal.title': 'Neo surface',
      'card.brutal.text': 'High-contrast rim, hard shadow, and electric accent rail.',
      'card.cinema.title': 'Cinema wide',
      'card.cinema.text': 'Landscape canvas for metrics, trailers, or dashboard hero tiles.',
      'card.facet.title': 'Crystal facet',
      'card.facet.text': 'Angular gradient break with prismatic highlight pass.',
      'card.stack.title': 'Layered stack',
      'card.stack.text': 'Three floating sheets with parallax on hover.',
      'cta.more': 'Open',
      'carousel.1t': 'Signal',
      'carousel.1d': 'Latency budgets and live traces.',
      'carousel.2t': 'Mesh',
      'carousel.2d': 'Distributed nodes with health rings.',
      'carousel.3t': 'Vault',
      'carousel.3d': 'Encrypted payloads at rest.',
      'carousel.4t': 'Pulse',
      'carousel.4d': 'Realtime fan-out to edge regions.',
      'footer.note': 'Built with semantic HTML & CSS 3D transforms.',
    },
    ar: {
      'site.title': 'مختبر البطاقات ثلاثية الأبعاد',
      'nav.brand': 'CARD LAB',
      'nav.lang': 'English',
      'hero.eyebrow': 'مختبر أشكال تفاعلي',
      'hero.title': 'بطاقات واجهة بعمق بصري',
      'hero.sub': 'زجاج، نيون، وحركة لمسية — مرّر على البطاقات للعمق، ثم افتح العرض المميز. جاهز من النموذج إلى الإنتاج.',
      'hero.cta1': 'استكشف الشبكة',
      'hero.cta2': 'عرض مميز',
      'sec.skills': 'المهارات الأساسية',
      'sec.skills.sub': 'مرر فوق المهارة للكشف عن مجالات التركيز العميقة',
      'sec.grid': 'نظام الأشكال',
      'sec.grid.sub': 'ستة أنماt: زجاج دائري، قص مائل، سطح صلب، عريض سينمائي، وجه بلوري، طبقات مكدسة.',
      'sec.orbit': 'عرض مميز',
      'sec.orbit.sub': 'أربع لوحات في مسرح أفقي ثابت — أسهم، نقاط، لوحة مفاتيح، وسحب.',
      'card.orb.title': 'زجاج دائري',
      'card.orb.text': 'جسم ناعم مع زجاج مكدس وحلقات عمق.',
      'card.chamfer.title': 'قص مائل',
      'card.chamfer.text': 'زوايا دقيقة عبر clip-path — واضح على الواجهات الداكنة.',
      'card.brutal.title': 'سطح صلب',
      'card.brutal.text': 'إطار عالي التباين وظل حاد وشريط لوني.',
      'card.cinema.title': 'عريض سينمائي',
      'card.cinema.text': 'لوحة أفقية للمقاييس أو بطاقات لوحة التحكم.',
      'card.facet.title': 'وجه بلوري',
      'card.facet.text': 'تدرج زاوي مع لمعان منشوري.',
      'card.stack.title': 'طبقات',
      'card.stack.text': 'ثلاث طبقات عائمة مع انzياح بسيط عند المرور.',
      'cta.more': 'فتح',
      'carousel.1t': 'إشارة',
      'carousel.1d': 'ميزانيات التأخير والتتبع المباشر.',
      'carousel.2t': 'شبكة',
      'carousel.2d': 'عقد موزعة مع حلقات صحة.',
      'carousel.3t': 'خزنة',
      'carousel.3d': 'حمولة مشفرة في السكون.',
      'carousel.4t': 'نبض',
      'carousel.4d': 'بث لحظي إلى الحافة.',
      'footer.note': 'بُني بـ HTML دلالي وتحويلات CSS ثلاثية الأبعاد.',
    }
  };

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function applyLang(lang) {
    var pack = I18N[lang] || I18N.en;
    var win = document.getElementById('comp-macos-window');
    if (!win) return;

    localStorage.setItem(LANG_KEY, lang);

    win.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && pack[key]) el.textContent = pack[key];
    });

    var langBtn = win.querySelector('[data-lang-toggle]');
    if (langBtn) {
      langBtn.textContent = lang === 'en' ? I18N.en['nav.lang'] : I18N.ar['nav.lang'];
    }
  }

  function initLang() {
    var win = document.getElementById('comp-macos-window');
    if (!win) return;
    var btn = win.querySelector('[data-lang-toggle]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyLang(getLang() === 'en' ? 'ar' : 'en');
    });
    applyLang(getLang());
  }

  var revealObserver = null;
  function initReveal() {
    var win = document.getElementById('comp-macos-window');
    if (!win) return;
    var blocks = [].slice.call(win.querySelectorAll('.section--reveal'));
    if (!blocks.length) return;
    if (reduced) {
      blocks.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-visible');
          revealObserver.unobserve(en.target);
        });
      },
      { root: win.querySelector('.window-content'), rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    blocks.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  var heroShell = null;
  var onHeroMouseMove = null;
  var onHeroMouseLeave = null;

  function initHeroMotion() {
    var win = document.getElementById('comp-macos-window');
    if (!win) return;
    heroShell = win.querySelector('[data-hero-motion]');
    if (!heroShell || reduced) return;

    onHeroMouseMove = function (e) {
      var r = heroShell.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      heroShell.style.setProperty('--hx', (x * 28).toFixed(1) + 'px');
      heroShell.style.setProperty('--hy', (y * 22).toFixed(1) + 'px');
    };

    onHeroMouseLeave = function () {
      heroShell.style.setProperty('--hx', '0px');
      heroShell.style.setProperty('--hy', '0px');
    };

    heroShell.addEventListener('mousemove', onHeroMouseMove);
    heroShell.addEventListener('mouseleave', onHeroMouseLeave);
  }

  var resizeObserver = null;
  function initCarousel() {
    var win = document.getElementById('comp-macos-window');
    if (!win) return;
    var root = win.querySelector('[data-carousel]');
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
    var swipe = { active: false, startX: 0, pid: null };

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
      live.textContent = 'Slide ' + (idx + 1) + ' of ' + n;
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
      resizeObserver = new ResizeObserver(function () {
        measure();
        render();
      });
      resizeObserver.observe(viewport);
    }

    if (prev) {
      prev.addEventListener('click', function (e) {
        e.stopPropagation();
        go(-1);
      });
    }
    if (next) {
      next.addEventListener('click', function (e) {
        e.stopPropagation();
        go(1);
      });
    }

    dots.forEach(function (d, j) {
      d.addEventListener('click', function () {
        idx = j;
        render();
      });
    });

    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      swipe.active = true;
      swipe.startX = e.clientX;
      swipe.pid = e.pointerId;
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    viewport.addEventListener('pointerup', function (e) {
      if (!swipe.active || e.pointerId !== swipe.pid) return;
      swipe.active = false;
      swipe.pid = null;
      var dx = e.clientX - swipe.startX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) go(1);
      else go(-1);
    });

    viewport.addEventListener('pointercancel', function () {
      swipe.active = false;
      swipe.pid = null;
    });
  }

  function initSkillsGrid() {
    var win = document.getElementById('comp-macos-window');
    if (!win) return;
    var items = win.querySelectorAll(".skill-item");
    var descBox = win.querySelector(".skills-desc");
    if (!items.length || !descBox) return;

    items.forEach(function(item) {
      item.addEventListener("mouseenter", function() {
        var desc = item.getAttribute("data-desc");
        descBox.textContent = desc;
        descBox.classList.add("active");
      });
      item.addEventListener("mouseleave", function() {
        descBox.classList.remove("active");
      });
    });
  }

  function init() {
    initLang();
    initReveal();
    initHeroMotion();
    initCarousel();
    initSkillsGrid();
  }

  function destroy() {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (heroShell) {
      if (onHeroMouseMove) heroShell.removeEventListener('mousemove', onHeroMouseMove);
      if (onHeroMouseLeave) heroShell.removeEventListener('mouseleave', onHeroMouseLeave);
      heroShell = null;
    }
  }

  window.CompetencesModule = {
    init: init,
    destroy: destroy
  };
})();
