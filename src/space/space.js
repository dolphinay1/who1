import { setupWindowControls } from "./window.js";
import { bindFolderClick } from "./folder.js";
import { initMagneticPortrait } from "./character.js";
import { initAudioSystem } from "./audio.js";
import { initMenuBar } from "./menubar.js";
import { initTerminal } from "./terminal.js";
import { applyTranslation } from "./monax.js";
import { initCometSystem } from "./comet.js";

function initSpaceModule() {
  bindFolderClick();
  setupWindowControls();
  initMagneticPortrait();
  initAudioSystem();
  initMenuBar();
  initTerminal();
  initCometSystem();
  
  // Default to English on initial launch
  applyTranslation("en");
}

function destroySpaceModule() {
  // Safe cleanup placeholder
}

// Export module functions globally
window.SpaceModule = {
  init: initSpaceModule,
  destroy: destroySpaceModule
};
