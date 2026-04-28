// src/teacher/components/folder-tree.js
// Reusable folder-tree component (subjects, chapters, exams) for Teacher Library

/**
 * Render a list of subjects with chapters and exams.
 * @param {Array} subjects - array of subject objects
 * @param {string} type - 'live' or 'mock'
 * @returns {string} HTML
 */
export function renderSubjectTree(subjects, type) {
  if (!subjects || subjects.length === 0) {
    return `<div class="text-center p-4 text-gray-400">
      <i class="fas fa-folder-open text-2xl mb-2 opacity-30"></i>
      <p>No ${type} subjects yet</p>
    </div>`;
  }

  return subjects.map(subject => {
    const subjectId = `subject-${subject.id}`;
    return `
    <div class="folder-item p-3 rounded-lg border border-gray-100 dark:border-gray-700 mb-2 dark:bg-black">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2 flex-1">
          <i class="fas fa-folder folder-icon"></i>
          <span class="font-bold dark:text-white">${subject.name}</span>
          <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            ${subject.children.length} Chapters
          </span>
        </div>
        <div class="flex items-center gap-1">
          ${subject.children.length > 0 ? `
          <button data-folder-id="${subjectId}" class="folder-toggle-btn text-gray-400 hover:text-gray-600 p-1">
            <i class="fas fa-chevron-down" id="icon-${subjectId}"></i>
          </button>
          ` : ''}
          <div class="three-dot-menu relative">
            <button class="three-dot-btn" onclick="event.stopPropagation(); Teacher.toggleThreeDotMenu('subject-${subject.id}')">
              <i class="fas fa-ellipsis-v text-gray-400"></i>
            </button>
            <div class="dot-menu-dropdown dark:bg-gray-800 dark:border-gray-700" id="menu-subject-${subject.id}">
              <div class="menu-item add-chapter dark:text-emerald-400" onclick="Teacher.addChapterToSubject('${subject.id}', '${type}')">
                <i class="fas fa-plus-circle"></i> Add Chapter
              </div>
              <div class="menu-item rename dark:text-purple-400" onclick="Teacher.renameItem('subject', '${subject.id}', '${subject.name}')">
                <i class="fas fa-pencil-alt"></i> Rename
              </div>
              <div class="menu-item delete dark:text-red-400" onclick="Teacher.deleteSubject('${subject.id}', '${type}')">
                <i class="fas fa-trash"></i> Delete
              </div>
            </div>
          </div>
        </div>
      </div>
      ${subject.children.length > 0 ? `
      <div class="folder-children mt-2 hidden" id="children-${subjectId}">
        ${subject.children.map(chapter => renderChapter(chapter, type, subject.id)).join('')}
      </div>
      ` : ''}
    </div>`;
  }).join('');
}

/**
 * Render a single chapter with its exams.
 */
function renderChapter(chapter, type, subjectId) {
  const chapterId = `chapter-${chapter.id}`;
  const hasExams = chapter.exams.length > 0;

  return `
    <div class="ml-4 p-3 border-l-2 border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          <i class="fas fa-folder-open text-gray-400"></i>
          <span class="font-medium dark:text-white">${chapter.name}</span>
          <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            ${chapter.exams.length} Exams
          </span>
        </div>
        <div class="flex items-center gap-1">
          ${hasExams ? `
          <button data-folder-id="${chapterId}" class="folder-toggle-btn text-gray-400 hover:text-gray-600 p-1">
            <i class="fas fa-chevron-down" id="icon-${chapterId}"></i>
          </button>
          ` : ''}
          <div class="three-dot-menu relative">
            <button class="three-dot-btn" onclick="event.stopPropagation(); Teacher.toggleThreeDotMenu('chapter-${chapter.id}')">
              <i class="fas fa-ellipsis-v text-gray-400"></i>
            </button>
            <div class="dot-menu-dropdown dark:bg-gray-800 dark:border-gray-700" id="menu-chapter-${chapter.id}">
              <div class="menu-item add-exam dark:text-amber-400" onclick="Teacher.addExamToChapter('${subjectId}', '${chapter.id}', '${type}')">
                <i class="fas fa-plus"></i> Add Exam
              </div>
              <div class="menu-item rename dark:text-purple-400" onclick="Teacher.renameItem('chapter', '${chapter.id}', '${chapter.name}')">
                <i class="fas fa-pencil-alt"></i> Rename
              </div>
              <div class="menu-item delete dark:text-red-400" onclick="Teacher.deleteChapter('${chapter.id}', '${type}')">
                <i class="fas fa-trash"></i> Delete
              </div>
            </div>
          </div>
        </div>
      </div>
      ${hasExams ? `
      <div class="chapter-children ml-6 hidden" id="children-${chapterId}">
        ${chapter.exams.map(exam => renderExamItem(exam, type)).join('')}
      </div>
      ` : ''}
    </div>`;
}

