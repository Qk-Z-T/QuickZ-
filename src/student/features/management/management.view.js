// src/student/features/management/management.view.js
// Student management page UI sections

export function renderTeacherSection(teacherCodes, teacherNames, activeTeacherCode) {
  if (!teacherCodes || teacherCodes.length === 0) {
    return `
      <div class="mb-6">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-lg dark:text-white">শিক্ষক অ্যাকাউন্ট</h3>
          <button onclick="ManagementManager.addTeacherCode()" class="text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg font-bold">
            <i class="fas fa-plus mr-1"></i> যোগ করুন
          </button>
        </div>
        <div class="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          কোনো শিক্ষক অ্যাকাউন্ট যোগ করা হয়নি। পরীক্ষা দেখতে অন্তত একটি শিক্ষক অ্যাকাউন্ট প্রয়োজন।
        </div>
      </div>`;
  }

  const activeTeacher = teacherCodes.find(tc => tc.active);
  const activeName = activeTeacher ? (teacherNames[activeTeacher.code] || 'Unknown') : 'শিক্ষক নির্বাচন করুন';

  let dropdownHtml = teacherCodes.map(tc => {
    const name = teacherNames[tc.code] || 'Unknown Teacher';
    return `
      <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm border-b dark:border-gray-700 flex justify-between items-center ${tc.active ? 'bg-indigo-50 dark:bg-indigo-900' : ''}">
        <div class="flex-1" onclick="ManagementManager.switchTeacherCode('${tc.code}')">${name}</div>
        ${teacherCodes.length > 1 ? `<button onclick="event.stopPropagation(); ManagementManager.confirmDeleteTeacher('${tc.code}')" class="text-red-500 hover:text-red-700 ml-2" title="মুছুন"><i class="fas fa-trash"></i></button>` : ''}
        ${tc.active ? '<i class="fas fa-check text-green-500 ml-1"></i>' : ''}
      </div>`;
  }).join('');

  return `
    <div class="mb-6">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold text-lg dark:text-white">শিক্ষক অ্যাকাউন্ট</h3>
        <button onclick="ManagementManager.addTeacherCode()" class="text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg font-bold">
          <i class="fas fa-plus mr-1"></i> যোগ করুন
        </button>
      </div>
      <div class="relative">
        <button onclick="document.getElementById('teacher-drop').classList.toggle('hidden')" class="flex items-center justify-between w-full px-4 py-3 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold text-sm transition border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-gray-700">
          <div class="flex items-center gap-2">
            <i class="fas fa-chalkboard-teacher"></i>
            <span>${activeName}</span>
            ${activeTeacher ? '<span class="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded">সক্রিয়</span>' : ''}
          </div>
          <i class="fas fa-chevron-down text-xs"></i>
        </button>
        <div id="teacher-drop" class="hidden absolute top-12 left-0 w-full bg-white dark:bg-gray-700 border dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden mt-1">
          ${dropdownHtml}
          <div onclick="ManagementManager.addTeacherCode()" class="p-3 text-indigo-600 dark:text-indigo-400 font-bold text-center text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-600 border-t dark:border-gray-700">
            <i class="fas fa-plus-circle mr-1"></i> নতুন শিক্ষক যোগ করুন
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        <i class="fas fa-info-circle mr-1"></i>
        শিক্ষক অ্যাকাউন্ট নির্বাচন করুন। একসাথে কেবল একটি সক্রিয় থাকতে পারে।
      </p>
    </div>`;
}

export function renderJoinedGroupsSection(joinedGroups, activeGroupId) {
  if (!joinedGroups || joinedGroups.length === 0) {
    return `
      <div class="mb-6">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-lg dark:text-white">আমার কোর্স</h3>
          <button onclick="Router.student('courses')" class="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg font-bold">
            <i class="fas fa-plus mr-1"></i> নতুন কোর্স খুঁজুন
          </button>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-sm">আপনি কোনো কোর্সে জয়েন করেননি।</p>
      </div>`;
  }

  const groupsHtml = joinedGroups.map(group => {
    const isActive = group.groupId === activeGroupId;
    return `
      <div class="p-3 rounded-xl mb-2 flex justify-between items-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div class="font-bold text-sm dark:text-white">${group.groupName || 'অজানা কোর্স'}</div>
        <div class="flex gap-2">
          ${!isActive ? `<button onclick="ManagementManager.switchGroup('${group.groupId}')" class="text-xs bg-indigo-500 text-white px-2 py-1 rounded">সুইচ</button>` : '<span class="text-xs bg-green-500 text-white px-2 py-1 rounded">সক্রিয়</span>'}
          <button onclick="ManagementManager.confirmLeaveGroup('${group.groupId}')" class="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-1 rounded">ত্যাগ</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="mb-6">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold text-lg dark:text-white">আমার কোর্স</h3>
        <button onclick="Router.student('courses')" class="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg font-bold">
          <i class="fas fa-plus mr-1"></i> নতুন কোর্স খুঁজুন
        </button>
      </div>
      <div class="space-y-2">${groupsHtml}</div>
    </div>`;
}

export function renderPasswordChangeSection() {
  return `
    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div id="password-header" class="flex justify-between items-center cursor-pointer p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600" onclick="ManagementManager.togglePasswordForm()">
        <div class="flex items-center gap-2">
          <i class="fas fa-key text-indigo-500"></i>
          <span class="font-bold dark:text-white">পাসওয়ার্ড পরিবর্তন</span>
        </div>
        <i id="password-chevron" class="fas fa-chevron-down text-gray-400"></i>
      </div>
      <div id="password-form" class="overflow-hidden transition-all max-h-0 mt-3 space-y-3">
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">বর্তমান পাসওয়ার্ড</label>
          <div class="relative">
            <input type="password" id="current-password" class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white" placeholder="বর্তমান পাসওয়ার্ড">
            <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('current-password', this)"></i>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">নতুন পাসওয়ার্ড</label>
          <div class="relative">
            <input type="password" id="new-password" class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white" placeholder="নতুন পাসওয়ার্ড">
            <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('new-password', this)"></i>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
          <div class="relative">
            <input type="password" id="confirm-password" class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white" placeholder="পুনরায় লিখুন">
            <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('confirm-password', this)"></i>
          </div>
        </div>
        <button onclick="ManagementManager.changePassword()" class="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">পাসওয়ার্ড পরিবর্তন</button>
      </div>
    </div>`;
}

export function renderManagementContainer(teacherSection, groupsSection, passwordSection) {
  return `
    <div class="p-5 pb-20 max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-4 text-center dark:text-white">ম্যানেজমেন্ট</h2>
      <div class="p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-6">
        ${teacherSection}
        ${groupsSection}
        ${passwordSection}
        <button onclick="Auth.confirmLogout()" class="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition">
          লগআউট
        </button>
      </div>
    </div>`;
}
