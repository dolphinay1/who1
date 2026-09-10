let audioCtx = null;
let isMuted = localStorage.getItem("portfolio-muted") === "true";

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPulse(ctx, startFreq, endFreq, duration, startTime, volume = 0.15) {
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    // Fail silently if audio context is blocked
  }
}

export function playOpenSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  const time = ctx.currentTime;
  
  // Clean double pop click
  playPulse(ctx, 440, 180, 0.04, time, 0.12);
  playPulse(ctx, 520, 220, 0.05, time + 0.05, 0.12);
}

export function playCloseSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  const time = ctx.currentTime;

  // Downward frequency sweep close sound
  playPulse(ctx, 350, 120, 0.12, time, 0.15);
}

export function playHoverSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  const time = ctx.currentTime;

  // Very subtle wood block pop
  playPulse(ctx, 800, 500, 0.015, time, 0.04);
}

export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem("portfolio-muted", isMuted.toString());
  updateMuteButtonUI();
  return isMuted;
}

export function getMuteState() {
  return isMuted;
}

function updateMuteButtonUI() {
  const btn = document.getElementById("global-mute-btn");
  if (!btn) return;

  if (isMuted) {
    btn.innerHTML = `
      <svg class="audio-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>
    `;
    btn.classList.add("muted");
  } else {
    btn.innerHTML = `
      <svg class="audio-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    `;
    btn.classList.remove("muted");
  }
}

export function initAudioSystem() {
  // Bind mute button click
  const btn = document.getElementById("global-mute-btn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMute();
      
      // Warm up audio context
      getAudioContext();
    });
    updateMuteButtonUI();
  }

  // Bind close buttons for windows
  const closeButtons = [
    "closeWindowBtn",
    "expCloseBtn",
    "compCloseBtn",
    "projCloseBtn",
    "cvCloseBtn"
  ];
  closeButtons.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", () => {
        playCloseSound();
      });
    }
  });

  // Bind folder double-clicks/clicks
  const folders = document.querySelectorAll(".desktop-folder-item");
  folders.forEach((f) => {
    // Play open sound on activation
    f.addEventListener("click", () => {
      // Small delay matching window fade-in
      setTimeout(() => {
        playOpenSound();
      }, 50);
    });
  });

  // Bind hover sound for social switcher option hover
  const dockOptions = document.querySelectorAll(".switcher__option");
  dockOptions.forEach((opt) => {
    opt.addEventListener("mouseenter", () => {
      playHoverSound();
    });
  });
}
