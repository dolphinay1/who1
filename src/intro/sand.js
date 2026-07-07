const canvas = document.getElementById("sandCanvas");
const ctx = canvas.getContext("2d");

let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

const settings = {
  cellSize: 3,

  startText: "yunus aydogdu",
  hiddenText: "sizleri burada görmek çok güzel",

  releaseTestsPerFrame: 1500,
  releaseChance: 0.022,

  gravity: 850,
  airDrag: 0.992,

  settleStepsPerFrame: 5,

  pileHoldSeconds: 0.8,
  hiddenFadeInSeconds: 0.45,
  reformDurationSeconds: 2,
  reformStaggerSeconds: 0.65,
  revealHoldSeconds: 2.5,
  revealFadeSeconds: 0.6,

  reformArrivalDistance: 1.5
};

let cols = 0;
let rows = 0;

let fixedCodepen;
let codepenCells = [];
let looseCells = [];

let falling = [];
let pile;
let reforming = [];

let hiddenAlpha = 0;
let buttonAlpha = 0;

let phase = "codepen";
let phaseTime = 0;
let lastTime = performance.now();
let fallCount = 1;

let mouseX = -1000;
let mouseY = -1000;
let isHovered = false;

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  cols = Math.ceil(w / settings.cellSize);
  rows = Math.ceil(h / settings.cellSize);

  fixedCodepen = new Uint8Array(cols * rows);
  pile = new Uint8Array(cols * rows);

  codepenCells = [];
  looseCells = [];
  falling = [];
  reforming = [];

  hiddenAlpha = 0;
  buttonAlpha = 0;
  phase = "codepen";
  phaseTime = 0;
  fallCount = 1;

  buildCodepenText();
}

window.addEventListener("resize", resize);

// Mouse interaction tracking
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

  if (phase === "entranceReady") {
    const btnWidth = Math.max(w * 0.18, 160);
    const btnHeight = Math.max(h * 0.08, 54);
    const btnX = w / 2 - btnWidth / 2;
    const btnY = h * 0.48 - btnHeight / 2;

    if (
      mouseX >= btnX &&
      mouseX <= btnX + btnWidth &&
      mouseY >= btnY &&
      mouseY <= btnY + btnHeight
    ) {
      canvas.style.cursor = "pointer";
      isHovered = true;
    } else {
      canvas.style.cursor = "default";
      isHovered = false;
    }
  }
});

canvas.addEventListener("click", (e) => {
  if (phase === "entranceReady" && isHovered) {
    if (window.triggerDesktopTransition) {
      window.triggerDesktopTransition();
    }
  }
});

function index(col, row) {
  return row * cols + col;
}

function colFromIndex(i) {
  return i % cols;
}

function rowFromIndex(i) {
  return Math.floor(i / cols);
}

function inBounds(col, row) {
  return col >= 0 && col < cols && row >= 0 && row < rows;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function buildCodepenText() {
  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");

  maskCanvas.width = w;
  maskCanvas.height = h;

  // Responsive font size calculation for 13 chars (yunus aydogdu)
  const fontSize = Math.min(w / 8.5, h * 0.18, 120);

  maskCtx.clearRect(0, 0, w, h);
  maskCtx.fillStyle = "#fff";
  maskCtx.textAlign = "center";
  maskCtx.textBaseline = "middle";
  maskCtx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;

  maskCtx.fillText(settings.startText, w / 2, h * 0.38);

  const image = maskCtx.getImageData(0, 0, w, h).data;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = Math.floor(col * settings.cellSize + settings.cellSize / 2);
      const y = Math.floor(row * settings.cellSize + settings.cellSize / 2);

      const pixelIndex = (y * w + x) * 4;
      const alpha = image[pixelIndex + 3];

      if (alpha > 35) {
        const i = index(col, row);

        fixedCodepen[i] = 1;
        codepenCells.push(i);
        looseCells.push(i);
      }
    }
  }

  shuffle(looseCells);
}

