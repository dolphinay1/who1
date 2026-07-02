window.addEventListener("DOMContentLoaded", () => {
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

        if (rainAudio) {
          rainAudio.volume = 1.0;
          rainAudio.play().catch(() => {});
        }

        if (introViewport && spaceViewport) {
          introViewport.classList.remove("active");

          if (window.IntroModule && typeof window.IntroModule.destroy === "function") {
            window.IntroModule.destroy();
          }

          spaceViewport.classList.add("active");

          if (window.SpaceModule && typeof window.SpaceModule.init === "function") {
            window.SpaceModule.init();
          }

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

  const expFolder = document.getElementById("exp-desktop-folder");
  const expWindow = document.getElementById("exp-macos-window");
  const expCloseBtn = document.getElementById("expCloseBtn");
  const macosWindow = document.getElementById("macos-window");
  const desktopFolder = document.getElementById("desktop-folder");

  if (expFolder && expWindow) {
    expFolder.addEventListener("click", () => {
      if (macosWindow) macosWindow.classList.add("hidden-window");
      if (desktopFolder) desktopFolder.style.display = "none";
      expFolder.style.display = "none";

      expWindow.classList.remove("hidden-window");
    });
  }

  if (expCloseBtn && expWindow) {
    expCloseBtn.addEventListener("click", () => {
      expWindow.classList.add("hidden-window");

      if (desktopFolder) desktopFolder.style.display = "";
      if (expFolder) expFolder.style.display = "";
    });
  }
});

