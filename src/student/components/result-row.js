// src/student/components/result-row.js
// Reusable result row component for results listing

export function renderResultListItem(item) {
  const { attempt, exam } = item;
  const scoreDisplay = parseFloat(attempt.score).toFixed(2);

  return `
    <div class="bg-white dark:bg-gray-800 p-4 mb-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold text-sm dark:text-white">${attempt.examTitle}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ${attempt.submittedAt ? moment(attempt.submittedAt.toDate()).format('DD MMM, h:mm A') : ''}
          </div>
          <div class="text-[10px] mt-1">
            <span class="px-2 py-1 rounded ${attempt.isPractice ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'}">
              ${attempt.isPractice ? 'মক' : 'লাইভ'}
            </span>
            <span class="ml-1 text-gray-500 dark:text-gray-400">${exam.subject || ''}</span>
          </div>
        </div>
        <div class="text-xl font-bold dark:text-white font-en">${scoreDisplay}</div>
      </div>
      <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button onclick="ResultsManager.viewDetailedResult('${attempt.id}')" class="w-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-2 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-800">
          ফলাফল দেখুন
        </button>
      </div>
    </div>`;
}

export function renderResultFilters(subjectList, activeSubject) {
  let html = `<button class="px-3 py-1 rounded-full text-xs font-bold ${activeSubject === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}" onclick="ResultsManager.setSubjectFilter('all')">সব</button>`;
  subjectList.forEach(sub => {
    html += `<button class="px-3 py-1 rounded-full text-xs font-bold ${activeSubject === sub ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}" onclick="ResultsManager.setSubjectFilter('${sub}')">${sub}</button>`;
  });
  return `<div class="flex gap-2 mb-4 overflow-x-auto justify-center">${html}</div>`;
}

export function renderResultTypeTabs(activeType, liveCount, mockCount) {
  return `
    <div class="flex justify-center gap-6 mb-4">
      <button onclick="ResultsManager.setResultType('live')" class="text-sm font-bold pb-1 ${activeType === 'live' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}">লাইভ (${liveCount})</button>
      <button onclick="ResultsManager.setResultType('mock')" class="text-sm font-bold pb-1 ${activeType === 'mock' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}">মক (${mockCount})</button>
    </div>`;
}

export function renderRankRow(attempt, index, studentInfo, uid) {
  const isMe = attempt.userId === uid;
  const institution = studentInfo?.college || studentInfo?.school || '';
  const accuracy = attempt.accuracy || 0;
  let timeDisplay = 'N/A';
  if (attempt.timeTakenSeconds && attempt.timeTakenSeconds !== Infinity) {
    const mins = Math.floor(attempt.timeTakenSeconds / 60);
    const secs = attempt.timeTakenSeconds % 60;
    timeDisplay = `${mins}m ${secs}s`;
  }

  let rankBadge = `<span class="font-bold text-gray-500 dark:text-gray-400 text-lg">${index + 1}</span>`;
  let cardClass = 'p-3 border-b dark:border-gray-700 flex items-center bg-white dark:bg-gray-800';
  if (index === 0) { rankBadge = '<span class="text-2xl">🥇</span>'; cardClass += ' rank-1'; }
  else if (index === 1) { rankBadge = '<span class="text-2xl">🥈</span>'; cardClass += ' rank-2'; }
  else if (index === 2) { rankBadge = '<span class="text-2xl">🥉</span>'; cardClass += ' rank-3'; }
  if (isMe) cardClass += ' bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800';

  return `
    <div class="${cardClass}">
      <div class="w-10 text-center">${rankBadge}</div>
      <div class="flex-1 ml-3">
        <div class="font-bold text-sm dark:text-white">${attempt.userName} ${isMe ? '(You)' : ''}</div>
        <div class="text-[9px] text-gray-500 dark:text-gray-400">${institution}</div>
        <div class="text-[9px] text-gray-400 dark:text-gray-500"><i class="far fa-clock"></i> ${timeDisplay}</div>
        <div class="mt-1 flex items-center gap-1 text-yellow-400 text-xs">${renderStars(attempt.accuracy || 0)}</div>
      </div>
      <div class="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-3 py-1 rounded text-sm">${(attempt.score || 0).toFixed(2)}</div>
    </div>`;
}

function renderStars(percentage) {
  const full = Math.floor(percentage / 20);
  const half = (percentage % 20) >= 10 ? 1 : 0;
  const empty = 5 - full - half;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
  if (half) stars += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < empty; i++) stars += '<i class="far fa-star"></i>';
  return stars;
}
