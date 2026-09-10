import { applyTranslation } from "./monax.js";

export function initMenuBar() {
  const clockEl = document.getElementById("menuClock");
  if (clockEl) {
    const updateClock = () => {
      const now = new Date();
      const pad = (num) => String(num).padStart(2, "0");
      clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Global Language Switcher Coordination inside Menu Bar
  const menuLangTR = document.getElementById("menuLangTR");
  const menuLangEN = document.getElementById("menuLangEN");

  const syncLanguage = (lang) => {
    applyTranslation(lang);
    
    if (lang === "tr") {
      menuLangTR.classList.add("active");
      menuLangEN.classList.remove("active");

      // Trigger click on all window language switchers
      ["langBtnTR", "expLangTR", "compLangTR", "projLangTR"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.click();
      });
    } else {
      menuLangEN.classList.add("active");
      menuLangTR.classList.remove("active");

      // Trigger click on all window language switchers
      ["langBtnEN", "expLangEN", "compLangEN", "projLangEN"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.click();
      });
    }
  };

  if (menuLangTR && menuLangEN) {
    menuLangTR.addEventListener("click", () => syncLanguage("tr"));
    menuLangEN.addEventListener("click", () => syncLanguage("en"));
  }

  // Menu items folder launch triggers (Genie Effect)
  const menuMap = [
    { menuId: "menuYunus", folderId: "desktop-folder" },
    { menuId: "menuExp", folderId: "exp-desktop-folder" },
    { menuId: "menuComp", folderId: "comp-desktop-folder" },
    { menuId: "menuProj", folderId: "proj-desktop-folder" }
  ];

  menuMap.forEach(({ menuId, folderId }) => {
    const menuEl = document.getElementById(menuId);
    const folderEl = document.getElementById(folderId);
    if (menuEl && folderEl) {
      menuEl.addEventListener("click", () => {
        folderEl.click();
      });
    }
  });
}
