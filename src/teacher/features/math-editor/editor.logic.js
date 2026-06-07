// src/teacher/features/math-editor/editor.logic.js
// Math Editor - Advanced Preview System with Focus Fix

console.log('📐 Math Editor Loading...');

window.MathEditor = {
  currentTextarea: null,
  overlayMap: {},
  activeTextareaId: null,

  // ইনিশিয়ালাইজ
  init() {
    console.log('Math Editor Initializing...');
    
    // ফোকাস ট্র্যাক - শুধুমাত্র ম্যানুয়াল টেক্সট এরিয়া ট্র্যাক করবে
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'TEXTAREA' && 
          (e.target.id.includes('question') || 
           e.target.id.includes('option') || 
           e.target.id.includes('explanation'))) {
        this.currentTextarea = e.target;
        this.activeTextareaId = e.target.id;
        console.log('Focused textarea:', e.target.id);
      }
    });

    // প্রিভিউ বাটন সেটআপ (Event Delegation)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.math-preview-btn');
      if (!btn) return;
      this.handlePreviewClick(btn);
    });

    // লাইভ প্রিভিউ আপডেট (টাইপ করার সাথে সাথে)
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA' && 
          (e.target.id.includes('question') || 
           e.target.id.includes('option') || 
           e.target.id.includes('explanation'))) {
        this.updateLivePreview(e.target.id);
      }
    });

    // ফ্লোটিং বাটন সেটআপ
    this.setupFloatingButton();

    console.log('✅ Math Editor Ready');
  },

  // প্রিভিউ ক্লিক হ্যান্ডলার
  handlePreviewClick(btn) {
    const textareaId = btn.dataset.target;
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    // ওভারলে তৈরি করুন
    if (!this.overlayMap[textareaId]) {
      this.overlayMap[textareaId] = this.createOverlay(textareaId);
    }

    const overlay = this.overlayMap[textareaId];
    
    if (overlay.classList.contains('active')) {
      // প্রিভিউ বন্ধ করুন
      overlay.classList.remove('active');
      overlay.style.display = 'none';
      textarea.classList.remove('math-mode');
      btn.innerHTML = '<i class="fas fa-eye"></i>';
      textarea.style.color = '';
      textarea.style.webkitTextFillColor = '';
      // ফোকাস ফেরত দিন
      textarea.focus();
    } else {
      // প্রিভিউ খুলুন
      overlay.style.display = 'block';
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });
      textarea.classList.add('math-mode');
      btn.innerHTML = '<i class="fas fa-code"></i>';
      textarea.style.color = 'transparent';
      textarea.style.webkitTextFillColor = 'transparent';
      
      // রেন্ডার করুন
      this.renderOverlay(textareaId);
      // ফোকাস রাখুন (এখন টেক্সট স্বচ্ছ, কিন্তু কার্সর থাকবে)
      textarea.focus();
    }
  },

  // ওভারলে তৈরি
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

    console.log('Overlay created for:', textareaId);
    return overlay;
  },

  // ওভারলে রেন্ডার
  renderOverlay(textareaId) {
    const textarea = document.getElementById(textareaId);
    const overlay = this.overlayMap[textareaId];
    if (!textarea || !overlay) return;

    const content = textarea.value || '';
    overlay.innerHTML = '';

    if (!content.trim()) {
      overlay.innerHTML = '<div class="text-center text-gray-400 p-4">No content to preview</div>';
      return;
    }

    const previewDiv = document.createElement('div');
    previewDiv.className = 'math-preview-content bengali-text';
    
    let processed = content;
    const hasLatex = /\\[a-zA-Z]|\\[\[\]\(\)]|\^|_|\\frac|\\sqrt|\\sum|\\int|\\lim/.test(content);
    const isWrapped = /\\\(.*\\\)|\\\[.*\\\]/.test(content);
    if (hasLatex && !isWrapped) {
      processed = `\\(${content}\\)`;
    }

    previewDiv.innerHTML = processed;
    overlay.appendChild(previewDiv);

    if (window.MathJax) {
      try {
        MathJax.typeset([previewDiv]).catch((err) => {
          console.warn('MathJax typeset error:', err);
          previewDiv.innerHTML = processed;
        });
      } catch (e) {
        console.warn('MathJax error:', e);
        previewDiv.innerHTML = processed;
      }
    } else {
      previewDiv.innerHTML = processed;
    }
  },

  // লাইভ প্রিভিউ আপডেট
  updateLivePreview(textareaId) {
    const overlay = this.overlayMap[textareaId];
    if (!overlay || !overlay.classList.contains('active')) return;
    this.renderOverlay(textareaId);
  },

  // ফ্লোটিং বাটন সেটআপ
  setupFloatingButton() {
    const btn = document.getElementById('floating-math-btn');
    if (!btn) {
      console.warn('Floating math button not found');
      return;
    }

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('math-symbols-panel');
      if (panel) {
        panel.classList.toggle('show');
        console.log('Panel toggled:', panel.classList.contains('show') ? 'open' : 'closed');
        // প্যানেল খোলার সময় ফোকাস টেক্সট এরিয়ায় রাখুন
        if (this.currentTextarea) {
          this.currentTextarea.focus();
        }
      }
    });
  },

  // সিম্বল ইনসার্ট - উন্নত সংস্করণ
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
    
    // গুরুত্বপূর্ণ: ফোকাস ফেরত দিন
    textarea.focus();
    
    // প্যানেল বন্ধ করুন
    const panel = document.getElementById('math-symbols-panel');
    if (panel) panel.classList.remove('show');

    // যদি প্রিভিউ ওপেন থাকে, তাহলে আপডেট করুন
    if (this.overlayMap[textarea.id] && this.overlayMap[textarea.id].classList.contains('active')) {
      this.renderOverlay(textarea.id);
    }
  },

  // প্যানেল বন্ধ করুন
  closePanel() {
    const panel = document.getElementById('math-symbols-panel');
    if (panel) panel.classList.remove('show');
    // ফোকাস ফেরত দিন
    if (this.currentTextarea) {
      this.currentTextarea.focus();
    }
  }
};

// অটো রিসাইজ টেক্সটএরিয়া
window.autoResizeTextarea = function(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};

// শো ম্যাথ বাটন
window.showMathButton = function() {
  const btn = document.getElementById('floating-math-btn');
  if (btn) {
    btn.classList.remove('hidden');
    btn.style.display = 'flex';
  }
};

// DOM রেডি হলে ইনিশিয়ালাইজ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MathEditor.init();
  });
} else {
  window.MathEditor.init();
}
