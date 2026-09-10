import { applyTranslation, initMonaxGSAP } from "./monax.js";
import { playGenieOpen } from "./genie.js";

export function bindFolderClick() {
  const folder = document.getElementById("desktop-folder");
  const win = document.getElementById("macos-window");
  
  if (folder && win) {
    folder.addEventListener("click", () => {
      playGenieOpen(win, folder, () => {
        // Respect active menu bar language selection
        const menuLangTR = document.getElementById("menuLangTR");
        const currentLang = (menuLangTR && menuLangTR.classList.contains("active")) ? "tr" : "en";
        applyTranslation(currentLang);

        // Sync the window-level language button state
        const trBtn = document.getElementById("langBtnTR");
        const enBtn = document.getElementById("langBtnEN");
        if (trBtn && enBtn) {
          if (currentLang === "tr") {
            trBtn.classList.add("active");
            enBtn.classList.remove("active");
          } else {
            enBtn.classList.add("active");
            trBtn.classList.remove("active");
          }
        }
        
        // Initialize GSAP anims inside scrollable window content
        initMonaxGSAP();
        ScrollTrigger.refresh();
      });
    });
  }

  // Language buttons logic
  const langBtnTR = document.getElementById("langBtnTR");
  const langBtnEN = document.getElementById("langBtnEN");
  if (langBtnTR && langBtnEN) {
    const handleSwitch = (lang) => {
      if (lang === 'tr') {
        langBtnTR.classList.add("active");
        langBtnEN.classList.remove("active");
        applyTranslation("tr");
      } else {
        langBtnEN.classList.add("active");
        langBtnTR.classList.remove("active");
        applyTranslation("en");
      }
      ScrollTrigger.refresh();
    };

    langBtnTR.addEventListener("click", (e) => {
      e.preventDefault();
      handleSwitch("tr");
    });
    langBtnTR.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleSwitch("tr");
    }, { passive: false });

    langBtnEN.addEventListener("click", (e) => {
      e.preventDefault();
      handleSwitch("en");
    });
    langBtnEN.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleSwitch("en");
    }, { passive: false });
  }
}
