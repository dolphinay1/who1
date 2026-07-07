window.addEventListener("DOMContentLoaded", () => {
  const introViewport = document.getElementById("intro-viewport");
  const spaceViewport = document.getElementById("space-viewport");

  let isTransitionTriggered = false;

  window.triggerDesktopTransition = () => {
    if (isTransitionTriggered) return;
    isTransitionTriggered = true;

    if (introViewport && spaceViewport) {
      introViewport.classList.remove("active");
      introViewport.classList.add("fade-out");

      spaceViewport.classList.add("active");

      if (window.SpaceModule && typeof window.SpaceModule.init === "function") {
        window.SpaceModule.init();
      }
    }
  };

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

  // Projects language buttons logic
  const projLangTR = document.getElementById("projLangTR");
  const projLangEN = document.getElementById("projLangEN");
  if (projLangTR && projLangEN) {
    projLangTR.addEventListener("click", () => {
      projLangTR.classList.add("active");
      projLangEN.classList.remove("active");
      const iframe = document.querySelector("#proj-macos-window iframe");
      if (iframe && iframe.contentWindow && typeof iframe.contentWindow.setLanguage === "function") {
        iframe.contentWindow.setLanguage("tr");
      }
    });

    projLangEN.addEventListener("click", () => {
      projLangEN.classList.add("active");
      projLangTR.classList.remove("active");
      const iframe = document.querySelector("#proj-macos-window iframe");
      if (iframe && iframe.contentWindow && typeof iframe.contentWindow.setLanguage === "function") {
        iframe.contentWindow.setLanguage("en");
      }
    });
  }
});

