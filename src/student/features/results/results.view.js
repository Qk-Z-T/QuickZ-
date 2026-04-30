// src/student/features/results/results.view.js
// Results page UI: result cards, detailed result view with filter buttons

import { MathHelper } from '../../../shared/utils/math-helper.js';
import { StarRating } from '../../core/state.js';

export function renderResultCard(item) {
  const { attempt, exam } = item;
  const score = parseFloat(attempt.score).toFixed(2);
  const isMock = exam.type === 'mock' || attempt.isPractice;
  return `
    <div class="bg-white dark:bg-gray-800 p-4 mb-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold text-sm dark:text-white">${attempt.examTitle}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${moment(attempt.submittedAt?.toDate()).format('DD MMM, h:mm A')}</div>
          <div class="text-[10px] mt-1">
            <span class="px-2 py-1 rounded ${isMock ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'}">
              ${isMock ? 'মক' : 'লাইভ'}
            </span>
            <span class="ml-1 text-gray-500 dark:text-gray-400">${exam.subject || ''}</span>
          </div>
        </div>
        <div class="text-xl font-bold dark:text-white">${score}</div>
      </div>
      <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button onclick="ResultsManager.viewDetailedResult('${attempt.id}')" class="w-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-2 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-800">
          ফলাফল দেখুন
        </button>
      </div>
    </div>`;
}

export function renderResultTypeTabs(activeType, liveCount, mockCount) {
  return `
    <div class="flex justify-center gap-6 mb-4">
      <button onclick="ResultsManager.setResultType('live')" class="text-sm font-bold pb-1 ${activeType === 'live' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}">লাইভ (${liveCount})</button>
      <button onclick="ResultsManager.setResultType('mock')" class="text-sm font-bold pb-1 ${activeType === 'mock' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}">মক (${mockCount})</button>
    </div>`;
}

export function renderSubjectFilter(subjects, activeSubject) {
  return `
    <div class="flex gap-2 mb-4 overflow-x-auto justify-center">
      <button onclick="ResultsManager.setSubjectFilter('all')" class="px-3 py-1 rounded-full text-xs font-bold ${activeSubject === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">সব</button>
      ${subjects.map(s => `<button onclick="ResultsManager.setSubjectFilter('${s}')" class="px-3 py-1 rounded-full text-xs font-bold ${activeSubject === s ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">${s}</button>`).join('')}
    </div>`;
}

export function renderDetailedResultHeader(attempt, exam, accuracy, correct, wrong, skipped, timeStr, totalQ) {
  return `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 mb-4">
      <div class="flex justify-between items-start">
        <div>
          <div class="font-bold text-lg dark:text-white">${exam.title}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${moment(attempt.submittedAt?.toDate()).format('lll')}</div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">${parseFloat(attempt.score).toFixed(2)}</div>
          <div class="text-xs text-green-600 dark:text-green-400 font-bold">${accuracy.toFixed(1)}% নির্ভুলতা</div>
        </div>
      </div>
      <div class="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold text-sm dark:text-white">${totalQ}</div><div class="text-[10px] text-gray-500 dark:text-gray-400">মোট</div></div>
        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold text-sm text-emerald-600">${correct}</div><div class="text-[10px] text-gray-500 dark:text-gray-400">সঠিক</div></div>
        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold text-sm text-red-500">${wrong}</div><div class="text-[10px] text-gray-500 dark:text-gray-400">ভুল</div></div>
        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold text-sm dark:text-white">${skipped}</div><div class="text-[10px] text-gray-500 dark:text-gray-400">স্কিপ</div></div>
        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold text-sm dark:text-white">${timeStr}</div><div class="text-[10px] text-gray-500 dark:text-gray-400">সময়</div></div>
        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">${StarRating(accuracy)}</div>
      </div>
    </div>`;
}

export function renderFilterButtons(activeFilter, totalQ, correct, wrong, skipped) {
  return `
    <div class="flex gap-2 mb-4 overflow-x-auto justify-center">
      <button onclick="ResultsManager.setFilter('all')" class="filter-btn ${activeFilter === 'all' ? 'active bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">সব</button>
      <button onclick="ResultsManager.setFilter('correct')" class="filter-btn correct ${activeFilter === 'correct' ? 'active bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">সঠিক (${correct})</button>
      <button onclick="ResultsManager.setFilter('wrong')" class="filter-btn wrong ${activeFilter === 'wrong' ? 'active bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">ভুল (${wrong})</button>
      <button onclick="ResultsManager.setFilter('skipped')" class="filter-btn skipped ${activeFilter === 'skipped' ? 'active bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">স্কিপ (${skipped})</button>
    </div>`;
}

export function renderQuestionForResult(q, originalIndex, userAnswer, correctAnswer, st) {
  const qText = MathHelper.renderExamContent(q.q);
  const badge = st === 'correct' 
    ? '<span class="text-emerald-600 font-bold text-xs">সঠিক</span>' 
    : st === 'skipped' 
    ? '<span class="text-amber-600 font-bold text-xs">স্কিপ</span>' 
    : '<span class="text-red-600 font-bold text-xs">ভুল</span>';
  return `
    <div class="ans-card ${st} p-4 rounded-xl mb-4 bg-white dark:bg-gray-800 shadow-sm border">
      <div class="flex justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
        <span class="font-bold text-sm dark:text-white">প্রশ্ন ${originalIndex+1}</span>
        ${badge}
      </div>
      <p class="text-sm font-semibold mb-3 dark:text-white">${qText}</p>
      <div class="space-y-1">
        ${q.options.map((opt, oi) => {
          const optText = MathHelper.renderExamContent(opt);
          let cls = 'opt-res bg-white dark:bg-gray-700 dark:text-gray-300';
          let icon = '';
          if (oi === correctAnswer) { cls = 'opt-res right bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700'; icon = '<i class="fas fa-check float-right text-emerald-600 dark:text-emerald-400"></i>'; }
          else if (oi === userAnswer && userAnswer !== correctAnswer) { cls = 'opt-res wrong-select bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'; icon = '<i class="fas fa-times float-right text-red-600 dark:text-red-400"></i>'; }
          return `<div class="${cls}"><span>${String.fromCharCode(65+oi)}. ${optText}</span> ${icon}</div>`;
        }).join('')}
      </div>
      ${q.expl ? `<div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs">${MathHelper.renderExamContent(q.expl)}</div>` : ''}
    </div>`;
}
