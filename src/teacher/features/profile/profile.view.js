// src/teacher/features/profile/profile.view.js
// Teacher profile view functions

/**
 * Render teacher's own profile display (read-only).
 * @param {Object} user - current teacher user object
 * @returns {string} HTML
 */
export function renderProfileDisplay(user) {
  return `
    <div class="p-0 max-w-2xl">
      <button onclick="Router.teacher(AppState.currentPage)" class="mb-4 text-xs font-bold text-gray-500 dark:text-gray-400 bengali-text">
        <i class="fas fa-arrow-left"></i> ফিরে যান
      </button>
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
            <i class="fas fa-user-tie"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold dark:text-white bengali-text">আমার প্রোফাইল</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 bengali-text">শিক্ষক অ্যাকাউন্ট</p>
          </div>
        </div>
        <button id="profile-edit-btn" onclick="Teacher.viewProfileEdit()" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold transition bengali-text">
          <i class="fas fa-edit mr-1"></i> সম্পাদনা
        </button>
      </div>
      <div class="teacher-profile-form">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white bengali-text">পূর্ণ নাম</label>
          <input type="text" id="profile-fullname" class="w-full p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 rounded-xl bengali-text" value="${user.fullName || ''}" readonly>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white bengali-text">ইমেইল <span class="text-[10px] text-red-500 ml-2 font-normal">(পরিবর্তনযোগ্য নয়)</span></label>
          <input type="email" id="profile-email" class="w-full p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 rounded-xl" value="${user.email}" readonly>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white bengali-text">ফোন নম্বর</label>
          <input type="tel" id="profile-phone" class="w-full p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 rounded-xl" value="${user.phone || ''}" readonly>
        </div>
        <button id="profile-save-btn" onclick="Teacher.saveProfile()" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-bold hidden shadow-lg bengali-text">
          <i class="fas fa-save mr-2"></i> পরিবর্তন সংরক্ষণ
        </button>
      </div>
    </div>`;
}

/**
 * Render teacher's own profile edit form.
 * @param {Object} user - current teacher user object
 * @returns {string} HTML
 */
export function renderProfileEditForm(user) {
  return `
    <div class="p-0 max-w-2xl">
      <button onclick="Teacher.viewProfile()" class="mb-4 text-xs font-bold text-gray-500 dark:text-gray-400 bengali-text">
        <i class="fas fa-arrow-left"></i> ফিরে যান
      </button>
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
            <i class="fas fa-user-tie"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold dark:text-white bengali-text">প্রোফাইল সম্পাদনা</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 bengali-text">শিক্ষক অ্যাকাউন্ট</p>
          </div>
        </div>
      </div>
      <div class="teacher-profile-form">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white bengali-text">পূর্ণ নাম</label>
          <input type="text" id="profile-fullname" class="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-gray-800 dark:text-white rounded-xl bengali-text" value="${user.fullName || ''}">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white bengali-text">ইমেইল <span class="text-[10px] text-red-500 ml-2 font-normal">(পরিবর্তনযোগ্য নয়)</span></label>
          <input type="email" id="profile-email" class="w-full p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 rounded-xl" value="${user.email}" readonly>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white bengali-text">ফোন নম্বর</label>
          <input type="tel" id="profile-phone" class="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-gray-800 dark:text-white rounded-xl" value="${user.phone || ''}">
        </div>
        <button id="profile-save-btn" onclick="Teacher.saveProfile()" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-bold shadow-lg bengali-text">
          <i class="fas fa-save mr-2"></i> পরিবর্তন সংরক্ষণ
        </button>
      </div>
    </div>`;
}
