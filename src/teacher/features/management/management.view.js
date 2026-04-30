// src/teacher/features/management/management.view.js
// UI rendering for Management Hub & Live Exam Management

export function renderManagementHub(groupName) {
  return `
    <div class="pb-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold font-en text-gray-800 dark:text-white bengali-text">ম্যানেজমেন্ট হাব</h2>
      </div>
      <div id="current-group-info-card" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <i class="fas fa-book"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-bold dark:text-white">${groupName}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">সক্রিয় কোর্স</p>
          </div>
          <button onclick="Teacher.manageGroupsView()" class="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-bold">
            <i class="fas fa-cog mr-1"></i>কোর্স ব্যবস্থাপনা
          </button>
        </div>
      </div>
      <div class="management-list">
        <div class="management-item" onclick="Teacher.liveExamManagementView()">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl"><i class="fas fa-broadcast-tower"></i></div>
            <div><div class="font-bold text-sm text-gray-700 dark:text-white bengali-text">লাইভ পরীক্ষা ব্যবস্থাপনা</div><div class="text-xs text-gray-500 dark:text-gray-400 bengali-text">চলমান লাইভ পরীক্ষা বাতিল ও প্রকাশ করুন</div></div>
          </div>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </div>
        <div class="management-item" onclick="Teacher.manageGroupsView()">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-amber-50 dark:bg-amber-900 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 text-xl"><i class="fas fa-book"></i></div>
            <div><div class="font-bold text-sm text-gray-700 dark:text-white bengali-text">কোর্স ব্যবস্থাপনা</div><div class="text-xs text-gray-500 dark:text-gray-400 bengali-text">আপনার কোর্সের শিক্ষার্থী পরিচালনা করুন</div></div>
          </div>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </div>
        <div class="management-item" onclick="Teacher.archiveGroupsView()">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-rose-50 dark:bg-rose-900 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 text-xl"><i class="fas fa-archive"></i></div>
            <div><div class="font-bold text-sm text-gray-700 dark:text-white bengali-text">আর্কাইভ কোর্স</div><div class="text-xs text-gray-500 dark:text-gray-400 bengali-text">আর্কাইভকৃত কোর্স দেখুন ও পরিচালনা করুন</div></div>
          </div>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </div>
        <div class="management-item" onclick="Teacher.noticeManagementView()">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl"><i class="fas fa-bullhorn"></i></div>
            <div><div class="font-bold text-sm text-gray-700 dark:text-white bengali-text">নোটিশ ও পোল</div><div class="text-xs text-gray-500 dark:text-gray-400 bengali-text">কোর্সের জন্য নোটিশ ও পোল তৈরি করুন</div></div>
          </div>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </div>
      </div>
    </div>`;
}

export function renderLiveExamCard(exam) {
  const startTime = moment(exam.startTime).format('lll');
  const endTime = moment(exam.endTime).format('lll');
  return `
    <div class="live-exam-card bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 text-sm flex-shrink-0"><i class="fas fa-video"></i></div>
        <div class="flex-1">
          <h3 class="font-bold dark:text-white bengali-text">${exam.title}</h3>
          <p class="text-xs text-gray-500 bengali-text">${exam.subject || 'কোনো বিষয় নেই'} - ${exam.chapter || 'কোনো অধ্যায় নেই'}</p>
        </div>
      </div>
      <div class="text-[10px] text-gray-400 mb-3 pl-13">
        <i class="far fa-calendar-alt mr-1"></i> শুরু: ${startTime} <br>
        <i class="far fa-clock mr-1"></i> শেষ: ${endTime}
      </div>
      <div class="flex gap-2">
        <button onclick="Teacher.stopLiveExam('${exam.id}')" class="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold bengali-text hover:bg-red-700 transition"><i class="fas fa-ban mr-1"></i> বাতিল</button>
        <button onclick="Teacher.extendExamTime('${exam.id}')" class="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold bengali-text hover:bg-emerald-700 transition"><i class="fas fa-clock mr-1"></i> সময় বাড়ান</button>
        <button onclick="Teacher.publish('${exam.id}')" class="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold bengali-text hover:bg-indigo-700 transition"><i class="fas fa-bullhorn mr-1"></i> প্রকাশ</button>
      </div>
    </div>`;
}
