// src/student/core/state.js
// Student portal global state

export const AppState = {
  role: 'student',
  user: null,
  userDisabled: false,
  profileCompleted: false,
  userProfile: null,

  teacherCodes: [],
  teacherNames: {},
  activeTeacherCode: null,

  groupCode: null,
  hasGroupCode: false,
  joinedGroups: [],
  activeGroupId: localStorage.getItem('activeGroupId') || null,

  classLevel: localStorage.getItem('studentClassLevel') || '',
  admissionStream: localStorage.getItem('studentAdmissionStream') || '',

  // NEW - per-group unread notice counts
  unreadNoticeCounts: {}
};

// Runtime caches
export let ExamCache = {};
export let unsubscribes = [];

// Result viewer state
export let currentResultPage = 1;
export let resultFilter = 'all';
export let filteredQuestions = [];
export let resultTypeFilter = 'live';
export let pastSubjectFilter = 'all';
export let resultsSubjectFilter = 'all';

// Mock context
export let lastMockContext = { subject: null, chapter: null, teacherId: null };

// Search queries
export let pastLiveExamSearchQuery = '';
export let liveExamSearchQuery = '';
export let rankSearchQuery = '';
export let allRankAttempts = [];

// Route tracking
export let currentRouteId = 0;

// Helper: clear all Firestore listeners
export function clearListeners() {
  unsubscribes.forEach(u => u());
  unsubscribes = [];
}

// Helper: debounce
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Helper: toggle mobile drawer
export function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const body = document.body;

  if (!drawer) return;

  const isClosed = drawer.classList.contains('translate-x-full');

  if (isClosed) {
    drawer.classList.remove('translate-x-full');
    drawer.classList.add('translate-x-0');
    if (overlay) overlay.classList.remove('hidden');
    body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('translate-x-0');
    drawer.classList.add('translate-x-full');
    if (overlay) overlay.classList.add('hidden');
    body.style.overflow = '';
  }
}

// Star rating helper
export function StarRating(percentage) {
  const fullStars = Math.floor(percentage / 20);
  const halfStar = (percentage % 20) >= 10 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  let html = '';
  for (let i = 0; i < fullStars; i++) html += '<i class="fas fa-star text-yellow-400"></i>';
  if (halfStar) html += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
  for (let i = 0; i < emptyStars; i++) html += '<i class="far fa-star text-yellow-400"></i>';
  return `<div class="flex items-center gap-1 text-sm star-rating">${html}</div>`;
}

// Update exam cache via Firestore snapshot
export function refreshExamCache() {
  clearListeners();
  if (!AppState.activeGroupId) {
    ExamCache = {};
    return;
  }

  import("../../shared/config/firebase.js").then(({ db }) => {
    import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js").then(
      ({ collection, query, where, onSnapshot }) => {
        const q = query(collection(db, "exams"), where("groupId", "==", AppState.activeGroupId));
        const unsub = onSnapshot(q, (snap) => {
          ExamCache = {};
          const cacheObj = {};
          snap.forEach(d => {
            ExamCache[d.id] = { id: d.id, ...d.data() };
            cacheObj[d.id] = ExamCache[d.id];
          });
          localStorage.setItem('offlineExamCache_' + AppState.activeGroupId, JSON.stringify(cacheObj));
        });
        unsubscribes.push(unsub);
      }
    );
  });
}

// Export globals
window.toggleMobileDrawer = toggleMobileDrawer;
window.StarRating = StarRating;
window.refreshExamCache = refreshExamCache;
window.AppState = AppState;
