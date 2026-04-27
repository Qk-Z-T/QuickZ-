// src/teacher/features/rankings/rankings.view.js
// UI rendering for detailed result and exam analysis (Teacher)

import { loadMathJax } from '../../../shared/utils/dom-helper.js';
import { MathHelper } from '../../../shared/utils/math-helper.js';

/**
 * Render the student's detailed result view (full answer script with filters).
 * Assumes window.currentResultPage, window.resultFilter, etc. are set by the caller.
 */
export function renderUserResultDetail(
  exam,
  attempt,
  questions,
  userRank,
  totalParticipants,
  highestScore
) {
  const qs = questions;
  const userAnswers = attempt.answers || [];
  const totalQ = qs.length;

  const correct = qs.reduce(
    (acc, q, i) => acc + (userAnswers[i] === q.correct ? 1 : 0),
    0
  );
  const accuracy = totalQ > 0 ? ((correct / totalQ) * 100) : 0;
  const wrong = userAnswers.filter((a, i) => a !== null && a !== qs[i].correct).length;
  const skipped = userAnswers.filter(a => a === null).length;

  let timeStr = 'N/A';
  if (attempt.submittedAt && attempt.startedAt) {
    const diff = Math.floor(
      (attempt.submittedAt.toDate() - attempt.startedAt.toDate()) / 1000
    );
    const h = Math.floor(diff / 3600),
      m = Math.floor((diff % 3600) / 60),
      s = diff % 60;
    timeStr = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  window.currentResultPage = 1;
  window.resultFilter = 'all';
  window.filteredQuestions = [...qs];

  const renderQuestionsHTML = (subQuestions) => {
    let h = '';
    subQuestions.forEach((q) => {
      const idx = qs.indexOf(q);
      const u = userAnswers[idx];
      const corr = q.correct;
      const st = u === corr ? 'correct' : u === null ? 'skipped' : 'wrong';
      const badge =
        st === 'correct'
          ? '<span class="text-emerald-600 font-bold text-xs">Correct</span>'
          : st === 'skipped'
          ? '<span class="text-amber-600 font-bold text-xs">Skipped</span>'
          : '<span class="text-red-600 font-bold text-xs">Wrong</span>';

      const qText = MathHelper.renderExamContent(q.q);

      h += `<div class="ans-card ${st} p-4 rounded-xl mb-4 bg-white dark:bg-gray-800 shadow-sm border">
        <div class="flex justify-between mb-2 pb-2 border-b border-black/5 dark:border-gray-700">
          <span class="font-bold text-sm text-gray-700 dark:text-white">Question ${idx + 1}</span>
          ${badge}
        </div>
        <p class="text-sm font-semibold mb-3 text-gray-800 dark:text-white">${qText}</p>
        <div class="space-y-1">
          ${q.options
            .map((opt, oi) => {
              const optText = MathHelper.renderExamContent(opt);
              let cls = 'opt-res bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400';
              let icon = '';
              if (oi === corr) {
                cls = 'opt-res right bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700';
                icon = '<i class="fas fa-check float-right mt-1 text-emerald-600 dark:text-emerald-400"></i>';
              } else if (oi === u && u !== corr) {
                cls = 'opt-res wrong-select bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700';
                icon = '<i class="fas fa-times float-right mt-1 text-red-600 dark:text-red-400"></i>';
              }
              return `<div class="${cls}"><span>${String.fromCharCode(65 + oi)}. ${optText}</span> ${icon}</div>`;
            })
            .join('')}
        </div>
        <div class="mt-3 text-xs bg-white/60 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-700">
          <span class="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Explanation:</span>
          ${q.expl ? `<span>${MathHelper.renderExamContent(q.expl)}</span>` : '<span>No explanation provided.</span>'}
        </div>
      </div>`;
    });
    return h;
  };

  const updateView = () => {
    const perPage = 25;
    const start = (window.currentResultPage - 1) * perPage;
    const currentQs = window.filteredQuestions.slice(start, start + perPage);
    const totalPages = Math.ceil(window.filteredQuestions.length / perPage);

    const filterButtons = `
      <div class="flex gap-2 mb-4 flex-wrap">
        <button onclick="Teacher.setResultFilter('all')" class="filter-btn ${window.resultFilter === 'all' ? 'active bg-indigo-600 text-white' : ''}">All (${totalQ})</button>
        <button onclick="Teacher.setResultFilter('correct')" class="filter-btn correct ${window.resultFilter === 'correct' ? 'active' : ''}">Correct (${correct})</button>
        <button onclick="Teacher.setResultFilter('wrong')" class="filter-btn wrong ${window.resultFilter === 'wrong' ? 'active' : ''}">Wrong (${wrong})</button>
        <button onclick="Teacher.setResultFilter('skipped')" class="filter-btn skipped ${window.resultFilter === 'skipped' ? 'active' : ''}">Skipped (${skipped})</button>
      </div>`;

    const pagination =
      totalPages > 1
        ? `
      <div class="flex justify-center items-center gap-4 mt-4">
        <button onclick="Teacher.prevResultPage()" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded ${window.currentResultPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${window.currentResultPage === 1 ? 'disabled' : ''}>Previous</button>
        <span class="text-xs">Page ${window.currentResultPage} of ${totalPages}</span>
        <button onclick="Teacher.nextResultPage()" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded ${window.currentResultPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" ${window.currentResultPage === totalPages ? 'disabled' : ''}>Next</button>
      </div>`
        : '';

    const summaryHeader = `
      <div class="compact-summary-card">
        <div class="compact-header">
          <div class="flex-1">
            <div class="compact-title">${attempt.userName}</div>
            <div class="compact-date">${exam.title}</div>
          </div>
          <div class="compact-score-section">
            <div class="compact-score">${parseFloat(attempt.score).toFixed(2)}</div>
            <div class="compact-accuracy">${accuracy.toFixed(1)}% Acc.</div>
          </div>
        </div>
        <div class="compact-grid">
          <div class="compact-stat-item"><div class="compact-stat-value">${totalQ}</div><div class="compact-stat-label">Total</div></div>
          <div class="compact-stat-item"><div class="compact-stat-value text-emerald-600">${correct}</div><div class="compact-stat-label">Correct</div></div>
          <div class="compact-stat-item"><div class="compact-stat-value text-red-500">${wrong}</div><div class="compact-stat-label">Wrong</div></div>
          <div class="compact-stat-item"><div class="compact-stat-value">${skipped}</div><div class="compact-stat-label">Skip</div></div>
          <div class="compact-stat-item border-2 border-indigo-100"><div class="compact-stat-value text-indigo-600">${userRank}</div><div class="compact-stat-label">Rank</div></div>
          <div class="compact-stat-item"><div class="compact-stat-value">${timeStr}</div><div class="compact-stat-label">Time</div></div>
          <div class="compact-stat-item"><div class="compact-stat-value">${totalParticipants}</div><div class="compact-stat-label">Total Students</div></div>
          <div class="compact-stat-item"><div class="compact-stat-value">${highestScore.toFixed(2)}</div><div class="compact-stat-label">Highest</div></div>
        </div>
      </div>`;

    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="pb-6">
          <button onclick="Teacher.rankView()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> Back to Rankings</button>
          <h2 class="font-bold text-xl mb-4 dark:text-white">User Result Analysis</h2>
          ${summaryHeader}
          ${filterButtons}
          ${renderQuestionsHTML(currentQs) || '<div class="text-center p-10 text-gray-400">No questions match the filter</div>'}
          ${pagination}
        </div>`;
      loadMathJax(null, appContainer);
    }
  };

  // Attach filter/pagination handlers to Teacher if not already present
  if (!Teacher.setResultFilter) {
    Teacher.setResultFilter = (f) => {
      window.resultFilter = f;
      window.currentResultPage = 1;
      const answers = attempt.answers;
      if (f === 'all') {
        window.filteredQuestions = [...qs];
      } else {
        window.filteredQuestions = qs.filter((q, i) => {
          const u = answers[i];
          const corr = q.correct;
          const st = u === corr ? 'correct' : u === null ? 'skipped' : 'wrong';
          return st === f;
        });
      }
      updateView();
    };

    Teacher.prevResultPage = () => {
      if (window.currentResultPage > 1) {
        window.currentResultPage--;
        updateView();
      }
    };

    Teacher.nextResultPage = () => {
      if (window.currentResultPage < Math.ceil(window.filteredQuestions.length / 25)) {
        window.currentResultPage++;
        updateView();
      }
    };
  }

  updateView();
}

/**
 * Render teacher's exam analysis (question-wise statistics).
 */
export function renderExamAnalysis(examData, questions, attempts) {
  const totalAttempts = attempts.length;
  const questionStats = questions.map((q, idx) => {
    const optionCounts = new Array(q.options.length).fill(0);
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    attempts.forEach(att => {
      const answer = att.answers[idx];
      if (answer === null || answer === undefined) {
        skippedCount++;
      } else if (answer >= 0 && answer < q.options.length) {
        optionCounts[answer]++;
        if (answer === q.correct) correctCount++;
        else wrongCount++;
      } else {
        skippedCount++;
      }
    });

    const optionPercentages = optionCounts.map(
      count => (totalAttempts > 0 ? (count / totalAttempts) * 100 : 0)
    );
    return {
      ...q,
      optionCounts,
      optionPercentages,
      correctCount,
      wrongCount,
      skippedCount,
      totalAttempts
    };
  });

  let html = `
    <div class="p-5 pb-20">
      <button onclick="Teacher.rankView()" class="mb-4 text-xs font-bold text-gray-500 dark:text-gray-400">
        <i class="fas fa-arrow-left"></i> Back to Rankings
      </button>
      <h2 class="text-xl font-bold mb-4 text-center dark:text-white">${examData.title} - Detailed Analysis</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Total Participants: ${totalAttempts}</p>`;

  questionStats.forEach((q, i) => {
    const qText = MathHelper.renderExamContent(q.q);
    const correctOpt = String.fromCharCode(65 + q.correct);

    let optionsHtml = '';
    q.options.forEach((opt, oi) => {
      const optText = MathHelper.renderExamContent(opt);
      const percent = q.optionPercentages[oi].toFixed(1);
      const count = q.optionCounts[oi];
      const isCorrect = oi === q.correct;
      optionsHtml += `
        <div class="opt-res ${isCorrect ? 'right' : ''}">
          <div class="option-math flex-1">
            <span>${String.fromCharCode(65 + oi)}.</span>
            <span>${optText}</span>
          </div>
          <div class="text-xs font-bold ${isCorrect ? 'text-green-600' : 'text-gray-500'}">
            ${percent}% (${count})
          </div>
        </div>`;
    });

    const correctPercent = totalAttempts > 0 ? ((q.correctCount / totalAttempts) * 100) : 0;
    const wrongPercent = totalAttempts > 0 ? ((q.wrongCount / totalAttempts) * 100) : 0;
    const skippedPercent = totalAttempts > 0 ? ((q.skippedCount / totalAttempts) * 100) : 0;

    html += `
      <div class="p-4 rounded-xl shadow-sm border mb-6 bg-white dark:bg-gray-800">
        <div class="flex justify-between mb-2">
          <span class="font-bold">Question ${i + 1}</span>
          <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Correct Answer: ${correctOpt}</span>
        </div>
        <p class="font-semibold mb-3 math-render">${qText}</p>
        <div class="space-y-1 mb-4">${optionsHtml}</div>
        ${q.expl ? `<div class="text-xs p-3 rounded mb-3 explanation-box"><b>Explanation:</b> ${MathHelper.renderExamContent(q.expl)}</div>` : ''}
        <div class="mt-3">
          <div class="flex items-center gap-2 text-xs mb-2">
            <span class="w-16">Correct ${q.correctCount}</span>
            <span class="w-16 text-right">Wrong ${q.wrongCount}</span>
            <span class="w-16 text-right">Skipped ${q.skippedCount}</span>
          </div>
          <div class="h-6 bg-gray-200 rounded-full overflow-hidden flex text-white text-[10px] font-bold">
            <div class="bg-green-500 h-full flex items-center justify-center" style="width: ${correctPercent}%">${correctPercent.toFixed(1)}%</div>
            <div class="bg-red-500 h-full flex items-center justify-center" style="width: ${wrongPercent}%">${wrongPercent.toFixed(1)}%</div>
            <div class="bg-yellow-500 h-full flex items-center justify-center" style="width: ${skippedPercent}%">${skippedPercent.toFixed(1)}%</div>
          </div>
        </div>
      </div>`;
  });

  html += `</div>`;

  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.innerHTML = html;
    loadMathJax(null, appContainer);
  }
}