/**
 * Render a single exam item inside a chapter.
 */
function renderExamItem(exam, type) {
  const examData = exam.examData || {};
  const isDraft = examData.isDraft;
  const isCancelled = examData.cancelled;
  const isPublished = examData.resultPublished;
  const now = new Date();
  const startTime = examData.startTime ? new Date(examData.startTime) : null;
  const endTime = examData.endTime ? new Date(examData.endTime) : null;

  let statusClass = 'status-draft';
  let statusText = 'Draft';
  if (isCancelled) { statusClass = 'status-cancelled'; statusText = 'Cancelled'; }
  else if (isPublished) { statusClass = 'status-ended'; statusText = 'Ended'; }
  else if (startTime && endTime) {
    if (now < startTime) { statusClass = 'status-upcoming'; statusText = 'Upcoming'; }
    else if (now >= startTime && now <= endTime) { statusClass = 'status-ongoing'; statusText = 'Ongoing'; }
    else { statusClass = 'status-ended'; statusText = 'Ended'; }
  } else if (isDraft) { statusClass = 'status-draft'; statusText = 'Draft'; }

  return `
    <div class="p-2 mt-2 bg-gray-50 dark:bg-black rounded border border-gray-100 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 flex-1">
          <i class="fas fa-file-alt ${type === 'live' ? 'live-icon' : 'exam-icon'}"></i>
          <div>
            <div class="font-medium text-sm dark:text-white">${exam.name}</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs ${statusClass} px-2 py-0.5 rounded">${statusText}</span>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                ${examData.createdAt?.toDate ? moment(examData.createdAt.toDate()).format('DD MMM, YYYY') : 'Unknown date'}
              </div>
            </div>
          </div>
        </div>
        <div class="three-dot-menu relative">
          <button class="three-dot-btn" onclick="event.stopPropagation(); Teacher.toggleThreeDotMenu('exam-${exam.id}')">
            <i class="fas fa-ellipsis-v text-gray-400"></i>
          </button>
          <div class="dot-menu-dropdown dark:bg-gray-800 dark:border-gray-700" id="menu-exam-${exam.id}">
            <div class="menu-item view dark:text-blue-400" onclick="Teacher.viewPaper('${exam.id}')">
              <i class="fas fa-eye"></i> View
            </div>
            <div class="menu-item edit dark:text-blue-400" onclick="Teacher.editExam('${exam.id}')">
              <i class="fas fa-edit"></i> Edit
            </div>
            ${type === 'live' && isDraft ? `
            <div class="menu-item take-exam dark:text-emerald-400" onclick="Teacher.takeExamNow('${exam.id}')">
              <i class="fas fa-play"></i> Take Exam
            </div>
            ` : ''}
            <div class="menu-item delete dark:text-red-400" onclick="Teacher.deleteExam('${exam.id}')">
              <i class="fas fa-trash"></i> Delete
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

/**
 * Toggle folder (subject/chapter) open/close.
 * @param {string} id - folder id
 */
export function toggleFolder(id) {
  const children = document.getElementById(`children-${id}`);
  const icon = document.getElementById(`icon-${id}`);
  if (!children || !icon) return;

  if (children.classList.contains('hidden')) {
    children.classList.remove('hidden');
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
  } else {
    children.classList.add('hidden');
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
  }
}
