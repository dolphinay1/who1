import { playGenieClose } from "./genie.js";

export function setupWindowDragging() {
  const header = document.getElementById("windowHeader");
  const win = document.getElementById("macos-window");
  if (!header || !win) return;

  let isDragging = false;
  let startX, startY, winLeft, winTop;

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".window-controls")) return;
    if (window.innerWidth <= 768) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Get current window bounds
    const rect = win.getBoundingClientRect();
    winLeft = rect.left;
    winTop = rect.top;
    
    // Disable translate transition while dragging
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
    if (targetTop < 28) targetTop = 28; // Menu Bar boundary check
    
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

export function setupWindowControls() {
  const win = document.getElementById("macos-window");
  if (!win) return;

  setupWindowDragging();
  initMobileTouchScroll();

  // Close action on Red Dot button
  const closeBtn = document.getElementById("closeWindowBtn");
  const folder = document.getElementById("desktop-folder");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      playGenieClose(win, folder, () => {
        // Clean up scroll triggers inside the window
        const triggers = ScrollTrigger.getAll();
        triggers.forEach(trigger => {
          if (trigger.vars.scroller === ".window-content") {
            trigger.kill();
          }
        });
      });
    });
  }

  // Minimize action on Yellow Dot
  const minimizeBtn = document.getElementById("minimizeWindowBtn");
  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => {
      playGenieClose(win, folder);
    });
  }

  // Maximize action on Green Dot
  const maximizeBtn = document.getElementById("maximizeWindowBtn");
  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", () => {
      win.removeAttribute("style");
      win.dataset.dragged = "false";
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
export function initMobileTouchScroll() {
  if (window.innerWidth > 768) return;

  const windowConfigs = [
    {
      win: document.getElementById("macos-window"),
      getScrollTarget: (win) => win.querySelector(".window-content"),
      type: "div"
    },
    {
      win: document.getElementById("comp-macos-window"),
      getScrollTarget: (win) => win.querySelector("iframe"),
      type: "iframe"
    },
    {
      win: document.getElementById("proj-macos-window"),
      getScrollTarget: (win) => win.querySelector("iframe"),
      type: "iframe"
    },
    {
      win: document.getElementById("cv-macos-window"),
      getScrollTarget: (win) => win.querySelector("iframe"),
      type: "iframe"
    }
  ];

  windowConfigs.forEach(config => {
    if (!config.win) return;

    let touchStartY = 0;
    let isActive = false;

    config.win.addEventListener("touchstart", (e) => {
      if (e.target.closest(".window-controls")) return;
      if (!config.win.classList.contains("open")) return;
      touchStartY = e.touches[0].clientY;
      isActive = true;
    }, { passive: true });

    config.win.addEventListener("touchmove", (e) => {
      if (!isActive) return;
      if (!config.win.classList.contains("open")) return;
      if (e.touches.length === 0) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      touchStartY = currentY;

      const target = config.getScrollTarget(config.win);
      if (!target) return;

      if (config.type === "div") {
        target.scrollTop += deltaY;
      } else if (config.type === "iframe" && target.contentWindow) {
        try {
          target.contentWindow.scrollBy(0, deltaY);
        } catch (err) {}
      }

      e.preventDefault();
    }, { passive: false });

    config.win.addEventListener("touchend", () => {
      isActive = false;
    }, { passive: true });

    config.win.addEventListener("touchcancel", () => {
      isActive = false;
    }, { passive: true });

    // For iframe windows, bind touch listeners inside the iframe document as well
    if (config.type === "iframe") {
      const iframe = config.win.querySelector("iframe");
      if (iframe) {
        const bindIframeTouch = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (!iframeDoc) return;

            let iframeTouchStartY = 0;
            let iframeActive = false;

            iframeDoc.addEventListener("touchstart", (e) => {
              if (!config.win.classList.contains("open")) return;
              iframeTouchStartY = e.touches[0].clientY;
              iframeActive = true;
            }, { passive: true });

            iframeDoc.addEventListener("touchmove", (e) => {
              if (!iframeActive) return;
              if (!config.win.classList.contains("open")) return;
              if (e.touches.length === 0) return;

              const currentY = e.touches[0].clientY;
              const deltaY = iframeTouchStartY - currentY;
              iframeTouchStartY = currentY;

              iframe.contentWindow.scrollBy(0, deltaY);
              e.preventDefault();
            }, { passive: false });

            iframeDoc.addEventListener("touchend", () => {
              iframeActive = false;
            }, { passive: true });

            iframeDoc.addEventListener("touchcancel", () => {
              iframeActive = false;
            }, { passive: true });
          } catch (err) {
            // Same-origin check should pass but catch blocks console warning
          }
        };

        if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
          bindIframeTouch();
        }
        iframe.addEventListener("load", bindIframeTouch);
      }
    }
  });
}

