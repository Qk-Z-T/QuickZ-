// src/teacher/features/exam-create/create.view.js
// UI rendering functions for the Exam Creation form

import { AppState } from '../../core/state.js';

export function renderCreateForm(type) {
  const isLive = type === 'live';
  const groupName = AppState.selectedGroup?.name || 'Course';

  const getSubjectsForType = (type) => {
    const folderStructure = window.folderStructure;
    if (!folderStructure || !folderStructure[type]) return [];
    return [...new Set(folderStructure[type].map(s => s.name))];
  };

  const subjects = getSubjectsForType(type);

  return `
    <div class="w-full px-4 md:px-6">
      <div class="flex justify-between items-center mb-4">
        <button onclick="Teacher.createView()" class="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <i class="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
      <h2 class="text-xl font-bold mb-4 font-en text-gray-800 dark:text-white">Create ${isLive ? 'Live Exam' : 'Practice Test'}</h2>

      <!-- Current Course Mini Info -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border dark:border-gray-700 mb-4 flex items-center gap-3">
        <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 text-sm">
          <i class="fas fa-book"></i>
        </div>
        <div>
          <span class="font-bold dark:text-white text-sm">${groupName}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">পরীক্ষা তৈরি হচ্ছে</span>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700 w-full">
        <input id="nt" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl" placeholder="Exam Title">
        <input type="hidden" id="nty" value="${type}">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div class="select-container">
            <label class="block text-sm font-bold mb-1 dark:text-white">Subject</label>
            <select id="nsub" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl" ${type === 'mock' ? 'required' : ''}>
              <option value="">Select Subject (Optional)</option>
              ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="select-container">
            <label class="block text-sm font-bold mb-1 dark:text-white">Chapter</label>
            <select id="nchap" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl" ${type === 'mock' ? 'required' : ''}>
              <option value="">Select Chapter (Optional)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label class="block text-sm font-bold mb-1 dark:text-white">Duration (Minutes)</label>
            <input id="nd" type="number" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl" placeholder="e.g., 60" required>
          </div>
          <div>
            <label class="block text-sm font-bold mb-1 dark:text-white">Total Marks</label>
            <input id="nm" type="number" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl" placeholder="e.g., 100" required>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label class="block text-sm font-bold mb-1 dark:text-white">Negative Mark</label>
            <select id="nneg" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl">
              <option value="0" selected>0 (No Negative)</option>
              <option value="0.25">0.25 (¼ Mark)</option>
              <option value="0.50">0.50 (½ Mark)</option>
            </select>
          </div>
          <div class="flex items-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400 p-2 rounded border dark:border-gray-700">Type: ${type.toUpperCase()}</div>
        </div>

        ${isLive ? `
        <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-3 mt-4">
          <div>
            <label class="text-sm font-bold text-indigo-800 dark:text-indigo-300">Start Time</label>
            <input id="nst" type="datetime-local" class="w-full p-2 border dark:border-gray-700 dark:bg-black dark:text-white rounded-lg text-sm">
          </div>
          <div>
            <label class="text-sm font-bold text-indigo-800 dark:text-indigo-300">End Time</label>
            <input id="net" type="datetime-local" class="w-full p-2 border dark:border-gray-700 dark:bg-black dark:text-white rounded-lg text-sm">
          </div>
          <div class="auto-publish-container">
            <input type="checkbox" id="nautopub" checked>
            <label for="nautopub" class="text-sm font-bold text-gray-700 dark:text-gray-300">Auto Publish Result when exam ends</label>
          </div>
        </div>` : ''}

        <div class="flex items-center justify-between mb-3 mt-6">
          <label class="text-sm font-bold text-gray-700 dark:text-white">Question Mode:</label>
          <div class="flex items-center gap-2">
            <button id="mode-manual" onclick="Teacher.switchQuestionMode('manual')" class="px-3 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-lg">Manual</button>
            <button id="mode-json" onclick="Teacher.switchQuestionMode('json')" class="px-3 py-1.5 text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">JSON</button>
          </div>
        </div>

        <div id="questions-list" class="space-y-3 mb-6">
          <h3 class="font-bold text-lg mb-2 dark:text-white">Questions List (0)</h3>
          <div class="text-center p-4 text-gray-400">No questions added yet</div>
        </div>

        <div id="manual-questions-container" class="space-y-4 w-full">
          <div class="question-box dark:bg-black dark:border-gray-700 w-full">
            <h3 class="font-bold text-lg mb-3 dark:text-white" id="question-form-title">Add New Question</h3>

            <div class="question-field-container mb-3 w-full">
              <label class="block text-sm font-bold mb-1 dark:text-white">Question Text</label>
              <textarea id="textarea-question" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl question-textarea auto-resize box-border" rows="3" placeholder="Enter question text..." oninput="autoResizeTextarea(this)"></textarea>
              <button type="button" class="math-preview-btn" data-target="textarea-question"><i class="fas fa-eye"></i></button>
            </div>

            <div class="mb-3 w-full">
              <label class="block text-sm font-bold mb-2 dark:text-white">Options:</label>
              <div class="space-y-2 w-full">
                ${['A', 'B', 'C', 'D'].map((letter, index) => `
                  <div class="flex items-center gap-2 w-full">
                    <span class="font-bold w-6 dark:text-white">${letter}.</span>
                    <div class="question-field-container flex-1 w-full">
                      <textarea id="option-${letter.toLowerCase()}" class="w-full p-2 border dark:border-gray-700 dark:bg-black dark:text-white rounded option-textarea auto-resize box-border" rows="2" placeholder="Option ${letter}" oninput="autoResizeTextarea(this)"></textarea>
                      <button type="button" class="math-preview-btn" data-target="option-${letter.toLowerCase()}"><i class="fas fa-eye"></i></button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="mb-3 w-full">
              <label class="block text-sm font-bold mb-1 dark:text-white">Correct Answer</label>
              <select id="correct-answer" class="w-full p-2 border dark:border-gray-700 dark:bg-black dark:text-white rounded">
                <option value="">Select Correct Answer</option>
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
              </select>
            </div>

            <div class="mb-3 w-full">
              <label class="block text-sm font-bold mb-1 dark:text-white">Explanation (Optional)</label>
              <div class="question-field-container w-full">
                <textarea id="explanation" class="w-full p-2 border dark:border-gray-700 dark:bg-black dark:text-white rounded explanation-textarea auto-resize box-border" rows="2" placeholder="Add explanation for this question (optional)..." oninput="autoResizeTextarea(this)"></textarea>
                <button type="button" class="math-preview-btn" data-target="explanation"><i class="fas fa-eye"></i></button>
              </div>
            </div>

            <div class="mb-3 w-full">
              <label class="block text-sm font-bold mb-1 dark:text-white">Previous Year (Optional)</label>
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                <input type="text" id="previous-year" class="flex-1 w-full p-2 border dark:border-gray-700 dark:bg-black dark:text-white rounded" placeholder="e.g., 2020 HSC">
                <div class="flex items-center gap-2 whitespace-nowrap">
                  <input type="checkbox" id="show-previous-year" class="rounded">
                  <label for="show-previous-year" class="text-sm font-medium text-gray-700 dark:text-gray-300">Show in question</label>
                </div>
              </div>
            </div>

            <button onclick="Teacher.addQuestionToList()" id="add-question-btn" class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
              <i class="fas fa-plus mr-2"></i> Add Question to List
            </button>
          </div>
        </div>

        <div id="json-container" class="hidden w-full mt-4">
          <div class="json-actions flex gap-2 mb-2">
            <button onclick="Teacher.copyJson()" class="bg-indigo-600 text-white px-3 py-2 rounded text-sm font-bold"><i class="fas fa-copy mr-1"></i> Copy JSON</button>
            <button onclick="Teacher.clearJson()" class="bg-red-600 text-white px-3 py-2 rounded text-sm font-bold"><i class="fas fa-trash mr-1"></i> Clear JSON</button>
          </div>
          <textarea id="nq" class="w-full h-40 p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl font-mono text-xs auto-resize box-border" placeholder='Paste JSON Question Array here...' oninput="autoResizeTextarea(this)"></textarea>
        </div>

        ${isLive ? `
        <div class="flex flex-col sm:flex-row gap-2 mt-6">
          <button onclick="Teacher.createExam(false)" class="flex-1 bg-gray-800 dark:bg-gray-700 text-white py-4 rounded-xl font-bold shadow hover:bg-gray-900 dark:hover:bg-black transition">Publish Now</button>
          <button onclick="Teacher.createExam(true)" class="flex-1 bg-amber-500 text-white py-4 rounded-xl font-bold shadow hover:bg-amber-600 transition">Save to Library (Draft)</button>
        </div>` : `
        <button onclick="Teacher.createExam(false)" class="w-full bg-gray-800 dark:bg-gray-700 text-white py-4 rounded-xl font-bold shadow hover:bg-gray-900 dark:hover:bg-black transition mt-6">Publish Practice</button>`}
      </div>
    </div>`;
}

/**
 * Create View function - renders the exam creation page
 */
export function createView() {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  
  // Get the exam type from the URL or default to 'live'
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'live';
  
  appContainer.innerHTML = renderCreateForm(type);
  
  // 🔥 ম্যাথ হেল্পার ম্যানুয়ালি সেটআপ
  setTimeout(() => {
    setupMathHelper();
  }, 100);
  
  // Load subjects for the selected type
  const folderStructure = window.folderStructure || { live: [], mock: [] };
  const subjects = folderStructure[type] || [];
  const subjectSelect = document.getElementById('nsub');
  if (subjectSelect) {
    subjectSelect.innerHTML = `<option value="">Select Subject (Optional)</option>` +
      subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  }
}

// 🔥 ম্যাথ হেল্পার সেটআপ ফাংশন
function setupMathHelper() {
  // ফ্লোটিং বাটন তৈরি করুন যদি না থাকে
  let floatingBtn = document.getElementById('floating-math-btn');
  if (!floatingBtn) {
    floatingBtn = document.createElement('button');
    floatingBtn.id = 'floating-math-btn';
    floatingBtn.className = 'floating-math-btn';
    floatingBtn.innerHTML = '<i class="fas fa-superscript"></i>';
    document.body.appendChild(floatingBtn);
  }
  floatingBtn.classList.remove('hidden');

  // ম্যাথ প্যানেল তৈরি করুন যদি না থাকে
  let mathPanel = document.getElementById('math-symbols-panel');
  if (!mathPanel) {
    mathPanel = document.createElement('div');
    mathPanel.id = 'math-symbols-panel';
    mathPanel.className = 'math-symbols-panel';
    mathPanel.innerHTML = `
      <div class="grid grid-cols-4 gap-2 p-2">
        <button class="symbol-btn" data-symbol="\\frac{}{}">\frac{}{}</button>
        <button class="symbol-btn" data-symbol="\\sqrt{}">\sqrt{}</button>
        <button class="symbol-btn" data-symbol="\\sum">\sum</button>
        <button class="symbol-btn" data-symbol="\\int">\int</button>
        <button class="symbol-btn" data-symbol="\\alpha">\alpha</button>
        <button class="symbol-btn" data-symbol="\\beta">\beta</button>
        <button class="symbol-btn" data-symbol="\\gamma">\gamma</button>
        <button class="symbol-btn" data-symbol="\\theta">\theta</button>
        <button class="symbol-btn" data-symbol="\\pi">\pi</button>
        <button class="symbol-btn" data-symbol="\\infty">\infty</button>
        <button class="symbol-btn" data-symbol="\\pm">\pm</button>
        <button class="symbol-btn" data-symbol="\\times">\times</button>
        <button class="symbol-btn" data-symbol="\\div">\div</button>
        <button class="symbol-btn" data-symbol="\\approx">\approx</button>
        <button class="symbol-btn" data-symbol="\\propto">\propto</button>
        <button class="symbol-btn" data-symbol="\\le">\le</button>
      </div>
    `;
    document.body.appendChild(mathPanel);
  }

  // বাটন ক্লিক ইভেন্ট
  floatingBtn.onclick = function(e) {
    e.stopPropagation();
    mathPanel.classList.toggle('show');
    if (mathPanel.classList.contains('show')) {
      mathPanel.classList.add('fixed-position');
    } else {
      mathPanel.classList.remove('fixed-position');
    }
  };

  // সিম্বল বাটন ইভেন্ট
  mathPanel.querySelectorAll('.symbol-btn').forEach(btn => {
    btn.onclick = function() {
      const symbol = this.dataset.symbol;
      insertMathSymbol(symbol);
      mathPanel.classList.remove('show');
      mathPanel.classList.remove('fixed-position');
    };
  });

  // প্রিভিউ বাটন ইভেন্ট (event delegation)
  document.querySelectorAll('.math-preview-btn').forEach(btn => {
    btn.onclick = function() {
      const textareaId = this.dataset.target;
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
        this.innerHTML = '<i class="fas fa-code"></i>';
        updateMathOverlay(textareaId);
      } else {
        overlay.style.display = 'none';
        textarea.classList.remove('math-mode');
        this.innerHTML = '<i class="fas fa-eye"></i>';
      }
    };
  });

  // ইনপুট ইভেন্ট - অটো-আপডেট প্রিভিউ
  document.querySelectorAll('textarea.question-textarea, textarea.option-textarea, textarea.explanation-textarea').forEach(textarea => {
    textarea.oninput = function() {
      const overlayId = 'overlay-' + this.id;
      const overlay = document.getElementById(overlayId);
      if (overlay && overlay.style.display !== 'none') {
        updateMathOverlay(this.id);
      }
    };
  });

  console.log('✅ Math Helper setup complete');
}

// 🔥 ম্যাথ সিম্বল ইনসার্ট ফাংশন
function insertMathSymbol(symbol) {
  const textareas = document.querySelectorAll('textarea.question-textarea, textarea.option-textarea, textarea.explanation-textarea');
  let activeTextarea = null;
  
  // ফোকাস করা টেক্সটএরিয়া খুঁজুন
  for (const ta of textareas) {
    if (ta === document.activeElement) {
      activeTextarea = ta;
      break;
    }
  }
  
  if (!activeTextarea && textareas.length > 0) {
    activeTextarea = textareas[0];
  }
  
  if (!activeTextarea) return;
  
  const start = activeTextarea.selectionStart;
  const end = activeTextarea.selectionEnd;
  const text = activeTextarea.value;
  const before = text.substring(0, start);
  const after = text.substring(end);
  
  let cursorPos = before.length + symbol.length;
  if (symbol.includes('{}')) {
    cursorPos = before.length + symbol.indexOf('{}') + 1;
  }
  
  activeTextarea.value = before + symbol + after;
  activeTextarea.selectionStart = cursorPos;
  activeTextarea.selectionEnd = cursorPos;
  activeTextarea.dispatchEvent(new Event('input'));
  activeTextarea.focus();
  
  const overlayId = 'overlay-' + activeTextarea.id;
  const overlay = document.getElementById(overlayId);
  if (overlay && overlay.style.display !== 'none') {
    updateMathOverlay(activeTextarea.id);
  }
}

// 🔥 ম্যাথ ওভারলে আপডেট ফাংশন
function updateMathOverlay(textareaId) {
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

// Attach to Teacher object
window.Teacher.createView = createView;
window.autoResizeTextarea = function(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};
