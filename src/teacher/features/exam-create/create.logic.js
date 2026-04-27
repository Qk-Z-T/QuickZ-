// src/teacher/features/exam-create/create.logic.js
// Teacher exam creation logic: question management, JSON/manual mode, offline support

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Teacher } from '../../teacher-core.js';
import { saveFolderStructureToFirebase } from '../realtime-sync/sync.logic.js';
import { DB } from '../../../shared/services/db.service.js';
import {
  collection, addDoc, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let folderStructure = window.folderStructure;
let ExamCache = window.ExamCache;

// ---------- Question List Management ----------
function updateQuestionsList() {
  const list = document.getElementById('questions-list');
  if (!list) return;

  if (!Teacher.questions || Teacher.questions.length === 0) {
    list.innerHTML = `
      <h3 class="font-bold text-lg mb-2 dark:text-white">Questions List (0)</h3>
      <div class="text-center p-4 text-gray-400">No questions added yet</div>`;
    return;
  }

  list.innerHTML = `
    <h3 class="font-bold text-lg mb-2 dark:text-white">Questions List (${Teacher.questions.length})</h3>
    ${Teacher.questions.map((q, idx) => {
      const preview = (window.MathHelper?.renderExamContent(q.q.substring(0, 100) + (q.q.length > 100 ? '...' : ''))) || q.q;
      return `
        <div class="p-3 rounded-lg border mb-2 bg-white dark:bg-gray-800">
          <div class="flex justify-between items-start mb-2">
            <div class="font-bold text-sm truncate">${idx + 1}. ${preview}</div>
            <div class="flex gap-2">
              <button onclick="Teacher.editQuestion(${idx})" class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button>
              <button onclick="Teacher.deleteQuestion(${idx})" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="text-xs text-gray-500">
            A. ${q.options[0]?.substring(0, 30)}... | B. ${q.options[1]?.substring(0, 30)}... |
            C. ${q.options[2]?.substring(0, 30)}... | D. ${q.options[3]?.substring(0, 30)}...
          </div>
          <div class="text-xs text-green-600 font-bold mt-1">Correct: ${String.fromCharCode(65 + q.correct)}</div>
        </div>`;
    }).join('')}
  `;

  if (window.loadMathJax) window.loadMathJax(null, list);
}

// ---------- Add / Edit / Delete Questions ----------
Teacher.addQuestionToList = function () {
  const qText = document.getElementById('textarea-question')?.value.trim();
  const optA = document.getElementById('option-a')?.value.trim();
  const optB = document.getElementById('option-b')?.value.trim();
  const optC = document.getElementById('option-c')?.value.trim();
  const optD = document.getElementById('option-d')?.value.trim();
  const correct = document.getElementById('correct-answer')?.value;
  const explanation = document.getElementById('explanation')?.value.trim() || '';
  const previousYear = document.getElementById('previous-year')?.value.trim() || '';
  const showPrevYear = document.getElementById('show-previous-year')?.checked || false;

  if (!qText || !optA || !optB || !optC || !optD || correct === '' || correct === null) {
    Swal.fire('Error', 'Please fill all required fields', 'error');
    return;
  }

  const question = {
    q: qText,
    options: [optA, optB, optC, optD],
    correct: parseInt(correct),
    expl: explanation,
    previousYear: previousYear,
    showPreviousYearInQuestion: showPrevYear
  };

  if (Teacher.currentQuestion !== null) {
    Teacher.questions[Teacher.currentQuestion] = question;
    Teacher.currentQuestion = null;
    document.getElementById('add-question-btn').innerHTML = '<i class="fas fa-plus mr-2"></i> Add Question to List';
    document.getElementById('question-form-title').innerText = 'Add New Question';
  } else {
    Teacher.questions.push(question);
  }

  // Clear form fields
  ['textarea-question', 'option-a', 'option-b', 'option-c', 'option-d', 'explanation', 'previous-year'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const correctEl = document.getElementById('correct-answer');
  if (correctEl) correctEl.value = '';
  const showPrevEl = document.getElementById('show-previous-year');
  if (showPrevEl) showPrevEl.checked = false;

  updateQuestionsList();
  document.getElementById('textarea-question')?.focus();
};

Teacher.editQuestion = function (idx) {
  const q = Teacher.questions[idx];
  if (!q) return;

  document.getElementById('textarea-question').value = q.q;
  document.getElementById('option-a').value = q.options[0];
  document.getElementById('option-b').value = q.options[1];
  document.getElementById('option-c').value = q.options[2];
  document.getElementById('option-d').value = q.options[3];
  document.getElementById('correct-answer').value = q.correct;
  document.getElementById('explanation').value = q.expl || '';
  document.getElementById('previous-year').value = q.previousYear || '';
  if (document.getElementById('show-previous-year'))
    document.getElementById('show-previous-year').checked = q.showPreviousYearInQuestion || false;

  Teacher.currentQuestion = idx;
  document.getElementById('add-question-btn').innerHTML = '<i class="fas fa-save mr-2"></i> Update Question';
  document.getElementById('question-form-title').innerText = `Edit Question ${idx + 1}`;

  document.getElementById('textarea-question')?.focus();
  window.scrollTo({ top: document.querySelector('.question-box')?.offsetTop - 20, behavior: 'smooth' });
};

Teacher.deleteQuestion = function (idx) {
  Swal.fire({
    title: 'Delete Question?',
    text: "This action cannot be undone!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Delete'
  }).then((result) => {
    if (result.isConfirmed) {
      Teacher.questions.splice(idx, 1);
      if (Teacher.currentQuestion === idx) {
        Teacher.currentQuestion = null;
        document.getElementById('add-question-btn').innerHTML = '<i class="fas fa-plus mr-2"></i> Add Question to List';
        document.getElementById('question-form-title').innerText = 'Add New Question';
      }
      updateQuestionsList();
    }
  });
};

// ---------- JSON / Manual Mode Switch ----------
Teacher.switchQuestionMode = function (mode) {
  window.questionMode = mode;
  if (mode === 'manual') {
    document.getElementById('manual-questions-container')?.classList.remove('hidden');
    document.getElementById('json-container')?.classList.add('hidden');
    document.getElementById('mode-manual').className = "px-3 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-lg";
    document.getElementById('mode-json').className = "px-3 py-1.5 text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg";

    try {
      const jsonText = document.getElementById('nq')?.value;
      if (jsonText?.trim()) {
        Teacher.questions = JSON.parse(jsonText);
        updateQuestionsList();
      }
    } catch (e) { /* ignore */ }
  } else {
    document.getElementById('manual-questions-container')?.classList.add('hidden');
    document.getElementById('json-container')?.classList.remove('hidden');
    document.getElementById('mode-manual').className = "px-3 py-1.5 text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg";
    document.getElementById('mode-json').className = "px-3 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-lg";

    if (Teacher.questions.length > 0) {
      const nq = document.getElementById('nq');
      if (nq) {
        nq.value = JSON.stringify(Teacher.questions, null, 2);
        if (window.autoResizeTextarea) window.autoResizeTextarea(nq);
      }
    }
  }
};

Teacher.copyJson = function () {
  const jsonTextarea = document.getElementById('nq');
  if (jsonTextarea) {
    jsonTextarea.select();
    document.execCommand('copy');
    Swal.fire('Copied!', 'JSON copied to clipboard', 'success');
  }
};

Teacher.clearJson = function () {
  const jsonTextarea = document.getElementById('nq');
  if (jsonTextarea) {
    jsonTextarea.value = '';
    if (window.autoResizeTextarea) window.autoResizeTextarea(jsonTextarea);
  }
};

// ---------- Create / Update Exam ----------
Teacher.createExam = async function (isDraft = false) {
  const confirmText = isDraft ? 'Save to Library as Draft' : 'Publish Exam';
  const confirmResult = await Swal.fire({
    title: confirmText,
    text: isDraft ? 'Save this exam as a draft?' : 'Publish this exam now?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: `Yes, ${confirmText}`
  });
  if (!confirmResult.isConfirmed) return;

  Swal.fire({
    title: isDraft ? 'Saving Draft...' : 'Publishing...',
    text: 'Please wait...',
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => Swal.showLoading()
  });

  try {
    const title = document.getElementById('nt')?.value.trim();
    const type = document.getElementById('nty')?.value;
    const duration = document.getElementById('nd')?.value;
    const marks = document.getElementById('nm')?.value;
    const negative = document.getElementById('nneg')?.value;
    const subject = document.getElementById('nsub')?.value || '';
    const chapter = document.getElementById('nchap')?.value || '';
    const autoPublish = document.getElementById('nautopub')?.checked || false;

    if (!title || !duration || !marks) throw new Error("Title, Duration, and Marks are required");

    let questions;
    if (window.questionMode === 'manual') {
      if (Teacher.questions.length === 0) throw new Error("Please add at least one question");
      questions = JSON.stringify(Teacher.questions);
    } else {
      questions = document.getElementById('nq')?.value;
      JSON.parse(questions); // validate
    }

    let startTime = null, endTime = null;
    if (type === 'live') {
      startTime = document.getElementById('nst')?.value;
      endTime = document.getElementById('net')?.value;
      if (!startTime || !endTime) throw new Error("Start and End time required for Live exams");
    }

    const examData = {
      title, type, subject, chapter,
      duration: parseInt(duration),
      totalMarks: parseInt(marks),
      negativeMark: parseFloat(negative),
      questions,
      startTime, endTime,
      autoPublish,
      isDraft,
      createdBy: AppState.currentUser.id,
      teacherCode: AppState.currentUser.teacherCode,
      resultPublished: isDraft ? false : (type === 'mock'),
      groupId: AppState.selectedGroup.id,
      groupName: AppState.selectedGroup.name,
      createdAt: new Date(),
      cancelled: false
    };

    // Offline fallback
    if (!navigator.onLine) {
      Swal.close();
      const tempId = 'local_' + Date.now();
      examData.localId = tempId;

      if (DB) await DB.addToSyncQueue({
        collection: 'exams',
        operation: 'add',
        payload: examData,
        docId: null,
        teacherId: AppState.currentUser.id
      });

      this._addToLocalFolderStructure(examData, tempId, subject, chapter, type);
      Teacher.questions = [];
      Teacher.currentQuestion = null;
      document.getElementById('floating-math-btn')?.classList.add('hidden');
      document.getElementById('math-symbols-panel')?.classList.remove('show');

      Swal.fire({
        title: 'Offline Mode',
        text: 'Exam saved locally. Will sync when online.',
        icon: 'info',
        confirmButtonText: 'OK'
      }).then(() => {
        if (isDraft) Teacher.foldersView?.();
        else Teacher.createView?.();
      });
      return;
    }

    const docRef = await addDoc(collection(db, "exams"), examData);

    if (subject) localStorage.setItem(`lastSubject_${type}`, subject);

    this._addToFolderStructure(examData, docRef.id, subject, chapter, type);
    await saveFolderStructureToFirebase();

    Teacher.questions = [];
    Teacher.currentQuestion = null;
    document.getElementById('floating-math-btn')?.classList.add('hidden');
    document.getElementById('math-symbols-panel')?.classList.remove('show');

    Swal.close();
    Swal.fire('Success', isDraft ? 'Exam saved to Library as draft' : 'Exam published successfully', 'success').then(() => {
      if (isDraft) Teacher.foldersView?.();
      else Teacher.createView?.();
    });
  } catch (e) {
    Swal.close();
    Swal.fire('Error', e.message, 'error');
  }
};

Teacher.updateExistingExam = async function (examId) {
  try {
    const title = document.getElementById('nt')?.value.trim();
    const duration = document.getElementById('nd')?.value;
    const marks = document.getElementById('nm')?.value;
    const negative = document.getElementById('nneg')?.value;
    const subject = document.getElementById('nsub')?.value || '';
    const chapter = document.getElementById('nchap')?.value || '';
    const autoPublish = document.getElementById('nautopub')?.checked || false;

    let questions;
    if (window.questionMode === 'manual') {
      if (Teacher.questions.length === 0) throw new Error("Please add at least one question");
      questions = JSON.stringify(Teacher.questions);
    } else {
      questions = document.getElementById('nq')?.value;
      JSON.parse(questions);
    }

    const exam = ExamCache[examId];
    const updateData = {
      title, subject, chapter,
      duration: parseInt(duration),
      totalMarks: parseInt(marks),
      negativeMark: parseFloat(negative),
      questions,
      updatedAt: new Date()
    };

    if (exam.type === 'live') {
      updateData.startTime = document.getElementById('nst')?.value;
      updateData.endTime = document.getElementById('net')?.value;
      updateData.autoPublish = autoPublish;
      updateData.resultPublished = exam.resultPublished || autoPublish;
    }

    if (!navigator.onLine) {
      if (DB) await DB.addToSyncQueue({
        collection: 'exams',
        operation: 'update',
        payload: updateData,
        docId: examId,
        teacherId: AppState.currentUser.id
      });
      Teacher.questions = [];
      document.getElementById('floating-math-btn')?.classList.add('hidden');
      Swal.fire('Offline Mode', 'Changes saved locally.', 'info').then(() => Teacher.foldersView?.());
      return;
    }

    await updateDoc(doc(db, "exams", examId), updateData);
    await Teacher.syncFolderExamData(examId, updateData);

    Teacher.questions = [];
    document.getElementById('floating-math-btn')?.classList.add('hidden');
    Swal.fire('Success', 'Exam updated successfully', 'success').then(() => Teacher.foldersView?.());
  } catch (e) {
    Swal.fire('Error', e.message, 'error');
  }
};

// ---------- Folder Structure Helpers ----------
Teacher._addToLocalFolderStructure = function (examData, tempId, subject, chapter, type) {
  const folderType = type === 'live' ? 'live' : 'mock';
  if (subject && chapter) {
    let sub = folderStructure[folderType].find(s => s.name === subject);
    if (!sub) {
      sub = { id: `subject-${subject}-${folderType}-${Date.now()}`, name: subject, type: 'subject', examType: folderType, children: [], exams: [] };
      folderStructure[folderType].push(sub);
    }
    let chap = sub.children.find(c => c.name === chapter);
    if (!chap) {
      chap = { id: `chapter-${chapter}-${sub.id}-${Date.now()}`, name: chapter, type: 'chapter', parent: sub.id, children: [], exams: [] };
      sub.children.push(chap);
    }
    chap.exams.push({ id: tempId, name: examData.title, type: 'exam', examType: type, parent: chap.id, examData });
  } else {
    if (!folderStructure.uncategorized) folderStructure.uncategorized = [];
    folderStructure.uncategorized.push({ id: tempId, name: examData.title, examType: type, examData });
  }
  localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
};

Teacher._addToFolderStructure = function (examData, docId, subject, chapter, type) {
  const folderType = type === 'live' ? 'live' : 'mock';
  if (subject && chapter) {
    let sub = folderStructure[folderType].find(s => s.name === subject);
    if (!sub) {
      sub = { id: `subject-${subject}-${folderType}-${Date.now()}`, name: subject, type: 'subject', examType: folderType, children: [], exams: [] };
      folderStructure[folderType].push(sub);
    }
    let chap = sub.children.find(c => c.name === chapter);
    if (!chap) {
      chap = { id: `chapter-${chapter}-${sub.id}-${Date.now()}`, name: chapter, type: 'chapter', parent: sub.id, children: [], exams: [] };
      sub.children.push(chap);
    }
    chap.exams.push({ id: docId, name: examData.title, type: 'exam', examType: type, parent: chap.id, examData });
  } else {
    if (!folderStructure.uncategorized) folderStructure.uncategorized = [];
    folderStructure.uncategorized.push({ id: docId, name: examData.title, examType: type, examData });
  }
};
