// Check for CSS.registerProperty support to handle animated custom properties
if (typeof window.CSS !== 'undefined' && typeof window.CSS.registerProperty === 'function') {
  document.body.style.setProperty('--supported', '1');
  document.body.classList.add('registerProperty-supported');
} else {
  document.body.style.setProperty('--not-supported', '1');
  document.body.classList.add('registerProperty-not-supported');
}

