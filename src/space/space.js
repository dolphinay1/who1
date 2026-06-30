/**
 * Space Anomaly Module logic compiling and running WebGL shaders.
 * Coordinates folder clicking and macOS window drag/opening logic.
 */

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec2 move;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define N normalize
#define S smoothstep
#define MN min(R.x,R.y)
#define rot(a) mat2(cos((a)-vec4(0,11,33,0)))
#define csqr(a) vec2(a.x*a.x-a.y*a.y,2.*a.x*a.y)

float rnd(vec3 p) {
  p=fract(p*vec3(12.9898,78.233,156.34));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y*p.z);
}

float swirls(in vec3 p) {
  float d=.0;
  vec3 c=p;
  for(float i=min(.0,time); i<9.; i++) {
    p=.7*abs(p)/dot(p,p)-.7;
    p.yz=csqr(p.yz);
    p=p.zxy;
    d+=exp(-19.*abs(dot(p,c)));
  }
  return d;
}

vec3 march(in vec3 p, vec3 rd) {
  float d=.2, t=.0, c=.0, k=mix(.9,1.,rnd(rd)),
  maxd=length(p)-1.;
  vec3 col=vec3(0);
  for(float i=min(.0,time); i<120.; i++) {
    t+=d*exp(-2.*c)*k;
    c=swirls(p+rd*t);
    if (t<5e-2 || t>maxd) break;
    col+=vec3(c*c,c/1.05,c)*8e-3;
  }
  return col;
}

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

vec3 sky(vec2 p, bool anim) {
  p.x-=.17-(anim?2e-4*T:.0);
  p*=500.;
  vec2 id=floor(p), gv=fract(p)-.5;
  float n=rnd(id), d=length(gv);
  if (n<.975) return vec3(0);
  return vec3(S(3e-2*n,1e-3*n,d*d));
}

void cam(inout vec3 p) {
  p.yz*=rot(move.y*6.3/MN-T*.05);
  p.xz*=rot(-move.x*6.3/MN+T*.025);
}

