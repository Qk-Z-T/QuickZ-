// src/teacher/features/math-editor/editor.logic.js
// Math symbol panel, LaTeX insertion, live preview overlays

let currentFocusedTextarea = null;

export const MathEditor = {
  init() {
    console.log('MathEditor initializing...');
    
    // Track focused textarea
    document.addEventListener('focusin', (e) => {
      if (
        e.target.tagName === 'TEXTAREA' &&
        (e.target.id.includes('question') ||
          e.target.id.includes('option') ||
          e.target.id.includes('explanation'))
      ) {
        currentFocusedTextarea = e.target;
      }
    });

    // Floating math button - সরাসরি ইভেন্ট
    const floatingMathBtn = document.getElementById('floating-math-btn');
    if (floatingMathBtn) {
      floatingMathBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const panel = document.getElementById('math-symbols-panel');
        if (panel) {
          panel.classList.toggle('show');
          if (panel.classList.contains('show')) {
            panel.classList.add('fixed-position');
          } else {
            panel.classList.remove('fixed-position');
          }
        }
      });
    }

    // Preview button - ইভেন্ট ডেলিগেশন
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.math-preview-btn');
      if (!btn) return;
      
      const textareaId = btn.dataset.target;
      const textarea = document.getElementById(textareaId);
      if (!textarea) return;

      let overlay = document.getElementById('overlay-' + textareaId);
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-' + textareaId;
        overlay.className = 'math-render-overlay';
        overlay.style.display = 'none';
        textarea.parentNode.style.position = 'relative';
        textarea.parentNode.insertBefore(overlay, textarea.nextSibling);
      }

      if (overlay.style.display === 'none') {
        overlay.style.display = 'block';
        textarea.classList.add('math-mode');
        btn.innerHTML = '<i class="fas fa-code"></i>';
        this.updateMathOverlay(textareaId);
      } else {
        overlay.style.display = 'none';
        textarea.classList.remove('math-mode');
        btn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });

    // Auto-update preview
    document.addEventListener('input', (e) => {
      if (
        e.target.tagName === 'TEXTAREA' &&
        (e.target.id.includes('question') ||
          e.target.id.includes('option') ||
          e.target.id.includes('explanation'))
      ) {
        const overlayId = 'overlay-' + e.target.id;
        const overlay = document.getElementById(overlayId);
        if (overlay && overlay.style.display !== 'none') {
          this.updateMathOverlay(e.target.id);
        }
      }
    });

    // Symbol button
    document.addEventListener('click', (e) => {
      const symbolBtn = e.target.closest('.symbol-btn');
      if (symbolBtn) {
        const symbol = symbolBtn.dataset.symbol;
        if (symbol) {
          this.insertAtCursor(symbol);
        }
      }
    });

    console.log('MathEditor initialized successfully');
  },

  closePanel() {
    const panel = document.getElementById('math-symbols-panel');
    if (panel) {
      panel.classList.remove('show');
      panel.classList.remove('fixed-position');
    }
  },

  insertAtCursor(symbol) {
    if (!currentFocusedTextarea) {
      // Fallback
      const textareas = document.querySelectorAll('textarea.question-textarea, textarea.option-textarea, textarea.explanation-textarea');
      if (textareas.length > 0) {
        currentFocusedTextarea = textareas[0];
      } else {
        return;
      }
    }
    
    const textarea = currentFocusedTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    let cursorPos = before.length + symbol.length;
    if (symbol.includes('{}')) {
      cursorPos = before.length + symbol.indexOf('{}') + 1;
    }
    
    textarea.value = before + symbol + after;
    textarea.selectionStart = cursorPos;
    textarea.selectionEnd = cursorPos;
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();
    this.closePanel();
    
    const overlayId = 'overlay-' + textarea.id;
    const overlay = document.getElementById(overlayId);
    if (overlay && overlay.style.display !== 'none') {
      this.updateMathOverlay(textarea.id);
    }
  },

  updateMathOverlay(textareaId) {
    const textarea = document.getElementById(textareaId);
    const overlay = document.getElementById('overlay-' + textareaId);
    if (!textarea || !overlay) return;
    
    const content = textarea.value;
    overlay.innerHTML = '';
    
    if (!content.trim()) {
      overlay.innerHTML = '<div class="text-center text-gray-400 p-4 bengali-text">কোনো কন্টেন্ট নেই</div>';
      return;
    }
    
    const previewContent = document.createElement('div');
    previewContent.className = 'math-render bengali-text';
    
    let processedContent = content;
    const hasLatex = /\\[a-zA-Z]|\\[\[\]\(\)]|\^|_|\\frac|\\sqrt|\\sum|\\int|\\lim/.test(content);
    const isWrapped = /\\\(.*\\\)|\\\[.*\\\]/.test(content);
    if (hasLatex && !isWrapped) {
      processedContent = `\\(${content}\\)`;
    }
    
    previewContent.innerHTML = processedContent;
    overlay.appendChild(previewContent);
    
    try {
      if (window.MathJax) {
        MathJax.typeset([previewContent]);
      }
    } catch (error) {
      overlay.innerHTML = `<div class="text-red-500 p-2 bengali-text">রেন্ডারিং ত্রুটি</div>`;
    }
  }
};

window.autoResizeTextarea = function(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};

// DOM রেডি হওয়ার পর ইনিশিয়ালাইজ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    MathEditor.init();
  });
} else {
  MathEditor.init();
}

// Re-initialize on create view load
document.addEventListener('createViewLoaded', () => {
  setTimeout(() => {
    MathEditor.init();
  }, 200);
});

window.MathEditor = MathEditor;
