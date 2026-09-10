import { playGenieOpen, playGenieClose } from "./genie.js";

export function initTerminal() {
  const terminalWindow = document.getElementById("terminal-window");
  const menuTerminalBtn = document.getElementById("menuTerminalBtn");
  const terminalInput = document.getElementById("terminalInput");
  const terminalOutput = document.getElementById("terminalOutput");
  const terminalBody = document.getElementById("terminalBody");
  const closeTerminalBtn = document.getElementById("closeTerminalBtn");
  const minimizeTerminalBtn = document.getElementById("minimizeTerminalBtn");
  const terminalHeader = document.getElementById("terminalHeader");

  if (!terminalWindow || !terminalInput || !terminalOutput) return;

  // Make terminal window draggable
  if (terminalHeader) {
    let isDragging = false;
    let startX, startY, winLeft, winTop;

    terminalHeader.addEventListener("mousedown", (e) => {
      if (e.target.closest(".window-controls")) return;
      if (window.innerWidth <= 768) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = terminalWindow.getBoundingClientRect();
      winLeft = rect.left;
      winTop = rect.top;

      terminalWindow.style.transition = "none";
      terminalWindow.dataset.dragged = "true";
      document.body.classList.add("dragging-active");
      gsap.set(terminalWindow, { xPercent: 0, yPercent: 0, x: 0, y: 0 });
      terminalWindow.style.left = `${winLeft}px`;
      terminalWindow.style.top = `${winTop}px`;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let targetTop = winTop + dy;
      if (targetTop < 28) targetTop = 28; // Menu Bar boundary check

      terminalWindow.style.left = `${winLeft + dx}px`;
      terminalWindow.style.top = `${targetTop}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.body.classList.remove("dragging-active");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }

  // Print welcome message
  const printWelcome = () => {
    const now = new Date();
    terminalOutput.innerHTML = `Last login: ${now.toDateString()} ${now.toLocaleTimeString()} on ttys001\nWelcome to Yunus OS Developer Terminal (v1.0.0)\nType <span style="text-decoration: underline;">help</span> to see all available commands.\n\n`;
  };
  printWelcome();

  // Print output line helper
  const print = (text, type = "normal") => {
    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    line.innerHTML = text;
    terminalOutput.appendChild(line);
    // Auto-scroll to bottom
    if (terminalBody) {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  };

  // Toggle terminal function
  const toggleTerminal = () => {
    if (terminalWindow.classList.contains("hidden-window")) {
      playGenieOpen(terminalWindow, menuTerminalBtn, () => {
        terminalInput.focus();
      });
    } else {
      playGenieClose(terminalWindow, menuTerminalBtn);
    }
  };

  // Event Listeners
  if (menuTerminalBtn) {
    menuTerminalBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTerminal();
    });
  }

  [closeTerminalBtn, minimizeTerminalBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", () => {
        playGenieClose(terminalWindow, menuTerminalBtn);
      });
    }
  });

  // Double quote (") or Tilde (`) hotkey toggle
  window.addEventListener("keydown", (e) => {
    if (e.key === "\"" || e.key === "DoubleQuote" || e.key === "`" || e.key === "~") {
      // If terminal is open and focus is in input, allow typing the quote character
      if (document.activeElement === terminalInput && !terminalWindow.classList.contains("hidden-window")) {
        return;
      }
      e.preventDefault();
      toggleTerminal();
    }
  });

  // Keep input focused when clicking terminal body
  if (terminalBody) {
    terminalBody.addEventListener("click", () => {
      terminalInput.focus();
    });
  }

  // Handle Input Commands
  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const rawInput = terminalInput.value;
      const input = rawInput.trim();
      terminalInput.value = "";

      if (!input) {
        print("yunus@macbook ~ %", "prompt-line");
        return;
      }

      // Echo command
      print(`<span style="opacity: 0.5;">yunus@macbook ~ %</span> ${rawInput}`, "command");

      const parts = input.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ").toLowerCase();

      switch (cmd) {
        case "help":
          print(`Available commands:
  about        - Display brief developer biography
  skills       - View structured developer competences
  projects     - List projects list
  contact      - Display contact/social media links
  open <name>  - Open window (about, experiences, competences, projects)
  theme <name> - Switch terminal theme (matrix, amber, white)
  clear        - Clear console output history
  close / exit - Close the terminal window

Direct Social Shortcuts:
  instagram / ig, telegram / tg, linkedin / in, github / gh, x / twitter`);
          break;

        case "about":
          print(`Yunus Aydoğdu - Software & Marketing Developer
----------------------------------------------
Istanbul, Turkey | 25 years old.
Blending the rational world of technology with the human aspect of marketing to design systems that scale.`);
          break;

        case "skills":
          print(`Competences (Yetkinlikler):
- Frontend Development: HTML5, CSS3, JavaScript (ES6+), React 18, Vite
- Animation & Styling: Tailwind CSS, GSAP, Framer Motion
- Marketing & Strategy: Growth Marketing, Brand Management, Crisis Resolution`);
          break;

        case "projects":
          print(`Featured Projects:
1. Monax Grid Dashboard - Responsive visual showcase
2. Liquid Glass switcher - Outline social dock
3. Web Audio Synthesizer - Programmable click & close sounds`);
          break;

        case "contact":
          print(`Contact & Social Media:
- Instagram: https://www.instagram.com/do.lfin/
- Telegram:  https://t.me/yadolfin
- LinkedIn:  https://www.linkedin.com/in/yunus-aydo%C4%9Fdu-b7716b374/
- GitHub:    https://github.com/dolphinay1
- X/Twitter: https://x.com/yadolfin

Type the social network name (e.g. 'telegram') to open it directly!`);
          break;

        case "instagram":
        case "ig":
          print("Opening Instagram...");
          window.open("https://www.instagram.com/do.lfin/", "_blank");
          break;

        case "telegram":
        case "tg":
          print("Opening Telegram...");
          window.open("https://t.me/yadolfin", "_blank");
          break;

        case "linkedin":
        case "in":
          print("Opening LinkedIn...");
          window.open("https://www.linkedin.com/in/yunus-aydo%C4%9Fdu-b7716b374/", "_blank");
          break;

        case "github":
        case "gh":
          print("Opening GitHub...");
          window.open("https://github.com/dolphinay1", "_blank");
          break;

        case "x":
        case "twitter":
          print("Opening X...");
          window.open("https://x.com/yadolfin", "_blank");
          break;

        case "open":
          if (!arg) {
            print("Error: Missing argument. Usage: open &lt;about | experiences | competences | projects&gt;", "error");
          } else {
            const folderMap = {
              about: "desktop-folder",
              experiences: "exp-desktop-folder",
              competences: "comp-desktop-folder",
              projects: "proj-desktop-folder"
            };

            const targetId = folderMap[arg];
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              print(`Opening ${arg} window...`);
              targetEl.click();
            } else {
              print(`Error: Window '${arg}' not found. Available: about, experiences, competences, projects`, "error");
            }
          }
          break;

        case "theme":
          if (!arg) {
            print("Error: Missing theme name. Usage: theme &lt;matrix | amber | white&gt;", "error");
          } else if (["matrix", "amber", "white"].includes(arg)) {
            terminalWindow.classList.remove("matrix", "amber", "white");
            terminalWindow.classList.add(arg);
            print(`Theme switched to ${arg}.`);
          } else {
            print(`Error: Theme '${arg}' not recognized. Available: matrix, amber, white`, "error");
          }
          break;

        case "clear":
          terminalOutput.innerHTML = "";
          break;

        case "close":
        case "exit":
          toggleTerminal();
          break;

        default:
          print(`zsh: command not found: ${cmd}. Type 'help' for available commands.`, "error");
      }
    }
  });
}
