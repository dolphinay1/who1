export function playGenieOpen(win, folder, onCompleteCallback) {
  if (!win || !folder) return;

  // Temporarily disable CSS transitions
  win.style.transition = "none";
  
  // Make window display flex/block and ensure opacity/visibility is correct
  win.classList.add("open");
  win.classList.remove("hidden-window");
  win.style.display = "flex";

  // Calculate coordinates
  const folderRect = folder.getBoundingClientRect();
  const folderX = folderRect.left + folderRect.width / 2;
  const folderY = folderRect.top + folderRect.height / 2;

  const isMobile = window.innerWidth <= 768;
  const isDragged = win.dataset.dragged === "true";

  let winCenterX, winCenterY;
  if (isDragged) {
    const winRect = win.getBoundingClientRect();
    winCenterX = winRect.left + winRect.width / 2;
    winCenterY = winRect.top + winRect.height / 2;
  } else {
    winCenterX = window.innerWidth * 0.5;
    winCenterY = isMobile ? (window.innerHeight * 0.44) : (window.innerHeight * 0.5);
  }

  const deltaX = folderX - winCenterX;
  const deltaY = folderY - winCenterY;
  const xPercent = (isMobile || !isDragged) ? -50 : 0;
  const yPercent = (isMobile || !isDragged) ? -50 : 0;

  // Set initial state at folder position and squished (using xPercent/yPercent for center alignment)
  gsap.set(win, {
    xPercent: xPercent,
    yPercent: yPercent,
    x: deltaX,
    y: deltaY,
    scaleX: 0.05,
    scaleY: 0.01,
    opacity: 0,
    transformOrigin: "center center"
  });

  // Genie opening animation
  gsap.to(win, {
    xPercent: xPercent,
    yPercent: yPercent,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    duration: 0.6,
    ease: "power2.out",
    onComplete: () => {
      win.style.transition = "";
      if (onCompleteCallback) onCompleteCallback();
    }
  });
}

export function playGenieClose(win, folder, onCompleteCallback) {
  if (!win || !folder) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  // Temporarily disable CSS transitions
  win.style.transition = "none";

  const folderRect = folder.getBoundingClientRect();
  const folderX = folderRect.left + folderRect.width / 2;
  const folderY = folderRect.top + folderRect.height / 2;

  const winRect = win.getBoundingClientRect();
  const winCenterX = winRect.left + winRect.width / 2;
  const winCenterY = winRect.top + winRect.height / 2;

  const deltaX = folderX - winCenterX;
  const deltaY = folderY - winCenterY;

  const isMobile = window.innerWidth <= 768;
  const isDragged = win.dataset.dragged === "true";
  const xPercent = (isMobile || !isDragged) ? -50 : 0;
  const yPercent = (isMobile || !isDragged) ? -50 : 0;

  // Genie closing animation (first squash width, then slide and squash height)
  gsap.to(win, {
    xPercent: xPercent,
    yPercent: yPercent,
    x: deltaX,
    y: deltaY,
    scaleX: 0.05,
    scaleY: 0.01,
    opacity: 0,
    duration: 0.6,
    ease: "power2.inOut",
    onComplete: () => {
      win.classList.remove("open");
      win.classList.add("hidden-window");
      win.style.transition = "";
      // Clear only transform, opacity, and display to keep user-resized custom dimensions (width/height)
      gsap.set(win, { clearProps: "transform,opacity,display" });
      if (onCompleteCallback) onCompleteCallback();
    }
  });
}
