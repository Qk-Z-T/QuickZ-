// src/student/components/exam-card.js
// Reusable exam card components for live, mock, and past exams

export function renderLiveExamCard(exam, status, userAttempt = null) {
  const startTime = exam.startTime ? moment(exam.startTime).format('DD MMM, h:mm A') : '';
  const endTime = exam.endTime ? moment(exam.endTime).format('h:mm A') : '';
  const examDate = exam.startTime ? moment(exam.startTime).format('DD MMM YYYY') : '';
  const isSubmitted = userAttempt?.submittedAt;
  const totalAttempts = exam.totalAttempts || 0;
  const runningCount = exam.runningCount || 0;

  let buttonHTML = '';
  let statusBadge = '';
  let liveIndicator = '';

  if (status === 'ongoing') {
    statusBadge = '<span class="inline-block bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-bold px-2 py-1 rounded">চলমান</span>';
    liveIndicator = '<div class="live-indicator animate-pulse-red w-3 h-3 bg-red-500 rounded-full mr-2"></div>';
    if (isSubmitted) {
      buttonHTML = `<button class="w-full bg-gray-400 text-white py-2 rounded-lg text-sm font-bold cursor-not-allowed" disabled><i class="fas fa-check-circle mr-2"></i> জমা দেওয়া হয়েছে</button>`;
    } else {
      buttonHTML = `
        <div class="flex gap-2 mt-3">
          <button onclick="Exam.start('${exam.id}')" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-bold">
            <i class="fas fa-play-circle mr-2"></i> ${userAttempt ? 'আবার শুরু করুন' : 'যোগ দিন'}
          </button>
          <button onclick="StudentDashboard.loadLiveExams()" class="px-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>`;
    }
  } else if (status === 'upcoming') {
    statusBadge = '<span class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded">আসন্ন</span>';
    liveIndicator = '<div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>';
    buttonHTML = `<button class="w-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 py-2 rounded-lg text-sm font-bold cursor-not-allowed" disabled><i class="far fa-clock mr-2"></i> শুরু হবে ${startTime}</button>`;
  }

  return `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 mb-3">
      <div class="flex justify-between items-start mb-1">
        <div class="flex items-center gap-2">${liveIndicator}${statusBadge}</div>
        ${userAttempt && !isSubmitted ? '<span class="text-xs font-bold bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">অংশগ্রহণ করেছেন</span>' : ''}
      </div>
      <h3 class="font-bold text-lg dark:text-white mt-1">${exam.title}</h3>
      ${exam.subject ? `<p class="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">${exam.subject} ${exam.chapter ? '• ' + exam.chapter : ''}</p>` : ''}
      <div class="text-xs text-gray-500 dark:text-gray-400 mb-2 mt-1 flex gap-2 flex-wrap">
        <span><i class="fas fa-star text-amber-400"></i> ${exam.totalMarks} মার্ক</span>
        <span><i class="far fa-clock"></i> ${exam.duration}মি</span>
        <span><i class="far fa-calendar-alt"></i> ${examDate}</span>
      </div>
      ${status === 'ongoing' ? `
      <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg mb-2 text-xs text-gray-600 dark:text-gray-300">
        <div><i class="fas fa-users mr-1"></i> মোট অংশগ্রহণ: ${totalAttempts}</div>
        <div><i class="fas fa-user-check mr-1"></i> এখন পরীক্ষায়: ${runningCount}</div>
      </div>` : ''}
      ${buttonHTML}
    </div>`;
}

export function renderPastExamCard(exam, isAttended) {
  const examDate = exam.createdAt?.toDate ? moment(exam.createdAt.toDate()).format('DD MMM, YYYY') : '';
  const subject = exam.subject?.trim() || 'Uncategorized';
  return `
    <div class="bg-white dark:bg-gray-800 p-3 rounded-xl border dark:border-gray-700 mb-2">
      <div class="flex justify-between items-start mb-1">
        <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">শেষ</span>
        ${isAttended 
          ? '<span class="text-xs font-bold bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">অংশগ্রহণ করেছেন</span>' 
          : '<span class="text-xs font-bold bg-amber-50 dark:bg-amber-900 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">অনুপস্থিত</span>'}
      </div>
      <h3 class="font-bold text-base dark:text-white">${exam.title}</h3>
      <div class="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">${subject} ${exam.chapter ? '• ' + exam.chapter : ''}</div>
      <div class="text-xs text-gray-500 dark:text-gray-400 mb-2 flex gap-2">
        <span><i class="fas fa-star text-amber-400"></i> ${exam.totalMarks} মার্ক</span>
        <span><i class="far fa-clock"></i> ${exam.duration}মি</span>
        <span><i class="far fa-calendar-alt"></i> ${examDate}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 mt-2">
        <button onclick="Exam.start('${exam.id}', true)" class="bg-blue-600 text-white py-1.5 rounded text-xs font-bold">পরীক্ষা দিন</button>
        <button onclick="StudentDashboard.viewExamSolutions('${exam.id}', 'live')" class="bg-emerald-500 text-white py-1.5 rounded text-xs font-bold">সমাধান</button>
      </div>
    </div>`;
}

export function renderMockExamCard(exam, hasAttempted) {
  return `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 mb-4">
      <h3 class="font-bold text-lg text-center dark:text-white">${exam.name}</h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
        <span>মার্ক: ${exam.examData?.totalMarks || 0}</span> 
        <span>সময়: ${exam.examData?.duration || 0}মি</span>
        ${!hasAttempted ? '<span class="text-amber-500"><i class="fas fa-exclamation-circle ml-1"></i> দেওয়া হয়নি</span>' : ''}
      </p>
      <div class="flex gap-2">
        <button onclick="Exam.start('${exam.id}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">অনুশীলন শুরু</button>
        <button onclick="${hasAttempted ? `StudentDashboard.viewExamSolutions('${exam.id}', 'mock')` : `Swal.fire('আগে পরীক্ষা দিন', 'কমপক্ষে একবার পরীক্ষা দিন উত্তর দেখতে', 'warning')`}" 
          class="flex-1 ${hasAttempted ? 'bg-emerald-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'} py-2 rounded-lg text-sm font-bold">
          ${hasAttempted ? 'উত্তর দেখুন' : 'আগে পরীক্ষা দিন'}
        </button>
      </div>
    </div>`;
}
