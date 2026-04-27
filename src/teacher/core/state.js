// src/teacher/core/state.js
// Teacher portal global state

// Safe parse of selected group from localStorage
let storedGroup = null;
try {
  const raw = localStorage.getItem('selectedGroup');
  if (raw && raw !== 'undefined') storedGroup = JSON.parse(raw);
} catch (e) {
  console.warn('Error parsing selectedGroup', e);
}

export const AppState = {
  role: 'teacher',
  darkMode: localStorage.getItem('darkMode') === 'true',
  currentUser: null,
  teacherProfile: null,
  selectedGroup: storedGroup,
  currentPage: 'home'
};

// Global caches and runtime structures
window.ExamCache = {};
window.unsubscribes = [];
window.folderStructure = { live: [], mock: [], uncategorized: [] };
window.currentFocusedTextarea = null;
window.questionMode = 'manual';

// Apply initial dark mode
if (AppState.darkMode) {
  document.documentElement.classList.add('theme-dark');
} else {
  document.documentElement.classList.remove('theme-dark');
}
