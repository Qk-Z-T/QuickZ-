// src/teacher/app.js
// Teacher portal entry point

import { AppState } from './core/state.js';
import { Auth, AuthUI } from './core/auth.js';
import { Router } from './core/router.js';
import { Teacher } from './teacher-core.js';
import { initRealTimeSync, clearListeners } from './features/realtime-sync/sync.logic.js';
import { OfflineSync } from '../shared/services/offline-sync.js';
import { DashboardLogic } from './features/dashboard/dashboard.logic.js';

// Attach dashboard methods to Teacher
Teacher.homeView = DashboardLogic.homeView;
Teacher.renderActiveLiveExamOnHome = DashboardLogic.renderActiveLiveExamOnHome;
Teacher.generatePermissionKeyFromHome = DashboardLogic.generatePermissionKeyFromHome;
Teacher.quickEditJoinMethod = DashboardLogic.quickEditJoinMethod;
Teacher.copyPermissionKey = DashboardLogic.copyPermissionKey;

// Feature modules
import './features/exam-create/create.logic.js';
import './features/exam-create/create.view.js';
import './features/library/library.logic.js';
import './features/library/library.view.js';
import './features/rankings/rankings.logic.js';
import './features/rankings/rankings.view.js';
import './features/management/management.logic.js';
import './features/management/management.view.js';
import './features/notice-poll/notice.logic.js';
import './features/notice-poll/notice.view.js';
import './features/groups/groups.logic.js';
import './features/groups/groups.view.js';
import './features/profile/profile.logic.js';
import './features/profile/profile.view.js';
import './features/math-editor/editor.logic.js'; // ✅ এটা থাকা আবশ্যক

// ---------- Globals ----------
window.AppState = AppState;
window.Router = Router;
window.Teacher = Teacher;
window.AuthUI = AuthUI;
window.Auth = Auth;
window.clearListeners = clearListeners;
window.initRealTimeSync = initRealTimeSync;

// Caches and runtime globals
if (!window.ExamCache) window.ExamCache = {};
if (!window.unsubscribes) window.unsubscribes = [];
if (!window.folderStructure) window.folderStructure = { live: [], mock: [], uncategorized: [] };
window.currentFocusedTextarea = null;
window.questionMode = 'manual';

// Dark mode
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('theme-dark');
  AppState.darkMode = true;
} else {
  document.documentElement.classList.remove('theme-dark');
  AppState.darkMode = false;
}

// Fast boot from cache
const cachedTeacherData = localStorage.getItem('teacher_data');
const isExplicitLogout = localStorage.getItem('explicit_logout') === 'true';

if (cachedTeacherData && !isExplicitLogout) {
  console.log('⚡ Fast Booting Teacher from Local Storage...');
  try {
    const parsed = JSON.parse(cachedTeacherData);
    AppState.currentUser = parsed;
    AppState.user = { uid: parsed.id || parsed.uid };
    hideSplash();
    if (AppState.currentUser && (AppState.currentUser.id || AppState.currentUser.uid)) {
      initRealTimeSync();
      Router.initTeacher();
    } else {
      localStorage.removeItem('teacher_data');
    }
  } catch (e) {
    console.warn('Invalid cached teacher data:', e);
    localStorage.removeItem('teacher_data');
  }
}

// Firebase auth observer
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
const auth = getAuth();

const fallbackTimer = setTimeout(() => {
  hideSplash();
  if (!AppState.currentUser) Router.showLogin();
}, 3000);

onAuthStateChanged(auth, async (user) => {
  clearTimeout(fallbackTimer);
  if (user) {
    localStorage.setItem('explicit_logout', 'false');
    AppState.user = user;
    if (!AppState.currentUser || AppState.currentUser.id !== user.uid) {
      try {
        const cached = localStorage.getItem('teacher_data');
        let teacherCached = null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.id === user.uid || parsed.uid === user.uid) {
              teacherCached = parsed;
              AppState.currentUser = parsed;
            }
          } catch(e) {}
        }
        if (navigator.onLine && !teacherCached) {
          try {
            await Auth.loadTeacherProfile(user.uid);
          } catch (e) {
            console.warn('Firestore teacher profile load failed:', e.message);
            if (cached && !teacherCached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed.uid === user.uid || parsed.id === user.uid) {
                  AppState.currentUser = parsed;
                }
              } catch(e) {}
            }
          }
        } else if (!navigator.onLine && teacherCached) {
          console.log('Offline mode: using cached teacher data');
        }
      } catch (e) {
        console.error('Profile load error:', e);
      }
    }
    if (AppState.currentUser && (AppState.currentUser.id || AppState.currentUser.uid)) {
      initRealTimeSync();
      Router.initTeacher();
      hideSplash();
    } else {
      Router.showLogin();
      hideSplash();
    }
  } else {
    const explicit = localStorage.getItem('explicit_logout') === 'true';
    if (explicit) {
      AppState.user = null;
      AppState.currentUser = null;
      Router.showLogin();
      hideSplash();
    } else {
      console.warn('🛡️ Blocked Firebase Auto-Logout. Keeping session alive.');
      if (!AppState.currentUser) {
        Router.showLogin();
        hideSplash();
      }
    }
  }
});

// Offline sync
window.addEventListener('load', () => {
  OfflineSync.init();
});

// Global click handlers
document.addEventListener('click', (e) => {
  if (!e.target.closest('.three-dot-menu') && !e.target.closest('.dot-menu-dropdown')) {
    document.querySelectorAll('.dot-menu-dropdown').forEach(d => d.classList.remove('show'));
  }
  if (!e.target.closest('#math-symbols-panel') && !e.target.closest('#floating-math-btn')) {
    const panel = document.getElementById('math-symbols-panel');
    if (panel) panel.classList.remove('show');
  }
  if (!e.target.closest('.group-switcher')) {
    const dropdown = document.getElementById('group-switcher-dropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
  if (!e.target.closest('.student-three-dot-menu')) {
    document.querySelectorAll('.student-dot-menu-dropdown').forEach(d => d.classList.remove('show'));
  }
});

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (splash && !splash.classList.contains('splash-hidden')) {
    splash.classList.add('splash-hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 300);
  }
}
