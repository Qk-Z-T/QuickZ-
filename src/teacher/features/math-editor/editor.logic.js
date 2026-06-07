// src/teacher/features/math-editor/editor.logic.js
// Math Editor - সম্পূর্ণ নতুন সংস্করণ

console.log('📐 Math Editor Loading...');

// গ্লোবাল ম্যাথ এডিটর অবজেক্ট
window.MathEditor = {
  currentTextarea: null,
  panelOpen: false,

  // ইনিশিয়ালাইজেশন
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

    // ফ্লোটিং বাটন সেটআপ
    this.setupFloatingButton();

    // সিম্বল বাটন সেটআপ
    this.setupSymbolButtons();

    // প্রিভিউ বাটন সেটআপ
    this.setupPreviewButtons();

    console.log('✅ Math Editor Ready');
  },

  // ফ্লোটিং বাটন সেটআপ
  setupFloatingButton() {
    const btn = document.getElementById('floating-math-btn');
    if (!btn) {
      console.warn('⚠️ Floating math button not found in DOM');
      return;
    }

    // পুরনো ইভেন্ট সরান (ক্লোন করে প্রতিস্থাপন)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('math-symbols-panel');
      if (panel) {
        panel.classList.toggle('show');
        this.panelOpen = panel.classList.contains('show');
        console.log('Panel toggled:', this.panelOpen ? 'open' : 'closed');
      }
    });
    console.log('✅ Floating button ready');
  },

  // সিম্বল বাটন সেটআপ
  setupSymbolButtons() {
    document.addEventListener('click', (e) => {
      const symbolBtn = e.target.closest('.symbol-btn');
      if (!symbolBtn) return;

      const symbol = symbolBtn.dataset.symbol;
      if (symbol) {
        this.insertAtCursor(symbol);
      }
    });
    console.log('✅ Symbol buttons ready');
  },

  // প্রিভিউ বাটন সেটআপ
  setupPreviewButtons() {
    document.addEventListener('click', (e) => {
      const previewBtn = e.target.closest('.math-preview-btn');
      if (!previewBtn) return;

      const textareaId = previewBtn.dataset.target;
      const textarea = document.getElementById(textareaId);
      if (!textarea) return;

      // ওভারলে তৈরি বা টগল
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
        previewBtn.innerHTML = '<i class="fas fa-code"></i>';
        this.updatePreview(textareaId);
      } else {
        overlay.style.display = 'none';
        textarea.classList.remove('math-mode');
        previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
    console.log('✅ Preview buttons ready');
  },

  // কার্সরে সিম্বল বসানো
  insertAtCursor(symbol) {
    if (!this.currentTextarea) {
      // ফোকাসড টেক্সট এরিয়া না থাকলে প্রথমটি সিলেক্ট করুন
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

    // প্যানেল বন্ধ করুন
    const panel = document.getElementById('math-symbols-panel');
    if (panel) {
      panel.classList.remove('show');
      this.panelOpen = false;
    }

    console.log('Symbol inserted:', symbol);
  },

  // প্রিভিউ আপডেট করা
  updatePreview(textareaId) {
    const textarea = document.getElementById(textareaId);
    const overlay = document.getElementById('overlay-' + textareaId);
    if (!textarea || !overlay) return;

    const content = textarea.value;
    overlay.innerHTML = '';

    if (!content.trim()) {
      overlay.innerHTML = '<div class="text-center text-gray-400 p-4">No content to preview</div>';
      return;
    }

    const previewDiv = document.createElement('div');
    previewDiv.className = 'math-render bengali-text';

    let processed = content;
    const hasLatex = /\\[a-zA-Z]|\\[\[\]\(\)]|\^|_|\\frac|\\sqrt|\\sum|\\int|\\lim/.test(content);
    const isWrapped = /\\\(.*\\\)|\\\[.*\\\]/.test(content);
    if (hasLatex && !isWrapped) {
      processed = `\\(${content}\\)`;
    }

    previewDiv.innerHTML = processed;
    overlay.appendChild(previewDiv);

    // MathJax রেন্ডার
    if (window.MathJax) {
      try {
        MathJax.typeset([previewDiv]);
      } catch (e) {
        console.warn('MathJax error:', e);
      }
    }
  },

  // প্যানেল বন্ধ করা
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
