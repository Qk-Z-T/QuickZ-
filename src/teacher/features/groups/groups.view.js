// src/teacher/features/groups/groups.view.js
// UI rendering for teacher groups, student list, and student profile edit

/**
 * Render the list of teacher's groups (cards).
 * @param {Array} groups - array of group objects
 * @returns {string} HTML
 */
export function renderGroupList(groups) {
  if (!groups || groups.length === 0) {
    return `<div class="text-center p-4 text-gray-400 bengali-text">কোনো সক্রিয় কোর্স পাওয়া যায়নি</div>`;
  }

  let html = '<div class="group-grid">';
  groups.forEach(group => {
    const classBadge = group.classLevel
      ? `<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">${
          group.classLevel === 'Admission' ? 'এডমিশন' : group.classLevel
        }</span>`
      : '';
    const joinMethodText =
      {
        public: 'পাবলিক',
        code: 'কোর্স কোড',
        permission: 'পারমিশন কী'
      }[group.joinMethod] || 'কোর্স কোড';

    const imageHtml = group.imageUrl
      ? `<img src="${group.imageUrl}" alt="${group.name}" class="w-full h-32 object-cover rounded-t-lg">`
      : `<div class="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-3xl text-indigo-400 rounded-t-lg"><i class="fas fa-book-open"></i></div>`;

    html += `
      <div class="group-card overflow-hidden" onclick="Teacher.viewGroupStudents('${group.id}')">
        ${imageHtml}
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg dark:text-white bengali-text group-hover:text-indigo-600 transition">${group.name}</h3>
            <div class="three-dot-menu relative">
              <button class="three-dot-btn" onclick="event.stopPropagation(); Teacher.toggleGroupMenu('${group.id}')">
                <i class="fas fa-ellipsis-v text-gray-400"></i>
              </button>
              <div class="dot-menu-dropdown dark:bg-gray-800 dark:border-gray-700" id="group-menu-${group.id}">
                <div class="menu-item edit dark:text-blue-400 bengali-text" onclick="event.stopPropagation(); Teacher.editGroupDetails('${group.id}')">
                  <i class="fas fa-edit"></i> সম্পাদনা
                </div>
                <div class="menu-item rename dark:text-purple-400 bengali-text" onclick="event.stopPropagation(); Teacher.renameGroup('${group.id}', '${group.name}')">
                  <i class="fas fa-pencil-alt"></i> পুনঃনামকরণ
                </div>
                <div class="menu-item archive dark:text-amber-400 bengali-text" onclick="event.stopPropagation(); Teacher.archiveGroupConfirm('${group.id}', '${group.groupCode}')">
                  <i class="fas fa-archive"></i> আর্কাইভে সরান
                </div>
                <div class="menu-item delete dark:text-red-400 bengali-text" onclick="event.stopPropagation(); Teacher.deleteGroupConfirm('${group.id}', '${group.groupCode}')">
                  <i class="fas fa-trash"></i> মুছে ফেলুন
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mb-2">
            ${classBadge}
            <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">${joinMethodText}</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">${group.description || 'কোনো বিবরণ নেই'}</p>
          <div class="group-code-container mb-3" onclick="event.stopPropagation();">
            <span class="group-code-text">${group.groupCode}</span>
            <button onclick="Teacher.copyGroupCode('${group.groupCode}')" class="copy-btn">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2 text-center text-[10px] uppercase font-bold tracking-wider">
            <div class="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded border border-indigo-100 dark:border-indigo-800">
              <span class="font-black block text-indigo-700 dark:text-indigo-400 text-sm mb-0.5">${group.studentIds ? group.studentIds.length : 0}</span>
              <span class="text-gray-500">মোট শিক্ষার্থী</span>
            </div>
            <div class="bg-amber-50 dark:bg-amber-900/30 p-2 rounded border border-amber-100 dark:border-amber-800">
              <span class="font-black block text-amber-700 dark:text-amber-400 text-sm mb-0.5">0</span>
              <span class="text-gray-500">অপেক্ষমান</span>
            </div>
          </div>
          <div class="text-[10px] text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
            তৈরি: ${moment(group.createdAt?.toDate()).format('DD MMM YYYY')}
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  return html;
}

/**
 * Render student list item rows for the group student list.
 * @param {Array} students - array of student objects with status etc.
 * @returns {string} HTML
 */
export function renderStudentList(students) {
  if (!students || students.length === 0) {
    return `
      <div class="text-center p-10 text-gray-400">
        <i class="fas fa-users text-4xl mb-4 opacity-30"></i>
        <p class="bengali-text">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
      </div>`;
  }

  return students
    .map(student => {
      const isPending = student.status === 'pending';
      const statusClass = isPending ? 'status-pending' : 'status-active';
      const statusText = isPending ? 'অপেক্ষমান' : 'সক্রিয়';

      return `
        <div class="student-item">
          <div onclick="Teacher.viewStudentProfile('${student.studentId || student.id}', '${window.currentGroupId}')" class="flex-1 cursor-pointer">
            <div class="font-bold text-sm dark:text-white bengali-text">${student.fullName || student.name || student.studentName || 'নাম নেই'}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">${student.email || student.studentEmail || ''}</div>
            <div class="text-[10px] text-indigo-500 font-bold mt-1 bengali-text">
              ${student.schoolName || student.collegeName || ''}
              ${student.phone ? '• ' + student.phone : ''}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="student-status ${statusClass} bengali-text">${statusText}</span>
            ${
              isPending
                ? `<div class="flex gap-2">
                    <button onclick="event.stopPropagation(); Teacher.approveStudentRequest('${student.id}', '${window.currentGroupId}')" class="text-xs bg-emerald-600 text-white px-2 py-1 rounded bengali-text">অনুমোদন</button>
                    <button onclick="event.stopPropagation(); Teacher.rejectStudentRequest('${student.id}', '${window.currentGroupId}')" class="text-xs bg-red-600 text-white px-2 py-1 rounded bengali-text">প্রত্যাখ্যান</button>
                  </div>`
                : student.status === 'active'
                ? `<div class="student-three-dot-menu relative">
                    <button class="three-dot-btn" onclick="event.stopPropagation(); Teacher.toggleStudentMenu('${student.studentId || student.id}')">
                      <i class="fas fa-ellipsis-v text-gray-400"></i>
                    </button>
                    <div class="dot-menu-dropdown student-dot-menu-dropdown dark:bg-gray-800 dark:border-gray-700" id="student-menu-${student.studentId || student.id}">
                      <div class="menu-item delete dark:text-red-400 bengali-text" onclick="event.stopPropagation(); Teacher.removeStudentFromGroup('${student.studentId || student.id}', '${window.currentGroupId}')">
                        <i class="fas fa-user-minus"></i> কোর্স থেকে সরান
                      </div>
                    </div>
                  </div>`
                : ''
            }
          </div>
        </div>`;
    })
    .join('');
}

/**
 * Render the editable student profile (teacher-side).
 * @param {Object} s - student data object
 * @returns {string} HTML
 */
export function renderStudentProfileEdit(s) {
  return `
    <div class="space-y-4">
      <div>
        <label class="text-xs font-bold dark:text-white bengali-text">পূর্ণ নাম</label>
        <input class="w-full p-2 border rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 bengali-text outline-none cursor-not-allowed" value="${s.fullName || s.name || ''}" readonly>
      </div>
      <div>
        <label class="text-xs font-bold dark:text-white bengali-text">শিক্ষার্থীর ফোন</label>
        <input class="w-full p-2 border rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 bengali-text outline-none cursor-not-allowed" value="${s.phone || ''}" readonly>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-bold dark:text-white bengali-text text-indigo-600 dark:text-indigo-400">পিতার ফোন</label>
          <input id="edit-s-fphone" class="w-full p-2 border rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 bengali-text transition-all" value="${s.fatherPhone || ''}" readonly>
        </div>
        <div>
          <label class="text-xs font-bold dark:text-white bengali-text text-indigo-600 dark:text-indigo-400">মাতার ফোন</label>
          <input id="edit-s-mphone" class="w-full p-2 border rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 bengali-text transition-all" value="${s.motherPhone || ''}" readonly>
        </div>
      </div>
      <div>
        <label class="text-xs font-bold dark:text-white bengali-text">বিদ্যালয়ের নাম</label>
        <input class="w-full p-2 border rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 bengali-text outline-none cursor-not-allowed" value="${s.schoolName || ''}" readonly>
      </div>
      <div>
        <label class="text-xs font-bold dark:text-white bengali-text">কলেজের নাম</label>
        <input class="w-full p-2 border rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 bengali-text outline-none cursor-not-allowed" value="${s.collegeName || ''}" readonly>
      </div>
      <button id="student-save-btn" onclick="Teacher.updateStudentProfileByTeacher('${s.uid || s.id}', '${window.currentGroupId}')" class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold mt-4 bengali-text hidden shadow-lg transform transition active:scale-95">পরিবর্তন সংরক্ষণ</button>
    </div>`;
}
