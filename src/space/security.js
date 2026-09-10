(function() {
  // 1. Disable Right-Click (Context Menu)
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  }, false);

  // 2. Disable Keyboard Shortcuts (F12, Inspect, Save, View Source, Console)
  document.addEventListener("keydown", (e) => {
    // F12 or keyCode 123
    if (e.key === "F12" || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+Shift+I / J / C / K / E or Cmd+Alt+I / J / C / K / E
    const key = (e.key || "").toLowerCase();
    if (
      (e.ctrlKey && e.shiftKey && (key === "i" || key === "j" || key === "c" || key === "k" || key === "e")) ||
      (e.metaKey && e.altKey && (key === "i" || key === "j" || key === "c" || key === "k" || key === "e")) ||
      (e.ctrlKey && (key === "u" || key === "s")) || 
      (e.metaKey && (key === "u" || key === "s"))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
})();