function buildGirisText() {
  fixedCodepen.fill(0);
  codepenCells = [];
  looseCells = [];

  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");

  maskCanvas.width = w;
  maskCanvas.height = h;

  // Responsive font size calculation for 5 chars (giriş)
  const fontSize = Math.min(w / 4.8, h * 0.22, 140);

  maskCtx.clearRect(0, 0, w, h);
  maskCtx.fillStyle = "#fff";
  maskCtx.textAlign = "center";
  maskCtx.textBaseline = "middle";
  maskCtx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;

  // Draw in the center of the screen
  maskCtx.fillText("giriş", w / 2, h * 0.48);

  const image = maskCtx.getImageData(0, 0, w, h).data;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = Math.floor(col * settings.cellSize + settings.cellSize / 2);
      const y = Math.floor(row * settings.cellSize + settings.cellSize / 2);

      const pixelIndex = (y * w + x) * 4;
      const alpha = image[pixelIndex + 3];

      if (alpha > 35) {
        const i = index(col, row);

        codepenCells.push(i);
        looseCells.push(i);
      }
    }
  }

  shuffle(looseCells);
}

function triggerSecondFallReset() {
  fixedCodepen.fill(0);
  pile.fill(0);

  looseCells = codepenCells.slice();
  shuffle(looseCells);

  falling = [];
  reforming = [];

  for (const cell of codepenCells) {
    fixedCodepen[cell] = 1;
  }

  phase = "codepen";
  phaseTime = 0;
}

// Particle physics release
function releaseOneGrain(cellIndex) {
  const col = colFromIndex(cellIndex);
  const row = rowFromIndex(cellIndex);

  fixedCodepen[cellIndex] = 0;

  falling.push({
    x: col * settings.cellSize,
    y: row * settings.cellSize,

    vx: rand(-22, 22),
    vy: rand(40, 150),

    drift: rand(-55, 55),
    driftTarget: rand(-85, 85),
    driftTimer: rand(0.18, 0.9)
  });
}

function releaseCodepen() {
  if (looseCells.length === 0) {
    phase = "falling";
    phaseTime = 0;
    return;
  }

  for (let i = 0; i < settings.releaseTestsPerFrame; i++) {
    if (looseCells.length === 0) break;

    const listIndex = randInt(0, looseCells.length - 1);
    const cellIndex = looseCells[listIndex];

    if (fixedCodepen[cellIndex] === 0) {
      looseCells.splice(listIndex, 1);
      continue;
    }

    const col = colFromIndex(cellIndex);
    const row = rowFromIndex(cellIndex);

    const belowEmpty =
      row >= rows - 1 ||
      fixedCodepen[index(col, Math.min(row + 1, rows - 1))] === 0;

    const sideEmpty =
      col <= 0 ||
      col >= cols - 1 ||
      fixedCodepen[index(Math.max(col - 1, 0), row)] === 0 ||
      fixedCodepen[index(Math.min(col + 1, cols - 1), row)] === 0;

    const edgeMultiplier = belowEmpty || sideEmpty ? 3.3 : 1;

    if (Math.random() < settings.releaseChance * edgeMultiplier) {
      releaseOneGrain(cellIndex);
      looseCells.splice(listIndex, 1);
    }
  }
}

function pileSolid(col, row) {
  if (row >= rows) return true;
  if (col < 0 || col >= cols) return true;

  return pile[index(col, row)] === 1;
}

function setPile(col, row) {
  if (!inBounds(col, row)) return;

  pile[index(col, row)] = 1;
}

function settleFallingParticle(p) {
  let col = Math.floor(p.x / settings.cellSize);
  let row = Math.floor(p.y / settings.cellSize);

  col = Math.max(0, Math.min(cols - 1, col));
  row = Math.max(0, Math.min(rows - 1, row));

  if (!pileSolid(col, row)) {
    setPile(col, row);
    return;
  }

  if (!pileSolid(col - 1, row)) {
    setPile(col - 1, row);
    return;
  }

  if (!pileSolid(col + 1, row)) {
    setPile(col + 1, row);
    return;
  }

  for (let y = row - 1; y >= 0; y--) {
    if (!pileSolid(col, y)) {
      setPile(col, y);
      return;
    }
  }
}