void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0),
  p=vec3(0,0,-16),
  rd=N(vec3(uv,1)), rdd=rd;
  cam(p); cam(rd);
  col=march(p,rd);
  col=S(-.2,.9,col);
  vec2 sn=.5+vec2(atan(rdd.x,rdd.z),atan(length(rdd.xz),rdd.y))/6.28318;
  col=max(col,vec3(sky(sn,true)+sky(2.+sn*2.,true)));
  float t=min((time-.5)*.3,1.);
  uv=FC/R*2.-1.;
  uv*=.7;
  float v=pow(dot(uv,uv),1.8);
  col=mix(col,vec3(0),v);
  col=mix(vec3(0),col,t);
  col=max(col,.08);
  O=vec4(col,1);
}`;

class SpaceRenderer {
  #vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
  #vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  
  constructor(canvas, scale) {
    this.canvas = canvas;
    this.scale = scale;
    this.gl = canvas.getContext("webgl2");
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
    this.mouseMove = [0, 0];
    this.mouseCoords = [0, 0];
    this.pointerCoords = [0, 0];
    this.nbrOfPointers = 0;
  }

  updateShader(source) {
    this.shaderSource = source;
    this.setup();
    this.init();
  }

  updateMove(deltas) {
    this.mouseMove = deltas;
  }

  updateMouse(coords) {
    this.mouseCoords = coords;
  }

  updatePointerCoords(coords) {
    this.pointerCoords = coords;
  }

  updatePointerCount(nbr) {
    this.nbrOfPointers = nbr;
  }

  updateScale(scale) {
    this.scale = scale;
    this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
  }

  compile(shader, source) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  }

  setup() {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    this.compile(this.vs, this.#vertexSrc);
    this.compile(this.fs, this.shaderSource);
    this.program = gl.createProgram();
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);
  }

  init() {
    const { gl, program } = this;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#vertices), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    program.resolution = gl.getUniformLocation(program, "resolution");
    program.time = gl.getUniformLocation(program, "time");
    program.move = gl.getUniformLocation(program, "move");
    program.touch = gl.getUniformLocation(program, "touch");
    program.pointerCount = gl.getUniformLocation(program, "pointerCount");
    program.pointers = gl.getUniformLocation(program, "pointers");
  }

  render(now = 0) {
    const { gl, program, buffer, canvas, mouseMove, mouseCoords, pointerCoords, nbrOfPointers } = this;
    if (!program) return;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f(program.resolution, canvas.width, canvas.height);
    gl.uniform1f(program.time, now * 1e-3);
    gl.uniform2f(program.move, ...mouseMove);
    gl.uniform2f(program.touch, ...mouseCoords);
    gl.uniform1i(program.pointerCount, nbrOfPointers);
    gl.uniform2fv(program.pointers, pointerCoords);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

class SpacePointerHandler {
  constructor(element, scale) {
    this.scale = scale;
    this.active = false;
    this.pointers = new Map();
    this.lastCoords = [0, 0];
    this.moves = [0, 0];
    
    const mapCoords = (el, sc, x, y) => [x * sc, el.height - y * sc];

    element.addEventListener("pointerdown", (e) => {
      // Ignore click inputs that are on UI overlay files
      if (e.target.closest("#desktop-workspace")) return;
      this.active = true;
      this.pointers.set(e.pointerId, mapCoords(element, this.getScale(), e.clientX, e.clientY));
    });

    element.addEventListener("pointerup", (e) => {
      if (this.pointers.size === 1) {
        this.lastCoords = this.first;
      }
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });

    element.addEventListener("pointerleave", (e) => {
      if (this.pointers.size === 1) {
        this.lastCoords = this.first;
      }
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });

    element.addEventListener("pointermove", (e) => {
      if (!this.active) return;
      this.lastCoords = [e.clientX, e.clientY];
      this.pointers.set(e.pointerId, mapCoords(element, this.getScale(), e.clientX, e.clientY));
      this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
    });
  }

  getScale() {
    return this.scale;
  }

  updateScale(scale) {
    this.scale = scale;
  }

  reset() {
    this.pointers.clear();
    this.active = false;
    this.moves = [0, 0];
  }

  get count() {
    return this.pointers.size;
  }

  get move() {
    return this.moves;
  }

  get coords() {
    return this.pointers.size > 0 ? Array.from(this.pointers.values()).flatMap((p) => [...p]) : [0, 0];
  }

  get first() {
    return this.pointers.values().next().value || this.lastCoords;
  }
}

let spaceRenderer = null;
let spacePointers = null;
let animationFrameId = null;
const resolutionScale = 0.5;

function spaceLoop(now) {
  if (spaceRenderer && spacePointers) {
    spaceRenderer.updateMouse(spacePointers.first);
    spaceRenderer.updatePointerCount(spacePointers.count);
    spaceRenderer.updatePointerCoords(spacePointers.coords);
    spaceRenderer.updateMove(spacePointers.move);
    spaceRenderer.render(now);
  }
  animationFrameId = requestAnimationFrame(spaceLoop);
}

function handleResize() {
  const canvas = document.getElementById("space-canvas");
  if (!canvas || !spaceRenderer) return;
  const dpr = Math.max(1, resolutionScale * window.devicePixelRatio);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  spaceRenderer.updateScale(dpr);
}

/* ==========================================
 * macOS Window Interactive Features
 * ========================================== */

function setupWindowDragging() {
  const header = document.getElementById("windowHeader");
  const win = document.getElementById("macos-window");
  if (!header || !win) return;

  let isDragging = false;
  let startX, startY, winLeft, winTop;

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".window-controls")) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Get current window bounds
    const rect = win.getBoundingClientRect();
    winLeft = rect.left;
    winTop = rect.top;
    
    // Disable translate transition while dragging
    win.style.transition = "none";
    win.style.transform = "none";
    win.style.left = `${winLeft}px`;
    win.style.top = `${winTop}px`;
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    win.style.left = `${winLeft + dx}px`;
    win.style.top = `${winTop + dy}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

