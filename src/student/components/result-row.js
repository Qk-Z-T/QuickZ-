// src/student/components/result-row.js
// Reusable result row component – now shows institution & time

export function renderRankRow(att, index, studentInfo, uid, institution = '', timeTaken = '') {
  const isMe = att.userId === uid;

  let rankBadge = `<span class="font-bold text-gray-500 dark:text-gray-400 text-lg">${index + 1}</span>`;
  let cardClass = 'p-3 border-b dark:border-gray-700 flex items-center bg-white dark:bg-gray-800';
  if (index === 0) { rankBadge = '<span class="text-2xl">🥇</span>'; cardClass += ' rank-1'; }
  else if (index === 1) { rankBadge = '<span class="text-2xl">🥈</span>'; cardClass += ' rank-2'; }
  else if (index === 2) { rankBadge = '<span class="text-2xl">🥉</span>'; cardClass += ' rank-3'; }
  if (isMe) cardClass += ' bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800';

  const institutionLine = institution ? `<div class="text-[9px] text-gray-500 dark:text-gray-400">${institution}</div>` : '';
  const timeLine = timeTaken ? `<div class="text-[9px] text-gray-400 dark:text-gray-500"><i class="far fa-clock"></i> ${timeTaken}</div>` : '';

  return `
    <div class="${cardClass}">
      <div class="w-10 text-center">${rankBadge}</div>
      <div class="flex-1 ml-3">
        <div class="font-bold text-sm dark:text-white">${att.userName} ${isMe ? '(You)' : ''}</div>
        ${institutionLine}
        ${timeLine}
        <div class="mt-1 flex items-center gap-1 text-yellow-400 text-xs">${renderStars(att.accuracy || 0)}</div>
      </div>
      <div class="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-3 py-1 rounded text-sm">${(att.score || 0).toFixed(2)}</div>
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

// For top-3 special cards
export function renderTopThreeCard(att, rank, institution, timeTaken, uid) {
  const isMe = att.userId === uid;
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['gold', 'silver', '#cd7f32'];
  const bgColors = ['bg-yellow-50 dark:bg-yellow-900/20', 'bg-gray-50 dark:bg-gray-800', 'bg-orange-50 dark:bg-orange-900/20'];
  const borderColors = ['border-yellow-300 dark:border-yellow-600', 'border-gray-300 dark:border-gray-600', 'border-orange-300 dark:border-orange-600'];

  const institutionLine = institution ? `<div class="text-xs text-gray-600 dark:text-gray-400 mt-1">${institution}</div>` : '';
  const timeLine = timeTaken ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1"><i class="far fa-clock"></i> ${timeTaken}</div>` : '';
  const meBadge = isMe ? '<span class="text-xs bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full ml-2">You</span>' : '';

  return `
    <div class="p-5 rounded-2xl border-2 ${bgColors[rank]} ${borderColors[rank]} transform hover:scale-[1.02] transition-all shadow-lg">
      <div class="text-center mb-2">
        <span class="text-5xl">${medals[rank]}</span>
      </div>
      <div class="text-center">
        <h3 class="text-2xl font-black dark:text-white flex items-center justify-center gap-2">${att.userName}${meBadge}</h3>
        ${institutionLine}
        ${timeLine}
        <div class="mt-3 flex justify-center items-center gap-2 text-yellow-400 text-xl">${renderStars(att.accuracy || 0)}</div>
        <div class="mt-2 text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">${att.score.toFixed(2)}</div>
      </div>
    </div>`;
}
