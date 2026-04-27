// src/shared/utils/math-helper.js
// Math content rendering utilities used by both Student and Teacher

export const MathHelper = {
  /**
   * Pre-processes and wraps text for MathJax rendering.
   * Automatically detects LaTeX/AsciiMath patterns and adds delimiters if missing.
   * @param {string} text - raw text possibly containing math
   * @returns {string} HTML string safe for insertion into DOM
   */
  renderExamContent(text) {
    if (!text) return '';
    let processed = String(text)
      .replace(/\\propotional/g, '\\propto')
      .replace(/\\degree/g, '^{\\circ}')
      .replace(/\\div/g, '\\div')
      .replace(/\\times/g, '\\times')
      .replace(/\\approx/g, '\\approx');

    const hasMathDelimiters = /\$|\\\(|\\\[/.test(processed);
    const hasMathSymbols = /[_^\\]/.test(processed);

    if (hasMathDelimiters) {
      return `<span class="bengali-text math-render">${processed}</span>`;
    }

    if (hasMathSymbols) {
      // Wrap in inline math delimiters for MathJax
      return `<span class="bengali-text math-render">\\(${processed}\\)</span>`;
    }

    return `<span class="bengali-text">${processed}</span>`;
  },

  /**
   * Process an array of option strings into HTML.
   * @param {string[]} options
   * @returns {string} combined HTML
   */
  processOptions(options) {
    return options.map((opt, idx) => {
      const optText = MathHelper.renderExamContent(opt);
      return `<div class="option-math flex items-start gap-2">
        <span class="font-bold">${String.fromCharCode(65 + idx)}.</span>
        <span class="flex-1">${optText}</span>
      </div>`;
    }).join('');
  }
};

// Expose globally if needed for inline handlers
window.MathHelper = MathHelper;