const translations = {
  tr: {
    "logo": "KİŞİSEL KİMLİK",
    "window-title": "Who is Yunus?",
    "hero-line1": "TEKNOLOJİNİN RASYONEL DÜNYASI VE",
    "hero-line2": "İNSAN İLİŞKİLERİNİN SAMİMİYETİNİ",
    "hero-line3": "DENGELEYEBİLEN",
    "hero-line4": "KARAKTERİNİ KELİMELERLE PAZARLAMAYI REDDEDİP,",
    "hero-line5": "İŞİNE DUYDUĞU SAYGI VE NETLİĞİYLE",
    "hero-line6": "VAR OLMAYI BENİMSEMİŞ BİRİ.",
    "about-eyebrow": "HAKKIMDA · BİYOGRAFİ",
    "about-heading": "Dürüstlük, Uyum<br />ve Sürekli Gelişim",
    "about-desc": "Matematiksel düşünce yapımla yazılımı birleştiriyor, müşteri memnuniyeti odaklı elit hizmetler sunuyorum.",
    "card1-title": "Ben Kimim?",
    "card1-desc": "25 yaşındayım, İstanbul'da yaşıyorum. İtalyan bir anne ve Erzincanlı bir babanın oğluyum. Dürüst, yardımsever biriyim; girdiğim ekiplere hızla uyum sağlar, insanları koordine edebilirim. İstanbul Üniversitesi-Cerrahpaşa Turizm İşletmeciliği okuyorum.",
    "card1-link": "Keşfet →",
    "card2-title": "Girişim & Tecrübe",
    "card2-desc": "Daha önce birkaç kez kendi işimi kurdum, bu bana eşsiz tecrübeler kattı. Satış, pazarlama ve hizmet sektöründe 4 yılı aşkın deneyime sahibim. Diksiyon, iş sağlığı, zaman/stres yönetimi, ikna teknikleri, moda illüstrasyonu ve gastronomi sertifikalarım var.",
    "card2-link": "Sertifikalar →",
    "card3-title": "Yazılım & Vizyonum",
    "card3-desc": "Yazılım ve bilgisayara hobi olarak başladım; matematiksel okuma becerimle kendimi geliştirdim. Marketing alanında 4+ yıl tecrübeyle müşteri memnuniyeti odaklı, elit kalitede hizmet sunuyorum. Hedefim, Yapay Zeka (AI) otomasyonlarında Türkiye pazarında öncü rol oynamak.",
    "card3-link": "Vizyonumu Gör →",
    "cta-title": "Geleceği Birlikte<br /><em>İnşa Edelim</em>.",
    "cta-desc": "Yapay zeka otomasyonları ve elit düzeyde marketing iş birlikleri için benimle iletişime geçin.",
    "cta-btn": "İletişime Geç"
  },
  en: {
    "logo": "PERSONAL IDENTITY",
    "window-title": "Who is Yunus?",
    "hero-line1": "BALANCING THE RATIONAL WORLD OF",
    "hero-line2": "TECHNOLOGY WITH HUMAN RELATIONSHIPS;",
    "hero-line3": "REFUSING",
    "hero-line4": "TO MARKET CHARACTER WITH WORDS,",
    "hero-line5": "EXISTING THROUGH RESPECT",
    "hero-line6": "AND CLARITY IN WORK.",
    "about-eyebrow": "ABOUT ME · BIOGRAPHY",
    "about-heading": "Honesty, Adaptation<br />& Continuous Growth",
    "about-desc": "I merge a logical, mathematical mindset with software engineering to deliver elite-class services obsessed with client satisfaction.",
    "card1-title": "Who Am I?",
    "card1-desc": "I am 25 years old, based in Istanbul. Born to an Italian mother and an Erzincan father. I am an honest, helpful person who adapts rapidly to workplaces and excels at coordinating teams. I am studying Tourism & Hotel Management at Istanbul University-Cerrahpaşa.",
    "card1-link": "Explore →",
    "card2-title": "Ventures & Expertise",
    "card2-desc": "I have previously founded several businesses, which taught me invaluable lessons. I hold over 4 years of experience in sales, marketing, and services, alongside certifications in Diction, HSE, Time/Stress Management, Sales & Persuasion, Fashion Illustration, and Gastronomy.",
    "card2-link": "Certifications →",
    "card3-title": "Coding & Vision",
    "card3-desc": "Software and computers started as a hobby. However, leveraging my logical and mathematical analysis capabilities, I have elevated my skills. Backed by 4+ years of marketing experience, I deliver elite-level client satisfaction. My goal is to play a pioneering role in Turkey's AI automation market.",
    "card3-link": "See Vision →",
    "cta-title": "Let's build a new<br /><em>future together</em>.",
    "cta-desc": "Get in touch to discuss AI automations, digital strategy, or elite business collaborations.",
    "cta-btn": "Get in Touch"
  }
};

function applyTranslation(lang) {
  const elements = document.querySelectorAll("[data-translate]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-translate");
    if (translations[lang] && translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });
}

function initMonaxGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // Scoped animations running inside .window-content
  gsap.set(".window-content .nav", { opacity: 0, y: -20 });
  gsap.set(".window-content .headline .word > span", { y: "105%" });
  gsap.set(".window-content #inlineImg, .window-content #ideaPill", { scale: 0 });
  gsap.set(".window-content .feat-card, .window-content .cta-inner", { opacity: 0 });

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .to(".window-content .nav", { opacity: 1, y: 0, duration: 0.8 }, 0.1)
    .to(".window-content .line-1 .word > span", { y: "0%", duration: 0.8 }, 0.3)
    .to(".window-content .line-2 .word > span", { y: "0%", duration: 0.8 }, 0.42)
    .to(".window-content .line-3 .word > span", { y: "0%", duration: 0.8 }, 0.54)
    .to(".window-content #inlineImg", { scale: 1, duration: 0.8, ease: "back.out(1.6)" }, 0.5)
    .to(".window-content #ideaPill", { scale: 1, duration: 0.8, ease: "back.out(1.6)" }, 0.65)
    .to(".window-content .line-4 .word > span", { y: "0%", duration: 0.8 }, 0.68)
    .to(".window-content .line-5 .word > span", { y: "0%", duration: 0.8 }, 0.8)
    .to(".window-content .line-6 .word > span", { y: "0%", duration: 0.8 }, 0.92);

  // Bobbing effects inside the window
  gsap.to(".window-content #inlineImg", {
    y: "+=6",
    rotation: 2,
    duration: 2.8,
    delay: 1.8,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });
  gsap.to(".window-content #ideaPill", {
    y: "+=5",
    rotation: -1.5,
    duration: 3.2,
    delay: 2.0,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });

  ScrollTrigger.create({
    trigger: ".window-content .hero",
    scroller: ".window-content",
    start: "top top",
    end: "bottom top",
    scrub: 0.8,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(".window-content .headline", { y: -50 * p, opacity: 1 - p * 0.4 });
    }
  });

  gsap.from(".window-content .eyebrow, .window-content .features-head h2, .window-content .features-head p", {
    opacity: 0,
    y: 30,
    duration: 0.9,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".window-content .features-head", scroller: ".window-content", start: "top 80%" }
  });
  
  gsap.to(".window-content .feat-card", {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.12,
    ease: "power3.out",
    scrollTrigger: { trigger: ".window-content .features-grid", scroller: ".window-content", start: "top 50%" }
  });

  gsap.to(".window-content .cta-inner", {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: { trigger: ".window-content .cta-section", scroller: ".window-content", start: "top 80%" }
  });
}

function initSpaceModule() {
  const canvas = document.getElementById("space-canvas");
  if (!canvas) return;

  const dpr = Math.max(1, resolutionScale * window.devicePixelRatio);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  spaceRenderer = new SpaceRenderer(canvas, dpr);
  spacePointers = new SpacePointerHandler(canvas, dpr);

  spaceRenderer.updateShader(fragmentShaderSource);
  spaceLoop(0);

  window.addEventListener("resize", handleResize);

  // Folder click interaction
  const folder = document.getElementById("desktop-folder");
  const win = document.getElementById("macos-window");
  
  if (folder && win) {
    folder.addEventListener("click", () => {
      // Re-enable CSS transitions when opening
      win.removeAttribute("style");
      win.classList.add("open");
      
      // Default to Turkish translation on open
      applyTranslation("tr");
      
      // Initialize GSAP anims inside scrollable window content
      setTimeout(() => {
        initMonaxGSAP();
      }, 400);
    });
  }

  // Language buttons logic
  const langBtnTR = document.getElementById("langBtnTR");
  const langBtnEN = document.getElementById("langBtnEN");
  if (langBtnTR && langBtnEN) {
    langBtnTR.addEventListener("click", () => {
      langBtnTR.classList.add("active");
      langBtnEN.classList.remove("active");
      applyTranslation("tr");
      ScrollTrigger.refresh();
    });
    langBtnEN.addEventListener("click", () => {
      langBtnEN.classList.add("active");
      langBtnTR.classList.remove("active");
      applyTranslation("en");
      ScrollTrigger.refresh();
    });
  }

  // Window header draggable bindings
  setupWindowDragging();

  // Close action on Red Dot button
  const closeBtn = document.getElementById("closeWindowBtn");
  if (closeBtn && win) {
    closeBtn.addEventListener("click", () => {
      win.classList.remove("open");
      
      // Clean up scroll triggers inside the window
      const triggers = ScrollTrigger.getAll();
      triggers.forEach(trigger => {
        if (trigger.vars.scroller === ".window-content") {
          trigger.kill();
        }
      });
    });
  }

  // Minimize action on Yellow Dot
  const minimizeBtn = document.getElementById("minimizeWindowBtn");
  if (minimizeBtn && win) {
    minimizeBtn.addEventListener("click", () => {
      win.classList.remove("open");
    });
  }

  // Maximize action on Green Dot
  const maximizeBtn = document.getElementById("maximizeWindowBtn");
  if (maximizeBtn && win) {
    maximizeBtn.addEventListener("click", () => {
      win.removeAttribute("style");
      win.classList.toggle("fullscreen-window");
      
      if (win.classList.contains("fullscreen-window")) {
        win.style.width = "100vw";
        win.style.height = "100vh";
        win.style.borderRadius = "0px";
      } else {
        win.style.width = "85vw";
        win.style.height = "80vh";
        win.style.borderRadius = "12px";
      }
      ScrollTrigger.refresh();
    });
  }
}

function destroySpaceModule() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  window.removeEventListener("resize", handleResize);
  spaceRenderer = null;
  spacePointers = null;
}

// Export module functions globally
window.SpaceModule = {
  init: initSpaceModule,
  destroy: destroySpaceModule
};
