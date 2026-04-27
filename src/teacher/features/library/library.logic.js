// src/teacher/features/library/library.logic.js
// Library Management: folder structure, subjects, chapters, exams CRUD

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Teacher } from '../../teacher-core.js';
import { saveFolderStructureToFirebase } from '../realtime-sync/sync.logic.js';
import { DB } from '../../../shared/services/db.service.js';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let folderStructure = window.folderStructure;
let ExamCache = window.ExamCache;

// ---------- Subject Operations ----------
Teacher.createSubject = async function (type) {
  const { value: subjectName } = await Swal.fire({
    title: `Create New ${type === 'live' ? 'Live' : 'Mock'} Subject`,
    input: 'text',
    inputLabel: 'Subject Name',
    inputPlaceholder: 'Enter subject name',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) return 'You need to enter a subject name!';
      if (folderStructure[type].some(s => s.name === value)) return 'Subject already exists!';
    }
  });

  if (!subjectName) return;

  const newSubject = {
    id: `subject-${Date.now()}`,
    name: subjectName,
    type: 'subject',
    examType: type,
    children: [],
    exams: []
  };

  if (!navigator.onLine) {
    await DB.addToSyncQueue({
      collection: 'subjects',
      operation: 'add',
      payload: { ...newSubject, type },
      teacherId: AppState.currentUser?.id
    });
    folderStructure[type].push(newSubject);
    localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
    Teacher.renderFolderTree();
    Swal.fire('Offline', 'Subject saved locally.', 'info');
    return;
  }

  folderStructure[type].push(newSubject);
  await saveFolderStructureToFirebase();
  localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
  Teacher.renderFolderTree();
  Swal.fire('Success', 'Subject created successfully', 'success');
};

// ---------- Chapter Operations ----------
Teacher.addChapterToSubject = async function (subjectId, type) {
  const subject = folderStructure[type].find(s => s.id === subjectId);
  if (!subject) return;

  const { value: chapterName } = await Swal.fire({
    title: `Add Chapter to ${subject.name}`,
    input: 'text',
    inputLabel: 'Chapter Name',
    inputPlaceholder: 'Enter chapter name',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) return 'You need to enter a chapter name!';
      if (subject.children.some(c => c.name === value)) return 'Chapter already exists!';
    }
  });

  if (!chapterName) return;

  const newChapter = {
    id: `chapter-${Date.now()}`,
    name: chapterName,
    type: 'chapter',
    parent: subject.id,
    children: [],
    exams: []
  };

  if (!navigator.onLine) {
    await DB.addToSyncQueue({
      collection: 'chapters',
      operation: 'add',
      payload: { ...newChapter, type, subjectId },
      teacherId: AppState.currentUser?.id
    });
    subject.children.push(newChapter);
    localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
    Teacher.renderFolderTree();
    Swal.fire('Offline', 'Chapter saved locally.', 'info');
    return;
  }

  subject.children.push(newChapter);
  await saveFolderStructureToFirebase();
  localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
  Teacher.renderFolderTree();
  Swal.fire('Success', 'Chapter added successfully', 'success');
};

// ---------- Rename Item (subject or chapter) ----------
Teacher.renameItem = async function (itemType, itemId, currentName) {
  const { value: newName } = await Swal.fire({
    title: `Rename ${itemType}`,
    input: 'text',
    inputLabel: 'New Name',
    inputValue: currentName,
    showCancelButton: true,
    inputValidator: (value) => !value ? 'You need to enter a new name!' : null
  });

  if (!newName || newName === currentName) return;

  let found = false, targetType = '', parentId = null;

  for (const type of ['live', 'mock']) {
    if (itemType === 'subject') {
      const subject = folderStructure[type].find(s => s.id === itemId);
      if (subject) { subject.name = newName; targetType = type; found = true; break; }
    } else if (itemType === 'chapter') {
      for (const subject of folderStructure[type]) {
        const chapter = subject.children.find(c => c.id === itemId);
        if (chapter) { chapter.name = newName; targetType = type; parentId = subject.id; found = true; break; }
      }
      if (found) break;
    }
  }

  if (!found) return;

  if (!navigator.onLine) {
    await DB.addToSyncQueue({
      collection: 'rename',
      operation: 'update',
      payload: { itemType, itemId, newName, targetType, parentId },
      teacherId: AppState.currentUser?.id
    });
    localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
    Swal.fire('Offline', 'Name changed locally.', 'info');
    Teacher.foldersView();
    return;
  }

  await saveFolderStructureToFirebase();
  localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
  Swal.fire('Success', `${itemType} renamed to ${newName}`, 'success');
  Teacher.foldersView();
};

