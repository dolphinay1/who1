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
    "hero-line1": "Yunus Aslında",
    "hero-line2": "Tam",
    "hero-line3": "Olarak Şöyle Biri.",
    "about-eyebrow": "KİMLİĞİM VE YAKLAŞIMIM",
    "about-heading": "İnsanı Anlamak,<br />Sistemi İnşa Etmek.",
    "about-desc": "Teknolojinin rasyonel dünyası ve insan ilişkilerinin samimiyetini dengeleyebilen; karakterini kelimelerle pazarlamayı reddedip, işine duyduğu saygı ve netliğiyle var olmayı benimsemiş biri.",
    "card1-title": "Köklerim ve Karakterim",
    "card1-desc": "25 yaşındayım, İstanbul'da yaşıyorum. İtalyan bir anne ve Erzincanlı bir babanın oğlu olarak, zıtlıkların uyumunu ve farklılıkları kucaklamayı erken yaşta öğrendim. İ.Ü. Cerrahpaşa'daki Turizm İşletmeciliği eğitimimle de derinleşen bu kültürel altyapı, bana insanları anlama ve koordine etme yeteneği kazandırdı. Karakterimi 'yardımsever' veya 'uyumlu' gibi ezberlenmiş sıfatlarla övmek yerine; ekiplere taşıdığım şeffaflık, netlik ve samimiyetle göstermeyi daha doğru buluyorum.",
    "card1-link": "HİKAYEMİ KEŞFET ➔",
    "card2-title": "Saha Pratiği ve Merak",
    "card2-desc": "Hayatı sadece masa başında değil, kendi girişimlerimi kurup sahanın zorluklarıyla yüzleşerek öğrendim. Satış, pazarlama ve hizmet sektöründeki 7 yılı aşkın serüvenim bana kriz anlarındaki sükunetle çözüm üretmeyi öğretti. Diksiyondan gastronomiye, stres yönetiminden moda illüstrasyonuna uzanan eğitimlerim rastgele bir liste değil; insana, estetiğe ve hayata duyduğum çok yönlü merakın birer kanıtı.",
    "card2-link": "NELER ÖĞRENDİM? ➔",
    "card3-title": "Dijital Zanaat ve Vizyon",
    "card3-desc": "Bilgisayarlara duyduğum kişisel tutku, zamanla matematiksel analize ve sistem kurma becerisine dönüştü. Bugün, pazarlama dünyasındaki tecrübemi yazılım ve Yapay Zeka (AI) ile harmanlayarak, karmaşık süreçleri sadeleştiren mimariler kuruyorum. Vizyonum 'elit hizmetler' gibi içi boş vaatler satmak değil; insan odağından kopmadan, sistematik işleyen ve kendi kendini büyüten şeffaf sistemler inşa etmek.",
    "card3-link": "DİJİTAL YAKLAŞIMIM ➔",
    "cta-quote-text": "“<em>İyi yapılmış bir iş</em>, iyi söylenmiş bir <em>sözden</em> daima daha iyidir.”",
    "cta-quote-author": "— Benjamin Franklin"
  },
  en: {
    "logo": "PERSONAL IDENTITY",
    "window-title": "Who is Yunus?",
    "hero-line1": "Yunus Is Actually",
    "hero-line2": "Exactly",
    "hero-line3": "Like This.",
    "about-eyebrow": "MY IDENTITY & APPROACH",
    "about-heading": "Understanding People,<br />Building Systems.",
    "about-desc": "Balancing the rational world of technology with human relationships; refusing to market character with words, existing through respect and clarity in work.",
    "card1-title": "Roots & Character",
    "card1-desc": "I am 25 years old, living in Istanbul. As the son of an Italian mother and an Erzincan father, I learned early on to embrace diversity and the harmony of contrasts. This cultural background, enriched by my Tourism Management education at Istanbul University-Cerrahpaşa, gave me the ability to understand and coordinate people. Rather than praising my character with rote adjectives like 'helpful' or 'adaptable', I find it more accurate to demonstrate it through the transparency, clarity, and sincerity I bring to teams.",
    "card1-link": "EXPLORE MY STORY ➔",
    "card2-title": "Field Practice & Curiosity",
    "card2-desc": "I learned life not just sitting behind a desk, but by founding my own startups and facing the challenges of the field. My journey of over 7 years in sales, marketing, and the service sector taught me to produce solutions calmly during crises. My training, spanning from diction to gastronomy, stress management to fashion illustration, is not a random list; it is proof of my multi-faceted curiosity about people, aesthetics, and life.",
    "card2-link": "WHAT I'VE LEARNED ➔",
    "card3-title": "Digital Craft & Vision",
    "card3-desc": "My personal passion for computers evolved over time into mathematical analysis and system building skills. Today, blending my marketing experience with software and Artificial Intelligence (AI), I design architectures that simplify complex processes. My vision is not to sell empty promises like 'elite services', but to build transparent systems that function systematically and grow self-sufficiently without losing focus on people.",
    "card3-link": "MY DIGITAL APPROACH ➔",
    "cta-quote-text": "“<em>Well done</em> is better than <em>well said</em>.”",
    "cta-quote-author": "— Benjamin Franklin"
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
    .to(".window-content .line-1 .word > span", { y: "0%", duration: 0.9 }, 0.3)
    .to(".window-content .line-2 .word > span", { y: "0%", duration: 0.9 }, 0.45)
    .to(".window-content #inlineImg", { scale: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.4)
    .to(".window-content #ideaPill", { scale: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.55)
    .to(".window-content .line-3 .word > span", { y: "0%", duration: 0.9 }, 0.6);

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
