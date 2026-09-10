import { playGenieOpen, playGenieClose } from "./space/genie.js";

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
  const cvWindow = document.getElementById("cv-macos-window");
  const menuCVBtn = document.getElementById("menuCVBtn");

  const closeWindowBtn = document.getElementById("closeWindowBtn");
  const minimizeWindowBtn = document.getElementById("minimizeWindowBtn");
  const expCloseBtn = document.getElementById("expCloseBtn");
  const compCloseBtn = document.getElementById("compCloseBtn");
  const projCloseBtn = document.getElementById("projCloseBtn");
  const cvCloseBtn = document.getElementById("cvCloseBtn");
  const cvMinimizeBtn = document.getElementById("cvMinimizeBtn");
  const cvMaximizeBtn = document.getElementById("cvMaximizeBtn");

  // Who is Yunus? folder click
  if (desktopFolder) {
    desktopFolder.addEventListener("click", () => {
      // workspace stays visible in background
    });
  }

  // Experience's folder click
  if (expFolder && expWindow) {
    expFolder.addEventListener("click", () => {
      playGenieOpen(expWindow, expFolder, () => {
        if (window.ExperiencesModule && typeof window.ExperiencesModule.init === "function") {
          window.ExperiencesModule.init();
        }
        ScrollTrigger.refresh();
      });
    });
  }

  // Competence's folder click
  if (compFolder && compWindow) {
    compFolder.addEventListener("click", () => {
      playGenieOpen(compWindow, compFolder);
    });
  }

  // Project's folder click
  if (projFolder && projWindow) {
    projFolder.addEventListener("click", () => {
      playGenieOpen(projWindow, projFolder);
    });
  }

  // Close buttons and window restore triggers
  if (expCloseBtn && expWindow) {
    expCloseBtn.addEventListener("click", () => {
      if (window.ExperiencesModule && typeof window.ExperiencesModule.destroy === "function") {
        window.ExperiencesModule.destroy();
      }
      playGenieClose(expWindow, expFolder);
    });
  }

  if (compCloseBtn && compWindow) {
    compCloseBtn.addEventListener("click", () => {
      playGenieClose(compWindow, compFolder);
    });
  }

  if (projCloseBtn && projWindow) {
    projCloseBtn.addEventListener("click", () => {
      playGenieClose(projWindow, projFolder);
    });
  }

  if (menuCVBtn && cvWindow) {
    menuCVBtn.addEventListener("click", () => {
      if (cvWindow.classList.contains("hidden-window") || !cvWindow.classList.contains("open")) {
        playGenieOpen(cvWindow, menuCVBtn);
      } else {
        playGenieClose(cvWindow, menuCVBtn);
      }
    });
  }

  if (cvCloseBtn && cvWindow) {
    cvCloseBtn.addEventListener("click", () => {
      playGenieClose(cvWindow, menuCVBtn);
    });
  }

  if (cvMinimizeBtn && cvWindow) {
    cvMinimizeBtn.addEventListener("click", () => {
      playGenieClose(cvWindow, menuCVBtn);
    });
  }

  if (cvMaximizeBtn && cvWindow) {
    cvMaximizeBtn.addEventListener("click", () => {
      cvWindow.removeAttribute("style");
      cvWindow.dataset.dragged = "false";
      cvWindow.classList.toggle("fullscreen-window");

      if (cvWindow.classList.contains("fullscreen-window")) {
        cvWindow.style.width = "100vw";
        cvWindow.style.height = "100vh";
        cvWindow.style.borderRadius = "0px";
      } else {
        cvWindow.style.width = "85vw";
        cvWindow.style.height = "80vh";
        cvWindow.style.borderRadius = "12px";
      }
    });
  }

  // Reusable window dragging utility for new windows
  function makeDraggable(header, win) {
    if (!header || !win) return;
    let isDragging = false;
    let startX, startY, winLeft, winTop;

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".window-controls") || e.target.closest(".exp-window-controls")) return;
      if (window.innerWidth <= 768) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = win.getBoundingClientRect();
      winLeft = rect.left;
      winTop = rect.top;
      
      win.style.transition = "none";
      win.dataset.dragged = "true";
      document.body.classList.add("dragging-active");
      gsap.set(win, { xPercent: 0, yPercent: 0, x: 0, y: 0 });
      win.style.left = `${winLeft}px`;
      win.style.top = `${winTop}px`;
      
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      let targetTop = winTop + dy;
      if (targetTop < 28) targetTop = 28;
      
      win.style.left = `${winLeft + dx}px`;
      win.style.top = `${targetTop}px`;
    }

    function onMouseUp() {
      isDragging = false;
      document.body.classList.remove("dragging-active");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  }

  const compHeader = compWindow ? compWindow.querySelector(".window-header") : null;
  const projHeader = projWindow ? projWindow.querySelector(".window-header") : null;
  const expHeader = expWindow ? expWindow.querySelector(".exp-window-header") : null;
  const cvHeader = cvWindow ? cvWindow.querySelector(".window-header") : null;
  makeDraggable(compHeader, compWindow);
  makeDraggable(projHeader, projWindow);
  makeDraggable(expHeader, expWindow);
  makeDraggable(cvHeader, cvWindow);


  // Helper for mobile responsive language buttons
  function bindLangButtons(trBtnId, enBtnId, onSwitch) {
    const trBtn = document.getElementById(trBtnId);
    const enBtn = document.getElementById(enBtnId);
    if (!trBtn || !enBtn) return;

    const selectLanguage = (lang) => {
      if (lang === 'tr') {
        trBtn.classList.add("active");
        enBtn.classList.remove("active");
        onSwitch("tr");
      } else {
        enBtn.classList.add("active");
        trBtn.classList.remove("active");
        onSwitch("en");
      }
    };

    const setupEvents = (btn, lang) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        selectLanguage(lang);
      });
      btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        selectLanguage(lang);
      }, { passive: false });
    };

    setupEvents(trBtn, 'tr');
    setupEvents(enBtn, 'en');
  }

  // Projects language buttons
  bindLangButtons("projLangTR", "projLangEN", (lang) => {
    const iframe = document.querySelector("#proj-macos-window iframe");
    if (iframe && iframe.contentWindow && typeof iframe.contentWindow.setLanguage === "function") {
      iframe.contentWindow.setLanguage(lang);
    }
  });

  // Experiences language buttons
  bindLangButtons("expLangTR", "expLangEN", (lang) => {
    if (window.ExperiencesModule && typeof window.ExperiencesModule.switchLanguage === "function") {
      window.ExperiencesModule.switchLanguage(lang);
    }
  });

  // Competences language buttons
  bindLangButtons("compLangTR", "compLangEN", (lang) => {
    const iframe = document.querySelector("#comp-macos-window iframe");
    if (iframe && iframe.contentWindow && typeof iframe.contentWindow.setLanguage === "function") {
      iframe.contentWindow.setLanguage(lang);
    }
  });
});

