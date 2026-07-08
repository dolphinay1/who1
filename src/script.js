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

      // Play background video on transition
      const bgVideo = document.getElementById("space-bg-video");
      if (bgVideo) {
        bgVideo.play().catch(() => {});
      }

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

  // Video window draggable and click logic
  const videoFolder = document.getElementById("video-desktop-folder");
  const videoWindow = document.getElementById("video-macos-window");
  const videoCloseBtn = document.getElementById("videoCloseBtn");
  const videoElement = document.getElementById("intro-video-element");

  if (videoFolder && videoWindow) {
    videoFolder.addEventListener("click", () => {
      videoWindow.classList.add("open");
      if (videoElement) {
        videoElement.play().catch(() => {});
      }
    });
  }

  if (videoCloseBtn && videoWindow) {
    videoCloseBtn.addEventListener("click", () => {
      videoWindow.classList.remove("open");
      if (videoElement) {
        videoElement.pause();
      }
    });
  }

  const videoHeader = videoWindow ? videoWindow.querySelector(".window-header") : null;
  makeDraggable(videoHeader, videoWindow);

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

  // Liquid Glass Switcher Animation Helper
  const liquidSwitcher = document.querySelector(".switcher");
  if (liquidSwitcher) {
    const trackPrevious = (el) => {
      const radios = el.querySelectorAll('input[name="theme"]');
      let previousValue = null;

      // init first select
      const initiallyChecked = el.querySelector('input[name="theme"]:checked');
      if (initiallyChecked) {
        previousValue = initiallyChecked.getAttribute("c-option");
        el.setAttribute("c-previous", previousValue);
      }

      radios.forEach((radio) => {
        radio.addEventListener("change", () => {
          if (radio.checked) {
            el.setAttribute("c-previous", previousValue ?? "");
            previousValue = radio.getAttribute("c-option");
          }
        });
      });
    };

    trackPrevious(liquidSwitcher);
  }
});

