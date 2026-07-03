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

  const workspace = document.getElementById("desktop-workspace");
  const desktopFolder = document.getElementById("desktop-folder");
  const expFolder = document.getElementById("exp-desktop-folder");
  const compFolder = document.getElementById("comp-desktop-folder");
  const projFolder = document.getElementById("proj-desktop-folder");

  const macosWindow = document.getElementById("macos-window");
  const expWindow = document.getElementById("exp-macos-window");
  const compWindow = document.getElementById("comp-macos-window");
  const projWindow = document.getElementById("proj-macos-window");

  const closeWindowBtn = document.getElementById("closeWindowBtn");
  const minimizeWindowBtn = document.getElementById("minimizeWindowBtn");
  const expCloseBtn = document.getElementById("expCloseBtn");
  const compCloseBtn = document.getElementById("compCloseBtn");
  const projCloseBtn = document.getElementById("projCloseBtn");

  // Who is Yunus? folder click
  if (desktopFolder) {
    desktopFolder.addEventListener("click", () => {
      // workspace stays visible in background
    });
  }

  // Experience's folder click
  if (expFolder && expWindow) {
    expFolder.addEventListener("click", () => {
      expWindow.classList.remove("hidden-window");
      if (window.ExperiencesModule && typeof window.ExperiencesModule.init === "function") {
        window.ExperiencesModule.init();
      }
    });
  }

  // Competence's folder click
  if (compFolder && compWindow) {
    compFolder.addEventListener("click", () => {
      compWindow.classList.add("open");
    });
  }

  // Project's folder click
  if (projFolder && projWindow) {
    projFolder.addEventListener("click", () => {
      projWindow.classList.add("open");
    });
  }

  // Close buttons and window restore triggers
  if (expCloseBtn && expWindow) {
    expCloseBtn.addEventListener("click", () => {
      expWindow.classList.add("hidden-window");
      if (window.ExperiencesModule && typeof window.ExperiencesModule.destroy === "function") {
        window.ExperiencesModule.destroy();
      }
    });
  }

  if (compCloseBtn && compWindow) {
    compCloseBtn.addEventListener("click", () => {
      compWindow.classList.remove("open");
    });
  }

  if (projCloseBtn && projWindow) {
    projCloseBtn.addEventListener("click", () => {
      projWindow.classList.remove("open");
    });
  }

  // Reusable window dragging utility for new windows
  function makeDraggable(header, win) {
    if (!header || !win) return;
    let isDragging = false;
    let startX, startY, winLeft, winTop;

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".window-controls")) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = win.getBoundingClientRect();
      winLeft = rect.left;
      winTop = rect.top;
      
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

  const compHeader = compWindow ? compWindow.querySelector(".window-header") : null;
  const projHeader = projWindow ? projWindow.querySelector(".window-header") : null;
  makeDraggable(compHeader, compWindow);
  makeDraggable(projHeader, projWindow);
});

