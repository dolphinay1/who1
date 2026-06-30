/**
 * Intro Module logic managing the Rain WebGL backdrop and switcher choice.
 */

let raindropInstance = null;
const rainScaleFactor = 0.5;

function loadRaindropsScript() {
  return new Promise((resolve, reject) => {
    if (window.Raindrops) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://fyildiz1974.github.io/web/files/raindrops.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Raindrops script load failed"));
    document.head.appendChild(script);
  });
}

function initRaindropsBackdrop() {
  const canvas = document.getElementById("bg-canvas");
  const bg = document.getElementById("custom-bg");

  if (!canvas || !bg) return;

  canvas.width = window.innerWidth * rainScaleFactor;
  canvas.height = window.innerHeight * rainScaleFactor;

  if (!bg.complete || bg.naturalWidth === 0) {
    bg.addEventListener("load", () => initRaindropsBackdrop(), { once: true });
    return;
  }

  try {
    raindropInstance = new Raindrops(canvas, canvas.width, canvas.height, {
      renderDropsOnTop: true,
      brightness: 1.04,
      alphaMultiply: 6,
      alphaSubtract: 3,
      minR: 10,
      maxR: 40,
      rainChance: 0.15,
      rainLimit: 3,
      dropletsRate: 15,
      dropletsSize: [3, 5.5],
      trailRate: 1,
      trailScaleRange: [0.2, 0.45],
      fg: bg,
      bg: bg
    });
  } catch (e) {
    // Fail silently in case of context loading issues
  }
}

function initIntroModule() {
  // Track previous switcher values
  const switcher = document.querySelector(".switcher");
  if (switcher) {
    let previousValue = null;
    const initiallyChecked = switcher.querySelector('input[type="radio"]:checked');
    if (initiallyChecked) {
      previousValue = initiallyChecked.getAttribute("c-option");
      switcher.setAttribute("c-previous", previousValue);
    }

    const radios = switcher.querySelectorAll('input[type="radio"]');
    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          switcher.setAttribute("c-previous", previousValue ?? "");
          previousValue = radio.getAttribute("c-option");
        }
      });
    });
  }

  // Load raindrops
  loadRaindropsScript()
    .then(() => initRaindropsBackdrop())
    .catch(() => {});
}

function destroyIntroModule() {
  if (raindropInstance && typeof raindropInstance.destroy === "function") {
    raindropInstance.destroy();
    raindropInstance = null;
  }
}

// Export module functions globally
window.IntroModule = {
  init: initIntroModule,
  destroy: destroyIntroModule
};