// ---------- Delete Subject / Chapter ----------
Teacher.deleteSubject = async function (subjectId, type) {
  const result = await Swal.fire({
    title: 'Delete Subject?',
    text: "This will delete all chapters and exams under this subject!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Delete Everything'
  });
  if (!result.isConfirmed) return;

  const idx = folderStructure[type].findIndex(s => s.id === subjectId);
  if (idx === -1) return;

  if (!navigator.onLine) {
    await DB.addToSyncQueue({
      collection: 'delete',
      operation: 'delete',
      payload: { itemType: 'subject', itemId: subjectId, type },
      teacherId: AppState.currentUser?.id
    });
    folderStructure[type].splice(idx, 1);
    localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
    Teacher.renderFolderTree();
    Swal.fire('Offline', 'Subject deleted locally.', 'info');
    return;
  }

  folderStructure[type].splice(idx, 1);
  await saveFolderStructureToFirebase();
  localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
  Teacher.renderFolderTree();
  Swal.fire('Deleted!', 'Subject and all contents deleted.', 'success');
};

Teacher.deleteChapter = async function (chapterId, type) {
  const result = await Swal.fire({
    title: 'Delete Chapter?',
    text: "This will delete all exams under this chapter!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Delete Everything'
  });
  if (!result.isConfirmed) return;

  for (const subject of folderStructure[type]) {
    const idx = subject.children.findIndex(c => c.id === chapterId);
    if (idx !== -1) {
      if (!navigator.onLine) {
        await DB.addToSyncQueue({
          collection: 'delete',
          operation: 'delete',
          payload: { itemType: 'chapter', itemId: chapterId, type, subjectId: subject.id },
          teacherId: AppState.currentUser?.id
        });
        subject.children.splice(idx, 1);
        localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
        Teacher.renderFolderTree();
        Swal.fire('Offline', 'Chapter deleted locally.', 'info');
        return;
      }

      subject.children.splice(idx, 1);
      await saveFolderStructureToFirebase();
      localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
      Teacher.renderFolderTree();
      Swal.fire('Deleted!', 'Chapter and all exams deleted.', 'success');
      return;
    }
  }
};

// ---------- Delete Exam ----------
Teacher.deleteExam = async function (examId) {
  const result = await Swal.fire({
    title: 'Delete Exam?',
    text: "This will delete the exam and all associated attempts!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Delete Everything'
  });
  if (!result.isConfirmed) return;

  try {
    if (!navigator.onLine) {
      await DB.addToSyncQueue({
        collection: 'delete',
        operation: 'delete',
        payload: { itemType: 'exam', itemId: examId },
        teacherId: AppState.currentUser?.id
      });
      // Remove from local state
      for (const type of ['live', 'mock']) {
        folderStructure[type].forEach(sub => {
          sub.children.forEach(chap => {
            chap.exams = chap.exams.filter(e => e.id !== examId);
          });
        });
      }
      folderStructure.uncategorized = (folderStructure.uncategorized || []).filter(e => e.id !== examId);
      delete ExamCache[examId];
      localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
      Swal.fire('Offline', 'Exam deleted locally.', 'info');
      Teacher.foldersView();
      return;
    }

    Swal.fire({ title: 'Deleting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    await deleteDoc(doc(db, "exams", examId));

    // Delete attempts
    const qAttempts = query(collection(db, "attempts"), where("examId", "==", examId));
    const snapAttempts = await getDocs(qAttempts);
    const batch = writeBatch(db);
    snapAttempts.forEach(d => batch.delete(d.ref));
    await batch.commit();

    // Remove from folderStructure
    for (const type of ['live', 'mock']) {
      folderStructure[type].forEach(sub => {
        sub.children.forEach(chap => {
          chap.exams = chap.exams.filter(e => e.id !== examId);
        });
      });
    }
    folderStructure.uncategorized = (folderStructure.uncategorized || []).filter(e => e.id !== examId);
    await saveFolderStructureToFirebase();
    localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));

    delete ExamCache[examId];
    Swal.fire('Deleted!', 'Exam deleted from everywhere.', 'success');
    Teacher.foldersView();
  } catch (error) {
    Swal.fire('Error', 'Failed to delete: ' + error.message, 'error');
  }
};

