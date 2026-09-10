/**
 * Space Comet and Twinkling Star Field Module
 * Uses GSAP for high performance animations.
 */
export function initCometSystem() {
  const viewport = document.getElementById("space-viewport");
  const starsContainer = document.querySelector(".space-background-stars");

  if (!viewport) return;

  // 1. Generate Realistic Stars Field inside starsContainer
  if (starsContainer) {
    starsContainer.innerHTML = ""; // Clear
    const starCount = window.innerWidth <= 768 ? 50 : 100;
    
    // Color templates for realistic stars
    const colors = [
      "#ffffff", // Pure White
      "#ffffff", 
      "#fffaf0", // Floral White (warm)
      "#fff8e7", // Cosmic Latte (warm)
      "#e3f2fd", // Soft Blue (cool)
      "#f3e5f5"  // Soft Purple tint
    ];

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = "space-star";
      
      const size = Math.random() < 0.1 ? 3 : (Math.random() < 0.4 ? 2 : 1);
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const minOpacity = 0.05 + Math.random() * 0.15;
      const maxOpacity = 0.55 + Math.random() * 0.4;
      const duration = 3 + Math.random() * 5; // 3s to 8s twinkle
      const delay = Math.random() * 5; // up to 5s offset
      const color = colors[Math.floor(Math.random() * colors.length)];

      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      star.style.background = color;
      
      // Twinkling CSS variables
      star.style.setProperty("--star-min-opacity", minOpacity);
      star.style.setProperty("--star-max-opacity", maxOpacity);
      star.style.setProperty("--twinkle-duration", `${duration}s`);
      star.style.setProperty("--twinkle-delay", `${delay}s`);

      // Add soft glow to larger stars
      if (size === 3) {
        star.style.boxShadow = `0 0 4px ${color}, 0 0 8px rgba(255,255,255,0.4)`;
      } else if (size === 2) {
        star.style.boxShadow = `0 0 2px ${color}`;
      }

      starsContainer.appendChild(star);
    }
  }

  // 2. Trail Sparkle Generator
  function createTrailSparkle(x, y) {
    const sparkle = document.createElement("div");
    sparkle.className = "comet-tail-sparkle";
    viewport.appendChild(sparkle);
    
    gsap.set(sparkle, { left: x, top: y });

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 8;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    gsap.to(sparkle, {
      x: tx,
      y: ty,
      scale: 0.1,
      opacity: 0,
      duration: 0.6 + Math.random() * 0.4,
      ease: "power2.out",
      onComplete: () => {
        sparkle.remove();
      }
    });
  }

  // 3. Comet Spawning logic (Realistic Shooting Stars)
  function spawnComet() {
    const comet = document.createElement("div");
    comet.className = "retro-comet";
    viewport.appendChild(comet);

    // Randomize diagonal paths:
    // Directions: 0 = Top-Left to Bottom-Right, 1 = Top-Right to Bottom-Left
    const direction = Math.random() < 0.5 ? 0 : 1;
    let startX, startY, endX, endY;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    if (direction === 0) {
      startX = -150;
      startY = Math.random() * (winH * 0.4);
      endX = winW + 150;
      endY = startY + (winH * 0.5) + Math.random() * 150;
    } else {
      startX = winW + 150;
      startY = Math.random() * (winH * 0.4);
      endX = -150;
      endY = startY + (winH * 0.5) + Math.random() * 150;
    }

    // Calculate angle of flight to rotate the streak line
    const dx = endX - startX;
    const dy = endY - startY;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * 180 / Math.PI;

    gsap.set(comet, { 
      left: startX, 
      top: startY,
      "--comet-rotate": `${angleDeg}deg`
    });

    // Spawn trail sparkles periodically while moving
    const trailInterval = setInterval(() => {
      const rect = comet.getBoundingClientRect();
      createTrailSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }, 50);

    // Animate the shooting star along diagonal path
    gsap.to(comet, {
      left: endX,
      top: endY,
      duration: 1.8 + Math.random() * 1.2, // Fast shooting star: 1.8s - 3s
      ease: "power2.out",
      onComplete: () => {
        clearInterval(trailInterval);
        comet.remove();
      }
    });
  }

  // 4. Spawn Scheduler Loop
  function triggerCometScheduler() {
    const delay = 5000 + Math.random() * 8000; // 5 to 13 seconds between spawns
    setTimeout(() => {
      // Prevent spawning if the tab/page is hidden/inactive in the background
      const isVisible = !document.hidden && viewport.classList.contains("active");
      if (isVisible) {
        spawnComet();
      }
      triggerCometScheduler();
    }, delay);
  }

  // Start spawning loop
  triggerCometScheduler();
}
