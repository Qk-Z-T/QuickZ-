// src/teacher/features/math-editor/editor.logic.js
// Math Editor - সম্পূর্ণ নতুন সংস্করণ (Preview ঠিক করা)

console.log('📐 Math Editor Loading...');

window.MathEditor = {
  currentTextarea: null,
  panelOpen: false,

  init() {
    console.log('Math Editor Initializing...');
    
    // টেক্সট এরিয়া ফোকাস ট্র্যাক করা
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'TEXTAREA' && 
          (e.target.id.includes('question') || 
           e.target.id.includes('option') || 
           e.target.id.includes('explanation'))) {
        this.currentTextarea = e.target;
      }
    });

    this.setupFloatingButton();
    this.setupSymbolButtons();
    this.setupPreviewButtons(); // এখানে প্রিভিউ সেটআপ

    console.log('✅ Math Editor Ready');
  },

  setupFloatingButton() {
    const btn = document.getElementById('floating-math-btn');
    if (!btn) {
      console.warn('⚠️ Floating math button not found');
      return;
    }
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('math-symbols-panel');
      if (panel) {
        panel.classList.toggle('show');
        this.panelOpen = panel.classList.contains('show');
      }
    });
    console.log('✅ Floating button ready');
  },

  setupSymbolButtons() {
    document.addEventListener('click', (e) => {
      const symbolBtn = e.target.closest('.symbol-btn');
      if (!symbolBtn) return;
      const symbol = symbolBtn.dataset.symbol;
      if (symbol) this.insertAtCursor(symbol);
    });
    console.log('✅ Symbol buttons ready');
  },

  setupPreviewButtons() {
    // প্রিভিউ বাটন ক্লিক হ্যান্ডলার
    document.addEventListener('click', (e) => {
      const previewBtn = e.target.closest('.math-preview-btn');
      if (!previewBtn) return;

      const textareaId = previewBtn.dataset.target;
      const textarea = document.getElementById(textareaId);
      if (!textarea) {
        console.warn('Textarea not found:', textareaId);
        return;
      }

      // ওভারলে তৈরি বা টগল
      let overlay = document.getElementById('overlay-' + textareaId);
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-' + textareaId;
        overlay.className = 'math-render-overlay';
        overlay.style.display = 'none';
        // প্যারেন্ট পজিশন রিলেটিভ করুন
        textarea.parentNode.style.position = 'relative';
        textarea.parentNode.insertBefore(overlay, textarea.nextSibling);
        console.log('Overlay created for:', textareaId);
      }

      if (overlay.style.display === 'none') {
        // শো প্রিভিউ
        overlay.style.display = 'block';
        textarea.classList.add('math-mode');
        previewBtn.innerHTML = '<i class="fas fa-code"></i>';
        this.updatePreview(textareaId);
      } else {
        // হাইড প্রিভিউ
        overlay.style.display = 'none';
        textarea.classList.remove('math-mode');
        previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
    console.log('✅ Preview buttons ready');
  },

  insertAtCursor(symbol) {
    if (!this.currentTextarea) {
      const textarea = document.querySelector('textarea.question-textarea, textarea.option-textarea, textarea.explanation-textarea');
      if (textarea) {
        this.currentTextarea = textarea;
        this.currentTextarea.focus();
      } else {
        alert('Please click inside a question or option field first');
        return;
      }
    }
    const textarea = this.currentTextarea;
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
    if (panel) {
      panel.classList.remove('show');
      this.panelOpen = false;
    }
  },

  updatePreview(textareaId) {
    const textarea = document.getElementById(textareaId);
    const overlay = document.getElementById('overlay-' + textareaId);
    if (!textarea || !overlay) {
      console.warn('Textarea or overlay not found for preview');
      return;
    }

    const content = textarea.value;
    overlay.innerHTML = '';

    if (!content.trim()) {
      overlay.innerHTML = '<div class="text-center text-gray-400 p-4">No content to preview</div>';
      return;
    }

    // MathJax রেন্ডার করার জন্য প্রসেসিং
    let processed = content;
    // যদি ইতিমধ্যে ডেলিমিটার না থাকে তবে যোগ করুন
    const hasDelimiters = /\\\(|\\\[|\$/.test(content);
    if (!hasDelimiters) {
      // সাধারণ ল্যাটেক্স প্যাটার্ন চেক
      const hasLatex = /\\[a-zA-Z]|\\[\[\]\(\)]|\^|_|\\frac|\\sqrt|\\sum|\\int|\\lim/.test(content);
      if (hasLatex) {
        processed = `\\(${content}\\)`;
      }
    }

    overlay.innerHTML = processed;

    // MathJax রেন্ডার করুন
    if (window.MathJax) {
      try {
        MathJax.typesetPromise([overlay]).then(() => {
          console.log('Preview rendered successfully');
        }).catch((err) => {
          console.warn('MathJax rendering error:', err);
          overlay.innerHTML = '<div class="text-red-500 p-2">MathJax rendering error</div>';
        });
      } catch (e) {
        console.warn('MathJax error:', e);
        overlay.innerHTML = '<div class="text-red-500 p-2">MathJax error</div>';
      }
    } else {
      console.warn('MathJax not loaded, preview may not render');
    }
  },

  closePanel() {
    const panel = document.getElementById('math-symbols-panel');
    if (panel) {
      panel.classList.remove('show');
      this.panelOpen = false;
    }
  }
};

// DOM রেডি হওয়ার পর ইনিশিয়ালাইজ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MathEditor.init();
  });
} else {
  window.MathEditor.init();
}

// অটো রিসাইজ টেক্সটএরিয়া
window.autoResizeTextarea = function(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};

// শো ম্যাথ বাটন (ক্রিয়েট ভিউ থেকে কল হবে)
window.showMathButton = function() {
  const btn = document.getElementById('floating-math-btn');
  if (btn) {
    btn.classList.remove('hidden');
    btn.style.display = 'flex';
    console.log('✅ Math button shown');
  }
};
