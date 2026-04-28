// src/student/app.js
// Student portal entry point – auth state observer, global error handler, boot logic

import { auth, db } from '../shared/config/firebase.js';
import { AppState, refreshExamCache, clearListeners } from './core/state.js';
import { Auth, AuthUI } from './core/auth.js';
import { Router } from './core/router.js';
import { StudentDashboard } from './features/dashboard/dashboard.logic.js';
import { OfflineSync } from '../shared/services/offline-sync.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ---------- Global exposure for inline HTML handlers ----------
window.AppState = AppState;
window.Auth = Auth;
window.AuthUI = AuthUI;
window.Router = Router;
window.StudentDashboard = StudentDashboard;

// ---------- Review panel toggle ----------
document.getElementById('review-panel-btn')?.addEventListener('click', () => {
  document.getElementById('review-panel')?.classList.toggle('show');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#review-panel') && !e.target.closest('#review-panel-btn')) {
    document.getElementById('review-panel')?.classList.remove('show');
  }
});

// ---------- Global error handler ----------
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

// ---------- Offline sync init ----------
window.addEventListener('load', () => {
  OfflineSync.init();
});

// ---------- Fast boot: check cached login ----------
const cachedUserLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
if (cachedUserLoggedIn) {
  document.getElementById('splash-screen')?.classList.add('hidden');
  document.getElementById('app-container')?.classList.remove('hidden');
}

// ---------- Auth state observer ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in → show auth screen
    AuthUI.showAuthScreen();
    document.getElementById('splash-screen')?.classList.add('hidden');
    localStorage.removeItem('userLoggedIn');
    return;
  }

  try {
    // 1. Fetch latest student profile from Firestore
    const userDocRef = doc(db, "students", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let userData = null;
    if (userDocSnap.exists()) {
      userData = userDocSnap.data();
      localStorage.setItem('userProfile', JSON.stringify(userData));
    } else {
      // No document – check local cache (new account?)
      const cached = localStorage.getItem('userProfile');
      if (cached) {
        userData = JSON.parse(cached);
      } else {
        // Create new document
        userData = {
          uid: user.uid,
          email: user.email,
          name: "",
          phone: "",
          fatherPhone: "",
          motherPhone: "",
          schoolName: "",
          collegeName: "",
          teacherCodes: [],
          groupCode: "",
          joinedGroups: [],
          profileCompleted: false,
          blocked: false,
          disabled: false,
          joined: new Date()
        };
        await setDoc(userDocRef, userData);
        localStorage.setItem('userProfile', JSON.stringify(userData));
      }
    }

    // 2. Check blocked
    if (userData.blocked) {
      await signOut(auth);
      Swal.fire('ব্লক', 'আপনার অ্যাকাউন্ট ব্লক করা আছে।', 'error');
      AuthUI.showAuthScreen();
      document.getElementById('splash-screen')?.classList.add('hidden');
      return;
    }

    // 3. Update AppState
    AppState.user = user;
    AppState.userDisabled = userData.disabled || false;
    AppState.profileCompleted = userData.profileCompleted || false;
    AppState.userProfile = userData;
    AppState.teacherCodes = userData.teacherCodes || [];
    AppState.activeTeacherCode = AppState.teacherCodes.find(tc => tc.active)?.code || null;
    AppState.joinedGroups = userData.joinedGroups || [];

    // 4. Restore active group
    const storedGroupId = localStorage.getItem('activeGroupId');
    if (storedGroupId && AppState.joinedGroups.find(g => g.groupId === storedGroupId)) {
      AppState.activeGroupId = storedGroupId;
    } else if (AppState.joinedGroups.length > 0) {
      AppState.activeGroupId = AppState.joinedGroups[0].groupId;
      localStorage.setItem('activeGroupId', AppState.activeGroupId);
    } else {
      AppState.activeGroupId = null;
    }

    // 5. Load teacher names
    if (AppState.teacherCodes.length > 0) {
      await loadTeacherNames();
    }

    // 6. Route based on profile completeness
    if (!AppState.profileCompleted) {
      Router.showProfileForm();
    } else {
      await Router.initStudent();
    }
  } catch (error) {
    console.error('Auth state error:', error);
    // Fallback: use local cache if available
    const cached = localStorage.getItem('userProfile');
    if (cached) {
      const cachedData = JSON.parse(cached);
      if (!cachedData.blocked) {
        AppState.user = user;
        AppState.userDisabled = cachedData.disabled || false;
        AppState.profileCompleted = cachedData.profileCompleted || false;
        AppState.userProfile = cachedData;
        AppState.teacherCodes = cachedData.teacherCodes || [];
        AppState.activeTeacherCode = AppState.teacherCodes.find(tc => tc.active)?.code || null;
        AppState.joinedGroups = cachedData.joinedGroups || [];
        // Restore active group again
        const sg = localStorage.getItem('activeGroupId');
        if (sg && AppState.joinedGroups.find(g => g.groupId === sg)) {
          AppState.activeGroupId = sg;
        } else if (AppState.joinedGroups.length > 0) {
          AppState.activeGroupId = AppState.joinedGroups[0].groupId;
          localStorage.setItem('activeGroupId', AppState.activeGroupId);
        }

        if (AppState.teacherCodes.length > 0) await loadTeacherNames();

        if (!AppState.profileCompleted) Router.showProfileForm();
        else Router.initStudent();
        document.getElementById('splash-screen')?.classList.add('hidden');
        return;
      }
    }
    AuthUI.showAuthScreen();
  }

  document.getElementById('splash-screen')?.classList.add('hidden');
});

// ---------- Fallback: if auth observer delayed, hide splash after 3s ----------
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash && !splash.classList.contains('hidden')) {
    splash.classList.add('hidden');
    AuthUI.showAuthScreen();
  }
}, 3000);

// ---------- Helper: load teacher names ----------
async function loadTeacherNames() {
  try {
    const teacherNames = {};
    const { collection, query, where, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
    );
    for (const tc of AppState.teacherCodes) {
      const q = query(collection(db, "teachers"), where("teacherCode", "==", tc.code));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        teacherNames[tc.code] = data.fullName || data.name || 'Unknown Teacher';
      } else {
        teacherNames[tc.code] = 'Unknown Teacher';
      }
    }
    AppState.teacherNames = teacherNames;
  } catch (e) {
    console.error('Failed to load teacher names:', e);
  }
}
