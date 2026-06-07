// src/shared/utils/math-helper.js
// Math content rendering utilities

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
  },

  /**
   * Renders LaTeX/AsciiMath content using MathJax.
   * This is the new method that MathEditor uses.
   * @param {string} text - raw text possibly containing math
   * @returns {Promise<string>} HTML string with rendered math
   */
  async renderMath(text) {
    if (!text) return '';
    
    let processed = String(text)
      .replace(/\\propotional/g, '\\propto')
      .replace(/\\degree/g, '^{\\circ}')
      .replace(/\\div/g, '\\div')
      .replace(/\\times/g, '\\times')
      .replace(/\\approx/g, '\\approx');

    // Wrap in math delimiters if needed
    const hasMathDelimiters = /\$|\\\(|\\\[/.test(processed);
    const hasMathSymbols = /[_^\\]/.test(processed);
    
    let wrapped = processed;
    if (hasMathSymbols && !hasMathDelimiters) {
      wrapped = `\\(${processed}\\)`;
    }
    
    return wrapped;
  },

  /**
   * Renders options for a question
   * @param {string[]} options
   * @returns {string} HTML
   */
  renderOptions(options) {
    return options.map((opt, idx) => {
      return `<div class="option-item">
        <span class="option-label">${String.fromCharCode(65 + idx)}.</span>
        <span class="option-content">${opt}</span>
      </div>`;
    }).join('');
  }
};

// Expose globally if needed for inline handlers
window.MathHelper = MathHelper;