// ---------- View Exam Paper ----------
Teacher.viewPaper = async function (examId) {
  const exam = ExamCache[examId];
  if (!exam) return;

  let questions;
  try {
    questions = JSON.parse(exam.questions);
  } catch(e) {
    Swal.fire('Error', 'Invalid question format', 'error');
    return;
  }

  let html = `
    <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border max-w-3xl mx-auto">
      <h3 class="text-xl font-bold mb-4 text-center dark:text-white">${exam.title}</h3>
      <div class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
        ${exam.subject || ''} ${exam.chapter ? '• ' + exam.chapter : ''}
        ${exam.isDraft ? '<span class="text-amber-600 ml-2">• Draft</span>' : ''}
        ${exam.cancelled ? '<span class="text-red-600 ml-2">• Cancelled</span>' : ''}
      </div>`;

  questions.forEach((q, index) => {
    const qText = window.MathHelper?.renderExamContent(q.q) || q.q;
    html += `
      <div class="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-black dark:border-gray-700">
        <div class="flex justify-between items-start mb-3">
          <span class="font-bold text-indigo-600 dark:text-indigo-400">Q${index + 1}</span>
          ${q.previousYear && q.showPreviousYearInQuestion ? `<span class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">${q.previousYear}</span>` : ''}
        </div>
        <p class="font-medium mb-3 dark:text-white">${qText}</p>
        <div class="space-y-2 mb-3">
          ${q.options.map((opt, oi) => {
            const isCorrect = oi === q.correct;
            const optText = window.MathHelper?.renderExamContent(opt) || opt;
            return `
              <div class="p-2 rounded border ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}">
                <span class="font-bold ${isCorrect ? 'text-emerald-600' : 'text-gray-500'}">${String.fromCharCode(65 + oi)}.</span>
                <span class="${isCorrect ? 'font-bold text-emerald-700 dark:text-emerald-300' : 'dark:text-gray-300'}">${optText}</span>
                ${isCorrect ? '<i class="fas fa-check float-right text-emerald-600"></i>' : ''}
              </div>`;
          }).join('')}
        </div>
        ${q.expl ? `<div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-800">
          <span class="font-bold text-blue-700 dark:text-blue-300 text-sm">Explanation:</span>
          <p class="text-sm mt-1 dark:text-blue-200">${window.MathHelper?.renderExamContent(q.expl) || q.expl}</p>
        </div>` : ''}
      </div>`;
  });

  html += `</div>`;

  document.getElementById('app-container').innerHTML = `
    <div class="pb-6">
      <button onclick="Teacher.foldersView()" class="mb-4 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <i class="fas fa-arrow-left"></i> Back to Library
      </button>
      ${html}
    </div>`;

  window.loadMathJax?.(null, document.getElementById('app-container'));
};

// ---------- Take Exam Now (Draft → Live) ----------
Teacher.takeExamNow = async function (examId) {
  const exam = ExamCache[examId];
  if (!exam) return;

  const rankQuery = query(collection(db, "attempts"), where("examId", "==", examId));
  const rankSnap = await getDocs(rankQuery);
  const hasRank = !rankSnap.empty;

  const { value: formValues } = await Swal.fire({
    title: 'Schedule Exam',
    html: `
      <div class="text-left">
        <label class="text-xs font-bold">Start Time</label>
        <input id="sw-st" type="datetime-local" class="swal2-input">
        <label class="text-xs font-bold">End Time</label>
        <input id="sw-et" type="datetime-local" class="swal2-input">
        ${hasRank ? `
        <div class="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p class="text-xs font-bold mb-2">Rank List Option:</p>
          <label class="flex items-center gap-2 text-xs mb-2">
            <input type="radio" name="rank-opt" value="merge" checked>
            Merge with existing ranking
          </label>
          <label class="flex items-center gap-2 text-xs">
            <input type="radio" name="rank-opt" value="new">
            Clear previous ranks and start new
          </label>
        </div>` : ''}
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Confirm & Go Live',
    preConfirm: () => {
      const rankOpt = document.querySelector('input[name="rank-opt"]:checked')?.value || 'new';
      return [document.getElementById('sw-st').value, document.getElementById('sw-et').value, rankOpt];
    }
  });

  if (!formValues) return;

  const [startTime, endTime, rankOpt] = formValues;
  if (!startTime || !endTime) { Swal.fire('Error', 'Time required', 'error'); return; }

  try {
    if (rankOpt === 'new' && hasRank) {
      const batch = writeBatch(db);
      rankSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    await updateDoc(doc(db, "exams", examId), {
      startTime, endTime,
      isDraft: false,
      cancelled: false,
      resultPublished: false,
      updatedAt: new Date()
    });

    await Teacher.syncFolderExamData(examId, { isDraft: false, resultPublished: false, cancelled: false, startTime, endTime });
    Swal.fire('Success', 'Exam is now LIVE', 'success').then(() => Teacher.foldersView());
  } catch (e) {
    Swal.fire('Error', e.message, 'error');
  }
};
