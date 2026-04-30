// src/student/features/courses/courses.view.js
// Student courses page UI

export function renderCourseSearchAndFilter(studentClass, studentStream, classLevels, streamOptions, filterClass) {
  return `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">সার্চ</label>
          <input type="text" id="course-search-input" class="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" placeholder="কোর্সের নাম, শিক্ষক...">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">ক্লাস/লেভেল</label>
          <select id="course-filter-class" class="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
            <option value="all">সব ক্লাস</option>
            ${classLevels.map(lvl => `<option value="${lvl}" ${filterClass === lvl ? 'selected' : ''}>${lvl === 'Admission' ? 'এডমিশন' : (lvl === 'SSC' ? 'এসএসসি' : (lvl === 'HSC' ? 'এইচএসসি' : lvl+'ম শ্রেণী'))}</option>`).join('')}
          </select>
        </div>
        <div id="stream-filter-container" style="display:${filterClass === 'Admission' ? 'block' : 'none'};">
          <label class="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">শাখা</label>
          <select id="course-filter-stream" class="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
            ${streamOptions}
          </select>
        </div>
        <div class="flex items-end">
          <button onclick="CoursesManager.applyFilter()" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
            ফিল্টার
          </button>
        </div>
      </div>
      ${studentClass ? `<p class="text-xs text-indigo-600 dark:text-indigo-400 mt-3"><i class="fas fa-graduation-cap"></i> আপনার ক্লাস: ${studentClass} ${studentStream ? '('+studentStream+')' : ''}</p>` : ''}
    </div>`;
}

export function renderCourseCard(group, isJoined, joinMethodText) {
  const classBadge = group.classLevel ? 
    `<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">${group.classLevel === 'Admission' ? 'এডমিশন' : group.classLevel}</span>` : '';
  const streamBadge = group.admissionStream ? 
    `<span class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">${group.admissionStream}</span>` : '';
  const imageHtml = group.imageUrl ? 
    `<img src="${group.imageUrl}" class="w-full h-36 object-cover rounded-t-xl" alt="${group.name}">` : 
    `<div class="w-full h-36 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-3xl text-indigo-400 rounded-t-xl"><i class="fas fa-book-open"></i></div>`;

  const actionButton = isJoined 
    ? `<button class="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-2 rounded-lg text-sm font-bold" disabled><i class="fas fa-check-circle"></i> জয়েন করেছেন</button>`
    : `<button onclick="CoursesManager.joinCourse('${group.id}', '${group.joinMethod}', '${group.groupCode || ''}')" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">জয়েন করুন</button>`;

  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition hover:shadow-md">
      ${imageHtml}
      <div class="p-4">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-lg dark:text-white">${group.name}</h3>
          <div class="flex gap-1">${classBadge} ${streamBadge}</div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1"><i class="fas fa-user-tie"></i> ${group.teacherName || 'শিক্ষক'}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">${group.description || 'কোনো বিবরণ নেই'}</p>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">${joinMethodText}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400"><i class="fas fa-users"></i> ${group.studentIds?.length || 0} শিক্ষার্থী</span>
        </div>
        ${actionButton}
      </div>
    </div>`;
}

export function renderCourseList(gridContent) {
  return `
    <div class="p-5 pb-20">
      <h2 class="text-2xl font-bold mb-2 text-center dark:text-white">কোর্সসমূহ</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">আপনার পছন্দের কোর্স খুঁজুন ও জয়েন করুন</p>
      <div id="course-filter-area"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="course-list-container">
        ${gridContent}
      </div>
    </div>`;
}
