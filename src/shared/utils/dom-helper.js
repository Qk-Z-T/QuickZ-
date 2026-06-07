// src/shared/utils/dom-helper.js
// Common DOM manipulation utilities

/**
 * Load MathJax and typeset within a specific element.
 * If MathJax is already loaded, typesets immediately; otherwise loads it dynamically.
 * @param {Function|null} callback
 * @param {HTMLElement|null} targetElement
 */
export function loadMathJax(callback, targetElement) {
  setTimeout(() => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      if (window.MathJax.typesetClear) window.MathJax.typesetClear();
      MathJax.typesetPromise(targetElement ? [targetElement] : undefined)
        .then(() => { if (callback) callback(); })
        .catch(err => console.warn('MathJax error', err));
      return;
    }
    if (!document.getElementById('mathjax-script')) {
      const script = document.createElement('script');
      script.id = 'mathjax-script';
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
      script.async = true;
      script.onload = () => {
        MathJax.typesetPromise(targetElement ? [targetElement] : undefined)
          .then(() => { if (callback) callback(); })
          .catch(err => console.warn('MathJax error', err));
      };
      document.head.appendChild(script);
    }
  }, 50);
}

/**
 * Show a toast notification using SweetAlert2.
 * @param {string} title
 * @param {string} icon - 'success', 'error', 'warning', 'info'
 * @param {number} timer
 */
export function showToast(title, icon = 'success', timer = 3000) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: icon,
    title: title,
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true
  });
}

/**
 * Debounce helper.
 */
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Expose globally if needed
window.loadMathJax = loadMathJax;
window.showToast = showToast;
