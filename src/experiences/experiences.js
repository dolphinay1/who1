/**
 * Experiences Module — Scoped version of original yunus/scroll/script.js
 */

const ExperiencesModule = (() => {
  let lenis = null;
  let rafId = null;
  let items = [];
  let initialized = false;

  const CONFIG = {
    itemCount: 20,
    starCount: 150,
    zGap: 800,
    loopSize: 0,
    camSpeed: 2.5,
    colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff']
  };
  CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

  const TEXTS = ["IMPACT", "VELOCITY", "BRUTAL", "SYSTEM", "FUTURE", "DESIGN", "PIXEL", "HYPER", "NEON", "VOID"];

  const state = {
    scroll: 0,
    velocity: 0,
    targetSpeed: 0,
    mouseX: 0,
    mouseY: 0
  };

  let world, viewport, feedbackVel, feedbackFPS;
  let mouseMoveHandler = null;

  function init() {
    if (initialized) return;
    initialized = true;

    world = document.getElementById('world');
    viewport = document.getElementById('viewport');
    feedbackVel = document.getElementById('vel-readout');
    feedbackFPS = document.getElementById('fps');

    if (!world) return;

    world.innerHTML = '';
    items = [];

    // Create Items exactly as in yunus/scroll
    for (let i = 0; i < CONFIG.itemCount; i++) {
      const el = document.createElement('div');
      el.className = 'item';

      const isHeading = i % 4 === 0;

      if (isHeading) {
        const txt = document.createElement('div');
        txt.className = 'big-text';
        txt.innerText = TEXTS[i % TEXTS.length];
        el.appendChild(txt);
        items.push({
          el, type: 'text',
          x: 0, y: 0, rot: 0,
          baseZ: -i * CONFIG.zGap
        });
      } else {
        const card = document.createElement('div');
        card.className = 'card';
        const randId = Math.floor(Math.random() * 9999);
        card.innerHTML = `
          <div class="card-header">
              <span class="card-id">ID-${randId}</span>
              <div style="width: 10px; height: 10px; background: var(--accent);"></div>
          </div>
          <h2>${TEXTS[i % TEXTS.length]}</h2>
          <div class="card-footer">
              <span>GRID: ${Math.floor(Math.random() * 10)}x${Math.floor(Math.random() * 10)}</span>
              <span>DATA_SIZE: ${(Math.random() * 100).toFixed(1)}MB</span>
          </div>
          <div style="position:absolute; bottom:2rem; right:2rem; font-size:4rem; opacity:0.1; font-weight:900; font-family: var(--font-display); color: #fff;">0${i}</div>
        `;
        el.appendChild(card);

        // Spiral / Chaos positioning
        const angle = (i / CONFIG.itemCount) * Math.PI * 6;
        const x = Math.cos(angle) * (viewport.clientWidth * 0.3);
        const y = Math.sin(angle) * (viewport.clientHeight * 0.3);
        const rot = (Math.random() - 0.5) * 30;

        items.push({
          el, type: 'card',
          x, y, rot,
          baseZ: -i * CONFIG.zGap
        });
      }
      world.appendChild(el);
    }

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

    // Initialize Lenis within macOS Window Body wrapper to prevent page scrolling
    const scrollWrapper = body.querySelector('.exp-scroll-wrapper');
    const scrollProxy = body.querySelector('.scroll-proxy');
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

    lastTime = performance.now();
    rafId = requestAnimationFrame(raf);
  }

  let lastTime = 0;

  function raf(time) {
    if (lenis) lenis.raf(time);

    // FPS
    const delta = time - lastTime;
    lastTime = time;
    if (feedbackFPS && time % 10 < 1) feedbackFPS.innerText = Math.round(1000 / delta);

    // Smooth Velocity
    state.velocity += (state.targetSpeed - state.velocity) * 0.1;

    // HUD Updates
    if (feedbackVel) feedbackVel.innerText = Math.abs(state.velocity).toFixed(2);
    const coordEl = document.getElementById('coord');
    if (coordEl) coordEl.innerText = `${state.scroll.toFixed(0)}`;

    if (!world || !viewport) {
      rafId = requestAnimationFrame(raf);
      return;
    }

    // 1. Camera Tilt & Shake
    const shake = state.velocity * 0.2;
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

    // 4. Item Loop
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
    if (body && mouseMoveHandler) {
      body.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }

    items = [];
    initialized = false;
  }

  return { init, destroy };
})();

window.ExperiencesModule = ExperiencesModule;