function updateFalling(dt) {
  for (let i = falling.length - 1; i >= 0; i--) {
    const p = falling[i];

    p.driftTimer -= dt;

    if (p.driftTimer <= 0) {
      p.driftTarget = rand(-85, 85);
      p.driftTimer = rand(0.25, 1.2);
    }

    p.drift += (p.driftTarget - p.drift) * dt * 2;

    p.vx += p.drift * dt;
    p.vy += settings.gravity * dt;

    p.vx *= settings.airDrag;
    p.vy *= settings.airDrag;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const col = Math.floor(p.x / settings.cellSize);
    const nextRow = Math.floor((p.y + settings.cellSize) / settings.cellSize);

    if (p.x < -60) p.x = 0;
    if (p.x > w + 60) p.x = w - settings.cellSize;

    if (nextRow >= rows || pileSolid(col, nextRow)) {
      settleFallingParticle(p);
      falling.splice(i, 1);
    }
  }

  if (phase === "falling" && falling.length === 0) {
    if (fallCount === 1) {
      startReform();
    } else if (fallCount === 2) {
      // Build Giriş text mask and reform into it
      buildGirisText();
      startReform();
    }
  }
}

function settlePile() {
  const leftToRight = Math.random() > 0.5;

  for (let row = rows - 2; row >= 0; row--) {
    if (leftToRight) {
      for (let col = 1; col < cols - 1; col++) {
        settlePileCell(col, row);
      }
    } else {
      for (let col = cols - 2; col >= 1; col--) {
        settlePileCell(col, row);
      }
    }
  }
}

function settlePileCell(col, row) {
  const current = index(col, row);

  if (pile[current] !== 1) return;

  if (!pileSolid(col, row + 1)) {
    pile[index(col, row + 1)] = 1;
    pile[current] = 0;
    return;
  }

  const preferLeft = Math.random() > 0.5;

  if (preferLeft) {
    if (!pileSolid(col - 1, row + 1)) {
      pile[index(col - 1, row + 1)] = 1;
      pile[current] = 0;
      return;
    }

    if (!pileSolid(col + 1, row + 1)) {
      pile[index(col + 1, row + 1)] = 1;
      pile[current] = 0;
      return;
    }
  } else {
    if (!pileSolid(col + 1, row + 1)) {
      pile[index(col + 1, row + 1)] = 1;
      pile[current] = 0;
      return;
    }

    if (!pileSolid(col - 1, row + 1)) {
      pile[index(col - 1, row + 1)] = 1;
      pile[current] = 0;
      return;
    }
  }
}

function collectPileCells() {
  const cells = [];

  for (let row = rows - 1; row >= 0; row--) {
    for (let col = 0; col < cols; col++) {
      const i = index(col, row);

      if (pile[i] === 1) {
        cells.push(i);
      }
    }
  }

  return cells;
}

function startReform() {
  const pileCells = collectPileCells();
  const targets = codepenCells.slice();

  pile.fill(0);

  pileCells.sort((a, b) => rowFromIndex(b) - rowFromIndex(a));
  targets.sort((a, b) => rowFromIndex(b) - rowFromIndex(a));

  const count = Math.min(pileCells.length, targets.length);

  for (let i = 0; i < count; i++) {
    const source = pileCells[i];
    const target = targets[i];

    const sx = colFromIndex(source) * settings.cellSize;
    const sy = rowFromIndex(source) * settings.cellSize;
    const tx = colFromIndex(target) * settings.cellSize;
    const ty = rowFromIndex(target) * settings.cellSize;

    reforming.push({
      sx,
      sy,
      tx,
      ty,

      x: sx,
      y: sy,

      delay: rand(0, settings.reformStaggerSeconds),
      duration: rand(
        settings.reformDurationSeconds * 0.75,
        settings.reformDurationSeconds * 1.15
      ),

      wave: rand(-18, 18),
      phaseOffset: rand(0, Math.PI * 2),
      arrived: false
    });
  }

  // Keep remaining pile cells static at the bottom
  for (let i = count; i < pileCells.length; i++) {
    pile[pileCells[i]] = 1;
  }

  phase = "reform";
  phaseTime = 0;
}

