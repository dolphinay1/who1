(function () {
  'use strict';

  var LANG_KEY = 'cardlab-lang';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var I18N = {
    en: {
      'meta.title': '3D Card Lab',
      'nav.brand': 'Card Lab',
      'nav.lang': 'العربية',
      'hero.eyebrow': 'Interactive shape lab',
      'hero.title': 'Dimensional interface cards',
      'hero.sub':
        'Glass, neon depth, and tactile motion — hover cards for parallax, then open the spotlight deck. Built to scale from prototype to production.',
      'hero.cta1': 'Explore the grid',
      'hero.cta2': 'Spotlight deck',
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
      'meta.title': 'مختبر البطاقات ثلاثية الأبعاد',
      'nav.brand': 'مختبر البطاقات',
      'nav.lang': 'English',
      'hero.eyebrow': 'مختبر أشكال تفاعلي',
      'hero.title': 'بطاقات واجهة بعمق بصري',
      'hero.sub':
        'زجاج، نيون، وحركة لمسية — مرّر على البطاقات للعمق، ثم افتح العرض المميز. جاهز من النموذج إلى الإنتاج.',
      'hero.cta1': 'استكشف الشبكة',
      'hero.cta2': 'عرض مميز',
      'sec.grid': 'نظام الأشكال',
      'sec.grid.sub': 'ستة أنماط: زجاج دائري، قص مائل، سطح صلب، عريض سينمائي، وجه بلوري، طبقات مكدسة.',
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
      'card.stack.text': 'ثلاث طبقات عائمة مع انزياح بسيط عند المرور.',
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
    },
  };

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function applyLang(lang) {
    var pack = I18N[lang] || I18N.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(LANG_KEY, lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && pack[key]) el.textContent = pack[key];
    });

    var langBtn = document.querySelector('[data-lang-toggle]');
    if (langBtn) {
      langBtn.textContent = lang === 'en' ? I18N.en['nav.lang'] : I18N.ar['nav.lang'];
      langBtn.setAttribute('aria-label', lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية');
    }
  }

  function initLang() {
    var btn = document.querySelector('[data-lang-toggle]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyLang(getLang() === 'en' ? 'ar' : 'en');
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
      var lang = getLang();
      live.textContent =
        lang === 'ar' ? 'الشريحة ' + (idx + 1) + ' من ' + n : 'Slide ' + (idx + 1) + ' of ' + n;
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
        var rtlNow = document.documentElement.getAttribute('dir') === 'rtl';
        go(rtlNow ? 1 : -1);
      });
    if (next)
      next.addEventListener('click', function (e) {
        e.stopPropagation();
        var rtlNow = document.documentElement.getAttribute('dir') === 'rtl';
        go(rtlNow ? -1 : 1);
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
        var rtlNow = document.documentElement.getAttribute('dir') === 'rtl';
        go(rtlNow ? 1 : -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        var rtlNow = document.documentElement.getAttribute('dir') === 'rtl';
        go(rtlNow ? -1 : 1);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLang();
      initReveal();
      initHeroMotion();
      initCarousel();
    });
  } else {
    initLang();
    initReveal();
    initHeroMotion();
    initCarousel();
  }
})();