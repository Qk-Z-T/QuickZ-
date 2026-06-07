// src/teacher/features/math-editor/editor.logic.js
// Math Editor with Advanced Preview System

import { MathHelper } from '../../../shared/utils/math-helper.js';

let currentFocusedTextarea = null;
let overlayMap = {};

export const MathEditor = {
  init() {
    console.log('Math Editor loading...');

    // Track focused textarea
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'TEXTAREA' &&
        (e.target.id.includes('question') ||
          e.target.id.includes('option') ||
          e.target.id.includes('explanation'))) {
        currentFocusedTextarea = e.target;
      }
    });

    // Preview button click handler
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.math-preview-btn');
      if (!btn) return;
      const textareaId = btn.dataset.target;
      const textarea = document.getElementById(textareaId);
      if (!textarea) return;

      this.togglePreview(textareaId, btn);
    });

    // Live preview update on input
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA' &&
        (e.target.id.includes('question') ||
          e.target.id.includes('option') ||
          e.target.id.includes('explanation'))) {
        this.updatePreview(e.target.id);
      }
    });

    // Floating button
    this.setupFloatingButton();

    // Symbol buttons
    this.setupSymbolButtons();

    // Category tabs
    this.setupCategoryTabs();
    
    console.log('Math Editor initialized');
  },

  async togglePreview(textareaId, btn) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    let overlay = overlayMap[textareaId];
    if (!overlay) {
      overlay = this.createOverlay(textareaId);
      overlayMap[textareaId] = overlay;
    }

    if (overlay.style.display === 'block') {
      // Hide preview
      overlay.style.display = 'none';
      textarea.classList.remove('math-mode');
      btn.innerHTML = '<i class="fas fa-eye"></i>';
      textarea.style.color = '';
      textarea.style.webkitTextFillColor = '';
    } else {
      // Show preview
      overlay.style.display = 'block';
      textarea.classList.add('math-mode');
      btn.innerHTML = '<i class="fas fa-code"></i>';
      textarea.style.color = 'transparent';
      textarea.style.webkitTextFillColor = 'transparent';
      
      await this.renderPreview(textareaId);
    }
  },

  createOverlay(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return null;

    const overlay = document.createElement('div');
    overlay.id = 'overlay-' + textareaId;
    overlay.className = 'math-preview-overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.padding = '12px';
    overlay.style.overflow = 'auto';
    overlay.style.background = '#ffffff';
    overlay.style.zIndex = '10';
    overlay.style.borderRadius = '8px';
    overlay.style.boxSizing = 'border-box';
    overlay.style.pointerEvents = 'none';

    textarea.parentNode.style.position = 'relative';
    textarea.parentNode.insertBefore(overlay, textarea.nextSibling);
    return overlay;
  },

  async renderPreview(textareaId) {
    const textarea = document.getElementById(textareaId);
    const overlay = overlayMap[textareaId];
    if (!textarea || !overlay) return;

    const content = textarea.value || '';
    overlay.innerHTML = '';

    if (!content.trim()) {
      overlay.innerHTML = '<div class="text-center text-gray-400 p-4">No content to preview</div>';
      return;
    }

    try {
      // Use MathHelper to render
      const rendered = await MathHelper.renderMath(content);
      const previewDiv = document.createElement('div');
      previewDiv.className = 'math-preview-content bengali-text';
      previewDiv.innerHTML = rendered;
      overlay.appendChild(previewDiv);

      // Trigger MathJax
      if (window.MathJax) {
        await MathJax.typeset([previewDiv]);
      }
    } catch (error) {
      console.error('Math rendering error:', error);
      overlay.innerHTML = `<div class="text-red-500 p-2">Error rendering math</div>`;
    }
  },

  async updatePreview(textareaId) {
    const overlay = overlayMap[textareaId];
    if (!overlay || overlay.style.display !== 'block') return;
    await this.renderPreview(textareaId);
  },

  setupFloatingButton() {
    const btn = document.getElementById('floating-math-btn');
    if (!btn) return;

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('math-symbols-panel');
      if (panel) {
        panel.classList.toggle('show');
      }
    });
  },

  setupSymbolButtons() {
    document.addEventListener('click', (e) => {
      const symbolBtn = e.target.closest('.symbol-btn');
      if (!symbolBtn) return;
      const symbol = symbolBtn.dataset.symbol;
      if (symbol) {
        this.insertAtCursor(symbol);
      }
    });
  },

  insertAtCursor(symbol) {
    if (!currentFocusedTextarea) {
      const textarea = document.querySelector('textarea.question-textarea, textarea.option-textarea, textarea.explanation-textarea');
      if (textarea) {
        currentFocusedTextarea = textarea;
        currentFocusedTextarea.focus();
      } else {
        alert('Please click inside a question or option field first');
        return;
      }
    }

    const textarea = currentFocusedTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    let cursorPos = start + symbol.length;
    if (symbol.includes('{}')) {
      cursorPos = start + symbol.indexOf('{}') + 1;
    }
    textarea.value = value.substring(0, start) + symbol + value.substring(end);
    textarea.selectionStart = cursorPos;
    textarea.selectionEnd = cursorPos;
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();

    const panel = document.getElementById('math-symbols-panel');
    if (panel) panel.classList.remove('show');

    // Update preview if open
    if (overlayMap[textarea.id] && overlayMap[textarea.id].style.display === 'block') {
      this.renderPreview(textarea.id);
    }
  },

  setupCategoryTabs() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.symbol-grid').forEach(g => g.classList.add('hidden'));
        const cat = this.dataset.cat;
        const grid = document.querySelector(`.symbol-grid[data-cat="${cat}"]`);
        if (grid) grid.classList.remove('hidden');
      });
    });
    
    // Default: Basic tab active
    const defaultTab = document.querySelector('.cat-tab[data-cat="basic"]');
    if (defaultTab) defaultTab.click();
  },

  closePanel() {
    const panel = document.getElementById('math-symbols-panel');
    if (panel) panel.classList.remove('show');
  }
};

// Auto resize helper
window.autoResizeTextarea = function(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};

// Show math button helper
window.showMathButton = function() {
  const btn = document.getElementById('floating-math-btn');
  if (btn) {
    btn.classList.remove('hidden');
    btn.style.display = 'flex';
  }
};

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    MathEditor.init();
  });
} else {
  MathEditor.init();
}