function updateReform(dt) {
  let allArrived = true;

  for (const p of reforming) {
    const localTime = phaseTime - p.delay;

    if (localTime <= 0) {
      p.x = p.sx;
      p.y = p.sy;
      allArrived = false;
      continue;
    }

    const t = clamp01(localTime / p.duration);
    const eased = easeInOutCubic(t);

    const arc = Math.sin(eased * Math.PI);
    const wobble = Math.sin(eased * Math.PI * 2 + p.phaseOffset) * p.wave * arc;

    p.x = p.sx + (p.tx - p.sx) * eased + wobble;
    p.y = p.sy + (p.ty - p.sy) * eased - arc * h * 0.08;

    if (t < 1) {
      allArrived = false;
    }
  }

  if (allArrived) {
    for (const cell of codepenCells) {
      fixedCodepen[cell] = 1;
    }

    reforming = [];
    if (fallCount === 1) {
      phase = "hiddenHold";
    } else if (fallCount === 2) {
      phase = "entranceReady";
    }
    phaseTime = 0;
  }
}

function updatePhase(dt) {
  phaseTime += dt;

  if (phase === "codepen") {
    releaseCodepen();
  }

  if (phase === "reform") {
    updateReform(dt);
  }

  if (phase === "hiddenHold") {
    // Fade in subtext AFTER reform
    hiddenAlpha = Math.min(1, phaseTime / settings.hiddenFadeInSeconds);

    if (phaseTime >= settings.revealHoldSeconds) {
      phase = "secondFallFadeOut";
      phaseTime = 0;
    }
  }

  if (phase === "secondFallFadeOut") {
    // Fade out subtext during second fall
    hiddenAlpha = Math.max(0, 1 - phaseTime / 0.45);

    if (hiddenAlpha <= 0) {
      hiddenAlpha = 0;
      fallCount = 2;
      triggerSecondFallReset();
    }
  }

  if (phase === "entranceReady") {
    buttonAlpha = Math.min(1, phaseTime / settings.revealFadeSeconds);
  }
}

function drawHiddenText() {
  if (hiddenAlpha <= 0) return;

  ctx.save();

  const fontSize = 18;
  const lineHeight = fontSize * 1.15;
  const lines = [settings.hiddenText];

  ctx.globalAlpha = hiddenAlpha;
  ctx.fillStyle = "rgb(255, 232, 168)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;

  const startY = h - 120 - ((lines.length - 1) * lineHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], w / 2, startY + i * lineHeight);
  }

  ctx.restore();
}

function drawEntranceButton() {
  // Pill container removed, button is raw sand-spelled text
}

function drawFixedCodepen() {
  // Glow sand particles spelling Giriş when hovered
  ctx.fillStyle = (phase === "entranceReady" && isHovered) ? "rgb(255, 232, 168)" : "rgb(236, 204, 116)";

  const size = settings.cellSize;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (fixedCodepen[index(col, row)] !== 1) continue;

      ctx.fillRect(
        col * size,
        row * size,
        size,
        size
      );
    }
  }
}

function drawFalling() {
  ctx.fillStyle = "rgb(236, 204, 116)";

  const size = settings.cellSize;

  for (const p of falling) {
    ctx.fillRect(p.x, p.y, size, size);
  }
}

function drawPile() {
  ctx.fillStyle = "rgb(236, 204, 116)";

  const size = settings.cellSize;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (pile[index(col, row)] !== 1) continue;

      ctx.fillRect(
        col * size,
        row * size,
        size,
        size
      );
    }
  }
}

function drawReforming() {
  // Glow sand particles reforming Giriş when hovered
  ctx.fillStyle = (phase === "entranceReady" && isHovered) ? "rgb(255, 232, 168)" : "rgb(236, 204, 116)";

  const size = settings.cellSize;

  for (const p of reforming) {
    ctx.fillRect(p.x, p.y, size, size);
  }
}

function draw() {
  ctx.clearRect(0, 0, w, h);

  drawHiddenText();
  drawEntranceButton();

  drawFixedCodepen();
  drawFalling();
  drawPile();
  drawReforming();
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  updatePhase(dt);
  updateFalling(dt);

  if (phase !== "reform" && phase !== "hiddenHold" && phase !== "entranceReady") {
    for (let i = 0; i < settings.settleStepsPerFrame; i++) {
      settlePile();
    }
  }

  draw();

  requestAnimationFrame(tick);
}

resize();
requestAnimationFrame(tick);
