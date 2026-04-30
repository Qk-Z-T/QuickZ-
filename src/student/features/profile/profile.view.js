// src/student/features/profile/profile.view.js
// Student profile display and edit UI

export function renderProfileDisplay(profile, user) {
  const name = profile.name || 'Not Set';
  const phone = profile.phone || 'Not Set';
  const fatherPhone = profile.fatherPhone || 'Not Set';
  const motherPhone = profile.motherPhone || 'Not Set';
  const school = profile.schoolName || '';
  const college = profile.collegeName || '';
  const classLevel = profile.classLevel || '';
  const admissionStream = profile.admissionStream || '';

  return `
    <div class="p-5 max-w-md mx-auto">
      <div class="p-6 rounded-2xl shadow-sm border bg-white dark:bg-gray-800">
        <button onclick="Router.student('dashboard')" class="mb-4 text-xs font-bold flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <i class="fas fa-arrow-left"></i> ড্যাশবোর্ডে ফিরে যান
        </button>
        <div class="w-20 h-20 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full mx-auto text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-lg border-4 border-white dark:border-gray-800">
          ${name.charAt(0).toUpperCase()}
        </div>
        <h2 class="text-xl font-bold text-center mb-1 text-gray-800 dark:text-white">${name}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">${user?.email || ''}</p>
        
        <div class="mb-6">
          <h3 class="font-bold text-lg mb-3 dark:text-white">প্রোফাইল তথ্য</h3>
          <div class="space-y-2">
            <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">ফোন:</span><span class="font-medium dark:text-white">${phone}</span></div>
            <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">পিতার ফোন:</span><span class="font-medium dark:text-white">${fatherPhone}</span></div>
            <div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">মাতার ফোন:</span><span class="font-medium dark:text-white">${motherPhone}</span></div>
            ${school ? `<div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">বিদ্যালয়:</span><span class="font-medium dark:text-white">${school}</span></div>` : ''}
            ${college ? `<div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">কলেজ:</span><span class="font-medium dark:text-white">${college}</span></div>` : ''}
            ${classLevel ? `<div class="flex justify-between"><span class="text-gray-600 dark:text-gray-400">ক্লাস:</span><span class="font-medium dark:text-white">${classLevel === 'Admission' ? 'এডমিশন' : (classLevel === 'SSC' ? 'এসএসসি' : (classLevel === 'HSC' ? 'এইচএসসি' : classLevel+'ম শ্রেণী'))} ${admissionStream ? '('+admissionStream+')' : ''}</span></div>` : ''}
          </div>
        </div>
        
        <button onclick="ProfileManager.showEditForm()" class="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition">
          <i class="fas fa-edit mr-2"></i> প্রোফাইল সম্পাদনা
        </button>
      </div>
    </div>`;
}

export function renderProfileEditForm(profile) {
  return `
    <div class="p-5 max-w-md mx-auto">
      <div class="p-6 rounded-2xl shadow-sm border bg-white dark:bg-gray-800">
        <button onclick="ProfileManager.profile()" class="mb-6 text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 hover:text-indigo-600 transition">
          <i class="fas fa-arrow-left"></i> প্রোফাইলে ফিরে যান
        </button>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-indigo-50 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl">
            <i class="fas fa-user-edit"></i>
          </div>
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">প্রোফাইল আপডেট</h2>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">পূর্ণ নাম</label>
            <input id="edit-name" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-500 transition dark:text-white" value="${profile.name || ''}" placeholder="আপনার পুরো নাম লিখুন">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">ফোন নম্বর</label>
            <input id="edit-phone" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-500 transition dark:text-white" value="${profile.phone || ''}" placeholder="ফোন নম্বর লিখুন">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">বিদ্যালয়ের নাম</label>
            <input id="edit-school" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-500 transition dark:text-white" value="${profile.schoolName || ''}" placeholder="বিদ্যালয়ের নাম লিখুন">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">কলেজের নাম</label>
            <input id="edit-college" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-500 transition dark:text-white" value="${profile.collegeName || ''}" placeholder="কলেজের নাম লিখুন">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">ক্লাস/লেভেল</label>
            <select id="edit-class-level" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-500 transition dark:text-white">
              <option value="6" ${profile.classLevel === '6' ? 'selected' : ''}>৬ষ্ঠ শ্রেণী</option>
              <option value="7" ${profile.classLevel === '7' ? 'selected' : ''}>৭ম শ্রেণী</option>
              <option value="8" ${profile.classLevel === '8' ? 'selected' : ''}>৮ম শ্রেণী</option>
              <option value="SSC" ${profile.classLevel === 'SSC' ? 'selected' : ''}>এসএসসি</option>
              <option value="HSC" ${profile.classLevel === 'HSC' ? 'selected' : ''}>এইচএসসি</option>
              <option value="Admission" ${profile.classLevel === 'Admission' ? 'selected' : ''}>এডমিশন</option>
            </select>
          </div>
          <div id="edit-admission-stream-group" style="${profile.classLevel === 'Admission' ? '' : 'display:none;'}">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">শাখা</label>
            <select id="edit-admission-stream" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-500 transition dark:text-white">
              <option value="">নির্বাচন করুন</option>
              <option value="Science" ${profile.admissionStream === 'Science' ? 'selected' : ''}>সায়েন্স</option>
              <option value="Humanities" ${profile.admissionStream === 'Humanities' ? 'selected' : ''}>মানবিক</option>
              <option value="Commerce" ${profile.admissionStream === 'Commerce' ? 'selected' : ''}>কমার্স</option>
            </select>
          </div>
          <button onclick="ProfileManager.saveEditedProfile()" class="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 rounded-xl font-bold mt-2 shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition">
            পরিবর্তন সংরক্ষণ
          </button>
        </div>
      </div>
    </div>`;
}
