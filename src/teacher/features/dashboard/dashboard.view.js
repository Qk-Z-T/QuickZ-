// src/teacher/features/dashboard/dashboard.view.js
// Teacher Dashboard UI rendering

export function renderDashboardLoading() {
  return `
    <div class="pb-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold font-en text-gray-800 dark:text-white bengali-text">Dashboard Home</h2>
      </div>
      <div class="text-center p-10">
        <div class="quick-loader mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500 bengali-text">Loading...</p>
      </div>
    </div>`;
}

export function renderDashboard(groupData, stats, activeLiveExamHTML) {
  const classBadge = groupData?.classLevel ? 
    `<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">${groupData.classLevel === 'Admission' ? 'এডমিশন' : groupData.classLevel}</span>` : '';
  const streamBadge = groupData?.admissionStream ? 
    `<span class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full ml-1">${groupData.admissionStream}</span>` : '';
  const joinMethodText = { 'public': 'পাবলিক', 'code': 'কোর্স কোড', 'permission': 'পারমিশন কী' }[groupData?.joinMethod] || 'কোর্স কোড';
  const courseImageHtml = groupData?.imageUrl ? 
    `<img src="${groupData.imageUrl}" alt="${groupData.name}" class="w-full h-32 object-cover rounded-t-2xl">` : 
    `<div class="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-3xl text-indigo-400 rounded-t-2xl"><i class="fas fa-book-open"></i></div>`;

  return `
    <div class="pb-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold font-en text-gray-800 dark:text-white bengali-text">Dashboard Home</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 bengali-text mt-1">Overview of ${AppState.selectedGroup.name}</p>
        </div>
      </div>
      <div id="home-active-live-section">${activeLiveExamHTML || ''}</div>
      <div class="bg-white dark:bg-dark-secondary rounded-2xl border dark:border-dark-tertiary shadow-sm mb-6 overflow-hidden">
        ${courseImageHtml}
        <div class="p-5">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="text-xl font-bold dark:text-white bengali-text">${AppState.selectedGroup.name}</h3>
              <div class="flex items-center gap-2 mt-1">${classBadge} ${streamBadge}
                <span class="text-xs bg-gray-100 dark:bg-dark-tertiary text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">${joinMethodText}</span>
              </div>
            </div>
            <div class="text-right"><div class="text-2xl font-black text-indigo-600 dark:text-indigo-400">${stats.studentCount}</div><div class="text-xs text-gray-500 dark:text-gray-400">শিক্ষার্থী</div></div>
          </div>
          ${groupData?.description ? `<p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">${groupData.description}</p>` : '<p class="text-sm text-gray-400 italic mb-4">কোনো বিবরণ নেই</p>'}
          <div class="flex flex-wrap gap-3 mt-4">
            <button onclick="Teacher.viewGroupStudents('${AppState.selectedGroup.id}')" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-800 transition"><i class="fas fa-users mr-2"></i>শিক্ষার্থী দেখুন</button>
            <button onclick="Teacher.noticeManagementView()" class="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-100 dark:hover:bg-amber-800 transition"><i class="fas fa-bullhorn mr-2"></i>নোটিশ ও পোল</button>
            <button onclick="Teacher.quickEditJoinMethod('${AppState.selectedGroup.id}', '${groupData?.joinMethod || 'code'}')" class="bg-gray-100 dark:bg-dark-tertiary text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-dark-tertiary/80 transition"><i class="fas fa-edit mr-2"></i>জয়েন সেটিংস</button>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white dark:bg-dark-secondary rounded-2xl border dark:border-dark-tertiary p-5 shadow-sm"><div class="flex items-center gap-3"><div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xl"><i class="fas fa-users"></i></div><div><div class="text-2xl font-black dark:text-white">${stats.studentCount}</div><div class="text-xs text-gray-500 dark:text-gray-400">মোট শিক্ষার্থী</div></div></div></div>
        <div class="bg-white dark:bg-dark-secondary rounded-2xl border dark:border-dark-tertiary p-5 shadow-sm"><div class="flex items-center gap-3"><div class="w-12 h-12 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xl"><i class="fas fa-broadcast-tower"></i></div><div><div class="text-2xl font-black dark:text-white">${stats.liveExams}</div><div class="text-xs text-gray-500 dark:text-gray-400">লাইভ পরীক্ষা</div></div></div></div>
        <div class="bg-white dark:bg-dark-secondary rounded-2xl border dark:border-dark-tertiary p-5 shadow-sm"><div class="flex items-center gap-3"><div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-xl"><i class="fas fa-book-reader"></i></div><div><div class="text-2xl font-black dark:text-white">${stats.mockExams}</div><div class="text-xs text-gray-500 dark:text-gray-400">প্র্যাকটিস পরীক্ষা</div></div></div></div>
      </div>
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white mb-6">
        <h4 class="font-bold mb-3">দ্রুত অ্যাকশন</h4>
        <div class="flex flex-wrap gap-3">
          <button onclick="Teacher.manageGroupsView()" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition"><i class="fas fa-folder mr-2"></i>কোর্স ব্যবস্থাপনা</button>
          <button onclick="Router.teacher('create')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition"><i class="fas fa-plus-circle mr-2"></i>নতুন পরীক্ষা</button>
          <button onclick="Teacher.liveExamManagementView()" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition"><i class="fas fa-tasks mr-2"></i>লাইভ ব্যবস্থাপনা</button>
        </div>
      </div>
    </div>`;
}
