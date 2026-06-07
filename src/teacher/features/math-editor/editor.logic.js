// src/teacher/features/math-editor/editor.logic.js
// Math Editor - Advanced Preview System

console.log('📐 Math Editor Loading...');

window.MathEditor = {
    currentTextarea: null,
    overlayMap: {},

    init() {
        console.log('Math Editor Initializing...');
        
        // ফোকাস ট্র্যাক
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'TEXTAREA' && 
                (e.target.id.includes('question') || 
                 e.target.id.includes('option') || 
                 e.target.id.includes('explanation'))) {
                this.currentTextarea = e.target;
            }
        });

        // প্রিভিউ বাটন
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.math-preview-btn');
            if (btn) this.handlePreviewClick(btn);
        });

        // লাইভ প্রিভিউ আপডেট
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

        // সিম্বল বাটন ক্লিক
        document.addEventListener('click', (e) => {
            const symbolBtn = e.target.closest('.symbol-btn');
            if (symbolBtn) {
                const symbol = symbolBtn.dataset.symbol;
                if (symbol) this.insertAtCursor(symbol);
            }
        });

        // ক্যাটাগরি ট্যাব সেটআপ
        this.setupCategoryTabs();

        console.log('✅ Math Editor Ready');
    },

    // প্রিভিউ ক্লিক
    handlePreviewClick(btn) {
        const textareaId = btn.dataset.target;
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;

        if (!this.overlayMap[textareaId]) {
            this.overlayMap[textareaId] = this.createOverlay(textareaId);
        }

        const overlay = this.overlayMap[textareaId];
        
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            textarea.classList.remove('math-mode');
            btn.innerHTML = '<i class="fas fa-eye"></i>';
            textarea.style.color = '';
            textarea.style.webkitTextFillColor = '';
        } else {
            overlay.style.display = 'block';
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });
            textarea.classList.add('math-mode');
            btn.innerHTML = '<i class="fas fa-code"></i>';
            textarea.style.color = 'transparent';
            textarea.style.webkitTextFillColor = 'transparent';
            this.renderOverlay(textareaId);
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
                MathJax.typeset([previewDiv]).catch(err => {
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

    // ফ্লোটিং বাটন
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
                console.log('Panel toggled:', panel.classList.contains('show') ? 'open' : 'closed');
            }
        });
    },

    // সিম্বল ইনসার্ট
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
        if (panel) panel.classList.remove('show');
        if (this.overlayMap[textarea.id] && this.overlayMap[textarea.id].classList.contains('active')) {
            this.renderOverlay(textarea.id);
        }
    },

    // ক্যাটাগরি ট্যাব সেটআপ
    setupCategoryTabs() {
        const tabs = document.querySelectorAll('.cat-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // সব ট্যাব থেকে active ক্লাস সরান
                document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // সব গ্রিড লুকান
                document.querySelectorAll('.symbol-grid').forEach(g => g.classList.add('hidden'));

                // নির্বাচিত ক্যাটাগরি দেখান
                const cat = this.dataset.cat;
                const grid = document.querySelector(`.symbol-grid[data-cat="${cat}"]`);
                if (grid) grid.classList.remove('hidden');
            });
        });

        // ডিফল্ট: Basic ট্যাব সক্রিয়
        const defaultTab = document.querySelector('.cat-tab[data-cat="basic"]');
        if (defaultTab) defaultTab.click();
    },

    closePanel() {
        const panel = document.getElementById('math-symbols-panel');
        if (panel) panel.classList.remove('show');
    }
};

window.autoResizeTextarea = function(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
};

window.showMathButton = function() {
    const btn = document.getElementById('floating-math-btn');
    if (btn) {
        btn.classList.remove('hidden');
        btn.style.display = 'flex';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MathEditor.init();
    });
} else {
    window.MathEditor.init();
}
