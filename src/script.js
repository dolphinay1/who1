/**
 * Core Router managing modular views transitions.
 */

window.addEventListener("DOMContentLoaded", () => {
  // Initialize the entry intro module
  if (window.IntroModule && typeof window.IntroModule.init === "function") {
    window.IntroModule.init();
  }

  const radios = document.querySelectorAll(".switcher__input");
  const introViewport = document.getElementById("intro-viewport");
  const spaceViewport = document.getElementById("space-viewport");
  const rainAudio = document.getElementById("rain-audio");

  let isTransitionTriggered = false;

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked && !isTransitionTriggered) {
        isTransitionTriggered = true;

        // Play rain entry audio
        if (rainAudio) {
          rainAudio.volume = 1.0;
          rainAudio.play().catch(() => {});
        }

        // Fade transition between modular viewports
        if (introViewport && spaceViewport) {
          // Fade out intro view
          introViewport.classList.remove("active");

          // Clean up WebGL Rain assets
          if (window.IntroModule && typeof window.IntroModule.destroy === "function") {
            window.IntroModule.destroy();
          }

          // Fade in space view
          spaceViewport.classList.add("active");

          // Initialize WebGL Space Anomaly rendering
          if (window.SpaceModule && typeof window.SpaceModule.init === "function") {
            window.SpaceModule.init();
          }

          // Smoothly fade out rain audio over 1.5s
          if (rainAudio) {
            let vol = 1.0;
            const fadeInterval = setInterval(() => {
              vol -= 0.05;
              if (vol <= 0) {
                vol = 0;
                rainAudio.pause();
                clearInterval(fadeInterval);
              }
              rainAudio.volume = vol;
            }, 75);
          }
        }
      }
    });
  });
});
