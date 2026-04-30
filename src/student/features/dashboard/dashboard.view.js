// src/student/features/dashboard/dashboard.view.js
// Student dashboard UI sections

export function renderDashboardSkeleton() {
  return `
    <div class="p-5 pb-20 max-w-lg mx-auto">
      <div id="active-course-card" class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 overflow-hidden mb-6">
        <div class="p-5">
          <div class="flex items-center gap-3 animate-pulse">
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-6">
        <div class="h-40 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse"></div>
        <div class="h-40 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse"></div>
      </div>
    </div>`;
}

export function renderActiveCourseCard(group) {
  const classBadge = group.classLevel
    ? `<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">${group.classLevel === 'Admission' ? 'এডমিশন' : group.classLevel}</span>`
    : '';
  const streamBadge = group.admissionStream
    ? `<span class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full ml-1">${group.admissionStream}</span>`
    : '';
  const imageHtml = group.imageUrl
    ? `<img src="${group.imageUrl}" class="w-full h-36 object-cover rounded-t-2xl">`
    : `<div class="w-full h-36 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-3xl text-indigo-400 rounded-t-2xl"><i class="fas fa-book-open"></i></div>`;

  return `
    ${imageHtml}
    <div class="p-5">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="text-xl font-bold dark:text-white bengali-text">${group.name}</h3>
          <div class="flex items-center gap-2 mt-1">${classBadge}${streamBadge}</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400">${group.studentIds?.length || 0}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">শিক্ষার্থী</div>
        </div>
      </div>
      <p class="text-xs text-gray-500 mb-1"><i class="fas fa-user-tie"></i> ${group.teacherName || 'শিক্ষক'}</p>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">${group.description || 'কোনো বিবরণ নেই'}</p>
      <div class="flex gap-2">
        <button onclick="StudentDashboard.showGroupMembersModal('${AppState.activeGroupId}')" class="flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 py-2 rounded-lg text-xs font-bold">
          <i class="fas fa-users mr-1"></i>সদস্য দেখুন
        </button>
        <button onclick="Router.student('courses')" class="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 py-2 rounded-lg text-xs font-bold">
          <i class="fas fa-plus mr-1"></i>নতুন কোর্স
        </button>
      </div>
    </div>`;
}

export function renderNoCourseCard() {
  return `
    <div class="p-5 text-center">
      <i class="fas fa-info-circle text-3xl text-gray-400 dark:text-gray-500 mb-3"></i>
      <h4 class="font-bold dark:text-white mb-2">কোনো সক্রিয় কোর্স নেই</h4>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">পরীক্ষা দিতে ও র‍্যাংক দেখতে একটি কোর্সে জয়েন করুন</p>
      <button onclick="Router.student('courses')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">কোর্স খুঁজুন</button>
    </div>`;
}
