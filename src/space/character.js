export function initMagneticPortrait() {
  const portrait = document.getElementById("magnetic-portrait");
  if (!portrait) return;

  const padding = 150;
  const strength = 3;
  const activeTransition = "transform 0.3s ease-out";
  const inactiveTransition = "transform 0.6s ease-in-out";

  const handleMouseMove = (e) => {
    // Only track if the space desktop viewport is active
    const viewport = document.getElementById("space-viewport");
    if (!viewport || !viewport.classList.contains("active")) return;

    const { left, top, width, height } = portrait.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distX = Math.abs(centerX - e.clientX);
    const distY = Math.abs(centerY - e.clientY);

    if (distX < width / 2 + padding && distY < height / 2 + padding) {
      const targetX = (e.clientX - centerX) / strength;
      const targetY = (e.clientY - centerY) / strength;

      portrait.style.transition = activeTransition;
      portrait.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
    } else {
      resetPortrait();
    }
  };

  const resetPortrait = () => {
    portrait.style.transition = inactiveTransition;
    portrait.style.transform = "translate3d(0, 0, 0)";
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseleave", resetPortrait);
}
