// src/shared/utils/math-helper.js
// Math content rendering utilities

export const MathHelper = {
  /**
   * Renders LaTeX/AsciiMath content using MathJax
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
