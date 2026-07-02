/**
 * Experiences Module — Lenis Smooth Scroll + 3D Card Timeline + HUD
 * Manages the "What are Experiences?" interactive scroll experience.
 */

const ExperiencesModule = (() => {
  const CONFIG = {
    starCount: 120,
    zGap: 900,
    camSpeed: 2.5,
    colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff']
  };

  const TEXTS = [
    "EXPERIENCE", "GROWTH", "JOURNEY",
    "CAREER", "SKILLS", "IMPACT"
  ];

  const EXPERIENCES = [
    {
      id: "EXP-001",
      company: "Placeholder",
      position: "Pozisyon",
      description: "Deneyim açıklaması buraya gelecek.",
      duration: "20XX — 20XX",
      field: "ALAN"
    },
    {
      id: "EXP-002",
      company: "Placeholder",
      position: "Pozisyon",
      description: "Deneyim açıklaması buraya gelecek.",
      duration: "20XX — 20XX",
      field: "ALAN"
    },
    {
      id: "EXP-003",
      company: "Placeholder",
      position: "Pozisyon",
      description: "Deneyim açıklaması buraya gelecek.",
      duration: "20XX — 20XX",
      field: "ALAN"
    },
    {
      id: "EXP-004",
      company: "Placeholder",
      position: "Pozisyon",
      description: "Deneyim açıklaması buraya gelecek.",
      duration: "20XX — 20XX",
      field: "ALAN"
    },
    {
      id: "EXP-005",
      company: "Placeholder",
      position: "Pozisyon",
      description: "Deneyim açıklaması buraya gelecek.",
      duration: "20XX — 20XX",
      field: "ALAN"
    }
  ];

  let lenis = null;
  let rafId = null;
  let items = [];
  let state = { scroll: 0, velocity: 0, targetSpeed: 0, mouseX: 0, mouseY: 0 };
  let loopSize = 0;
  let lastTime = 0;
  let initialized = false;

  function createCard(exp, index) {
    const card = document.createElement('div');
    card.className = 'exp-card';
    card.innerHTML = `
      <div class="exp-card-header">
        <span class="exp-card-id">${exp.id}</span>
        <div style="width: 10px; height: 10px; background: var(--exp-accent);"></div>
      </div>
      <h2>${exp.company}</h2>
      <div class="exp-position">${exp.position}</div>
      <div class="exp-description">${exp.description}</div>
      <div class="exp-card-footer">
        <span>SÜRE: ${exp.duration}</span>
        <span>ALAN: ${exp.field}</span>
      </div>
      <div class="exp-big-index">0${index + 1}</div>
    `;
    return card;
  }

  function buildScene() {
    const world = document.getElementById('exp-world');
    if (!world) return;

    world.innerHTML = '';
    items = [];

    const totalItems = EXPERIENCES.length * 2 + EXPERIENCES.length;
    loopSize = totalItems * CONFIG.zGap;
    CONFIG.loopSize = loopSize;

    let zIndex = 0;

    EXPERIENCES.forEach((exp, i) => {
      if (i % 2 === 0) {
        const textEl = document.createElement('div');
        textEl.className = 'exp-item';
        const txt = document.createElement('div');
        txt.className = 'exp-big-text';
        txt.innerText = TEXTS[i % TEXTS.length];
        textEl.appendChild(txt);
        world.appendChild(textEl);
        items.push({
          el: textEl, type: 'text',
          x: 0, y: 0, rot: 0,
          baseZ: -zIndex * CONFIG.zGap
        });
        zIndex++;
      }

      const cardEl = document.createElement('div');
      cardEl.className = 'exp-item';
      const card = createCard(exp, i);
      cardEl.appendChild(card);
      world.appendChild(cardEl);

      const angle = (i / EXPERIENCES.length) * Math.PI * 4;
      const viewport3d = document.getElementById('exp-3d-viewport');
      const vw = viewport3d ? viewport3d.clientWidth : window.innerWidth;
      const vh = viewport3d ? viewport3d.clientHeight : window.innerHeight;
      const x = Math.cos(angle) * (vw * 0.2);
      const y = Math.sin(angle) * (vh * 0.15);
      const rot = (Math.random() - 0.5) * 15;

      items.push({
        el: cardEl, type: 'card',
        x, y, rot,
        baseZ: -zIndex * CONFIG.zGap
      });
      zIndex++;
    });

    const textEl = document.createElement('div');
    textEl.className = 'exp-item';
    const txt = document.createElement('div');
    txt.className = 'exp-big-text';
    txt.innerText = TEXTS[TEXTS.length - 1];
    textEl.appendChild(txt);
    world.appendChild(textEl);
    items.push({
      el: textEl, type: 'text',
      x: 0, y: 0, rot: 0,
      baseZ: -zIndex * CONFIG.zGap
    });
    zIndex++;

    for (let i = 0; i < CONFIG.starCount; i++) {
      const el = document.createElement('div');
      el.className = 'exp-star';
      world.appendChild(el);
      items.push({
        el, type: 'star',
        x: (Math.random() - 0.5) * 2500,
        y: (Math.random() - 0.5) * 2500,
        baseZ: -Math.random() * loopSize
      });
    }

    const proxy = document.querySelector('.exp-scroll-proxy');
    if (proxy) {
      proxy.style.height = `${loopSize * 0.6}px`;
    }
  }

  function initLenis() {
    const scrollContainer = document.querySelector('.exp-window-body');
    if (!scrollContainer) return;

    lenis = new Lenis({
      wrapper: scrollContainer,
      content: scrollContainer,
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
  }

  function renderLoop(time) {
    if (lenis) lenis.raf(time);

    const delta = time - lastTime;
    lastTime = time;

    const fpsEl = document.getElementById('exp-fps');
    if (fpsEl && time % 10 < 1) {
      fpsEl.innerText = Math.round(1000 / delta);
    }

    state.velocity += (state.targetSpeed - state.velocity) * 0.1;

    const velEl = document.getElementById('exp-vel');
    if (velEl) velEl.innerText = Math.abs(state.velocity).toFixed(2);

    const coordEl = document.getElementById('exp-coord');
    if (coordEl) coordEl.innerText = `${state.scroll.toFixed(0)}`;

    const world = document.getElementById('exp-world');
    const viewport3d = document.getElementById('exp-3d-viewport');
    if (!world || !viewport3d) {
      rafId = requestAnimationFrame(renderLoop);
      return;
    }

    const shake = state.velocity * 0.15;
    const tiltX = state.mouseY * 3 - state.velocity * 0.3;
    const tiltY = state.mouseX * 3;

    world.style.transform = `
      rotateX(${tiltX}deg)
      rotateY(${tiltY}deg)
    `;

    const baseFov = 1000;
    const fov = baseFov - Math.min(Math.abs(state.velocity) * 8, 500);
    viewport3d.style.perspective = `${fov}px`;

    const cameraZ = state.scroll * CONFIG.camSpeed;
    const modC = loopSize;

    items.forEach(item => {
      let relZ = item.baseZ + cameraZ;
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
          const float = Math.sin(t + item.x) * 8;
          trans += ` rotateZ(${item.rot}deg) rotateY(${float}deg)`;
        }

        item.el.style.transform = trans;
      }
    });

    rafId = requestAnimationFrame(renderLoop);
  }

  function handleMouse(e) {
    const body = document.querySelector('.exp-window-body');
    if (!body) return;
    const rect = body.getBoundingClientRect();
    state.mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    state.mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function init() {
    if (initialized) return;
    initialized = true;

    buildScene();
    initLenis();

    const body = document.querySelector('.exp-window-body');
    if (body) {
      body.addEventListener('mousemove', handleMouse);
    }

    lastTime = performance.now();
    rafId = requestAnimationFrame(renderLoop);
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
      body.removeEventListener('mousemove', handleMouse);
    }

    items = [];
    state = { scroll: 0, velocity: 0, targetSpeed: 0, mouseX: 0, mouseY: 0 };
    initialized = false;
  }

  return { init, destroy };
})();

window.ExperiencesModule = ExperiencesModule;
