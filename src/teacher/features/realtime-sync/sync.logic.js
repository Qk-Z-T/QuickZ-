// src/teacher/features/realtime-sync/sync.logic.js
// Real-time sync for folder structure and exams, and save to Firestore

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import {
  collection, query, where, onSnapshot, doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let unsubscribes = window.unsubscribes;
let folderStructure = window.folderStructure;
let ExamCache = window.ExamCache;

// UI update helper
function updateUIRendering() {
  const page = AppState.currentPage;
  const Teacher = window.Teacher;
  if (!Teacher) return;

  try {
    switch (page) {
      case 'home':
        if (typeof Teacher.homeView === 'function') Teacher.homeView();
        break;
      case 'folders':
        if (typeof Teacher.renderFolderTree === 'function') Teacher.renderFolderTree();
        if (typeof Teacher.renderUncategorizedExams === 'function') Teacher.renderUncategorizedExams();
        break;
      case 'rank':
        if (typeof Teacher.rankView === 'function') Teacher.rankView();
        break;
      case 'management':
        if (typeof Teacher.liveExamManagementView === 'function') Teacher.liveExamManagementView();
        break;
      // create page no auto-refresh needed
    }
  } catch (error) {
    console.error('UI update error:', error);
  }
}

export async function saveFolderStructureToFirebase() {
  if (!AppState.currentUser || !AppState.selectedGroup) return;
  try {
    const folderDocRef = doc(db, "folderStructures", `${AppState.currentUser.id}_${AppState.selectedGroup.id}`);
    await setDoc(folderDocRef, {
      ...folderStructure,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Folder Sync Error:", error);
  }
}

export function initRealTimeSync() {
  if (!AppState.selectedGroup || !AppState.currentUser) return;
  clearListeners();

  // Folder structure listener
  const folderDocRef = doc(db, "folderStructures", `${AppState.currentUser.id}_${AppState.selectedGroup.id}`);
  const unsubFolders = onSnapshot(folderDocRef, (docSnap) => {
    if (docSnap.exists()) {
      folderStructure = docSnap.data();
    } else {
      folderStructure = { live: [], mock: [], uncategorized: [] };
    }
    window.folderStructure = folderStructure;
    localStorage.setItem('offlineFolderStructure_' + AppState.selectedGroup.id, JSON.stringify(folderStructure));
    updateUIRendering();
  }, (error) => {
    console.error('Folder snapshot error:', error);
  });
  unsubscribes.push(unsubFolders);

  // Exams listener
  const q = query(
    collection(db, "exams"),
    where("groupId", "==", AppState.selectedGroup.id)
  );
  const unsubExams = onSnapshot(q, (snap) => {
    ExamCache = {};
    snap.forEach(d => {
      ExamCache[d.id] = { id: d.id, ...d.data() };
    });
    window.ExamCache = ExamCache;
    updateUIRendering();
  }, (error) => {
    console.error('Exams snapshot error:', error);
  });
  unsubscribes.push(unsubExams);
}

export function clearListeners() {
  unsubscribes.forEach(u => u());
  unsubscribes = [];
  window.unsubscribes = unsubscribes;
}

// Expose globally
window.saveFolderStructureToFirebase = saveFolderStructureToFirebase;
window.initRealTimeSync = initRealTimeSync;
window.clearListeners = clearListeners;
