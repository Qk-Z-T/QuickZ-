// src/student/features/exam-taking/exam.view.js
// Exam UI rendering: question pages, pagination, header, review panel

import { loadMathJax } from '../../../shared/utils/dom-helper.js';
import { MathHelper } from '../../../shared/utils/math-helper.js';

export function renderExamApp(examData, currentPage, answeredCount, totalQuestions, isPractice) {
  const perPage = 25;
  const start = currentPage * perPage;
  const end = Math.min(start + perPage, examData.qs.length);
  
  let questionHTML = '';
  for (let i = start; i < end; i++) {
    const q = examData.qs[i];
    const qText = MathHelper.renderExamContent(q.q);
    const isAnswered = examData.answers[i] !== null;
    
    questionHTML += `
    <div class="p-4 rounded-xl shadow-sm border mb-4 bg-white dark:bg-gray-800" id="q-${i}">
      <div class="flex justify-between items-center mb-3">
        <span class="bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-sm rounded">${i+1}</span>
        <button id="mark-btn-${i}" onclick="Exam.toggleMark(${i})" class="text-xs font-bold ${examData.marked[i] ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}">
          <i class="${examData.marked[i] ? 'fas' : 'far'} fa-bookmark"></i> ${examData.marked[i] ? 'চিহ্নিত' : 'চিহ্নিত করুন'}
        </button>
      </div>
      <p class="font-bold mb-3 text-gray-800 dark:text-gray-200 text-left flex gap-2">
        <span class="flex-1 bengali-text">${qText}</span>
      </p>
      <div class="space-y-2">
        ${q.options.map((o, oi) => {
          const selected = examData.answers[i] === oi ? 'selected' : '';
          const locked = isAnswered ? 'locked' : '';
          const optText = MathHelper.renderExamContent(o);
          return `<button onclick="Exam.sel(${i},${oi})" class="opt-btn w-full text-left p-3 rounded-lg border text-sm flex gap-2 transition ${selected} ${locked}" ${isAnswered ? 'disabled' : ''}>
            <span class="font-bold opacity-50 w-6">${String.fromCharCode(65+oi)}.</span>
            <span class="flex-1 text-left bengali-text">${optText}</span>
            ${selected ? '<i class="fas fa-check text-indigo-600 ml-2"></i>' : ''}
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }

  const totalPages = Math.ceil(totalQuestions / perPage);
  const paginationHTML = totalPages > 1 ? `
    <div class="flex justify-center gap-2 mt-6">
      <button onclick="Exam.prevPage()" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === 0 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> পূর্ববর্তী
      </button>
      <span class="px-4 py-2 text-sm dark:text-white">পৃষ্ঠা ${currentPage + 1}/${totalPages}</span>
      <button onclick="Exam.nextPage()" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${currentPage === totalPages-1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === totalPages-1 ? 'disabled' : ''}>
        পরবর্তী <i class="fas fa-chevron-right"></i>
      </button>
    </div>` : '';

  const practiceIndicator = isPractice ? 
    '<span class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-2 py-1 rounded inline-block mb-1"><i class="fas fa-flask"></i> অনুশীলন</span>' : '';

  const headerHTML = `
  <div class="sticky top-0 border-b px-4 py-3 flex justify-between items-center z-30 shadow-md bg-white/95 dark:bg-gray-900/95">
    <div>
      ${practiceIndicator}
      <div class="text-center">
        <span class="font-bold block text-sm truncate w-32 mx-auto dark:text-white">${examData.title}</span>
        <div class="flex items-center justify-center gap-2 mt-1">
          <span id="tm" class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded dark:text-white">00:00</span>
          <span id="answered-counter" class="text-xs font-mono bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1 rounded">সম্পন্ন: ${answeredCount}/${totalQuestions}</span>
        </div>
      </div>
    </div>
    <button onclick="Exam.sub()" class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow hover:from-indigo-600 hover:to-indigo-700 transition">জমা দিন</button>
  </div>`;

  return `
    ${headerHTML}
    <div class="p-4 pb-20 min-h-screen select-none bg-gray-50 dark:bg-gray-900">
      ${questionHTML}
      ${paginationHTML}
    </div>`;
}

export function updateReviewPanel(answers, marked, currentPage, perPage = 25) {
  const panel = document.getElementById('question-numbers');
  if (!panel) return;
  panel.innerHTML = '';
  answers.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'question-number-btn';
    if (ans !== null) btn.classList.add('answered');
    const start = currentPage * perPage;
    const end = start + perPage;
    if (i >= start && i < end) btn.classList.add('current-view');
    btn.textContent = i + 1;
    btn.onclick = () => {
      const targetPage = Math.floor(i / perPage);
      if (targetPage !== currentPage) {
        Exam.currentPage = targetPage;
        Exam.render();
      }
      setTimeout(() => {
        const el = document.getElementById(`q-${i}`);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
          el.style.backgroundColor = 'rgba(79,70,229,0.1)';
          setTimeout(() => el.style.backgroundColor = '', 1000);
        }
      }, 50);
      document.getElementById('review-panel')?.classList.remove('show');
    };
    panel.appendChild(btn);
  });
}
