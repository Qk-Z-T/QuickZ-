// src/teacher/core/auth.js
// Teacher authentication (custom Firestore-based)

import { db } from '../../shared/config/firebase.js';
import { AppState } from './state.js';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

export const AuthUI = {
  togglePass(id, el) {
    const i = document.getElementById(id);
    if (i.type === 'password') { i.type = 'text'; el.classList.remove('fa-eye'); el.classList.add('fa-eye-slash'); }
    else { i.type = 'password'; el.classList.remove('fa-eye-slash'); el.classList.add('fa-eye'); }
  },

  showLoginLoading(btnId) {
    const btn = document.getElementById(btnId);
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  },

  hideLoginLoading(btnId) {
    const btn = document.getElementById(btnId);
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  }
};

export const Auth = {
  async teacherLogin() {
    AuthUI.showLoginLoading('teacher-login-btn');
    const email = document.getElementById('t-email').value.trim();
    const password = document.getElementById('t-pass').value.trim();

    if (!email || !password) {
      AuthUI.hideLoginLoading('teacher-login-btn');
      Swal.fire('Error', 'Please enter email and password', 'error');
      return;
    }

    try {
      const teachersQuery = query(collection(db, "teachers"), where("email", "==", email));
      const querySnapshot = await getDocs(teachersQuery);

      if (querySnapshot.empty) {
        AuthUI.hideLoginLoading('teacher-login-btn');
        Swal.fire('Error', 'Teacher not found. Please contact admin.', 'error');
        return;
      }

      let teacherFound = false;
      let teacherData = null;
      let teacherId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.password === password) {
          teacherFound = true;
          teacherData = data;
          teacherId = doc.id;
        }
      });

      if (teacherFound) {
        if (teacherData.disabled) {
          AuthUI.hideLoginLoading('teacher-login-btn');
          Swal.fire('Account Disabled', 'Your account has been disabled by admin.', 'error');
          return;
        }

        AppState.role = 'teacher';
        AppState.currentUser = { id: teacherId, ...teacherData };
        AuthUI.hideLoginLoading('teacher-login-btn');
        Auth.finalizeTeacher();
      } else {
        AuthUI.hideLoginLoading('teacher-login-btn');
        Swal.fire('Error', 'Invalid email or password', 'error');
      }
    } catch (e) {
      AuthUI.hideLoginLoading('teacher-login-btn');
      Swal.fire('Error', 'Connection Error: ' + e.message, 'error');
    }
  },

  /**
   * Load teacher profile from Firestore. If not found, create one.
   * Waits for Firebase auth to be ready.
   */
  async loadTeacherProfile(uid) {
    try {
      // Wait for auth to be ready if needed
      const auth = getAuth();
      
      // If no currentUser, wait a bit and try again
      if (!auth.currentUser) {
        console.log('Waiting for Firebase auth to be ready...');
        // Wait up to 5 seconds
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (auth.currentUser) break;
        }
      }

      // Try to load from Firestore
      const docRef = doc(db, "teachers", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        AppState.currentUser = { id: docSnap.id, ...data };
        localStorage.setItem('teacher_data', JSON.stringify(AppState.currentUser));
        return AppState.currentUser;
      } else {
        // Document not found - create one
        console.log('Teacher document not found. Creating new teacher profile...');
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user found. Please ensure you are logged in.');
        }

        // Get email from Firebase user
        const email = user.email || '';
        const displayName = user.displayName || email.split('@')[0] || 'Teacher';

        // Create teacher document
        const teacherData = {
          uid: uid,
          email: email,
          fullName: displayName,
          phone: '',
          password: '', // Not stored - use Firebase Auth
          profileCompleted: false,
          disabled: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(docRef, teacherData);
        AppState.currentUser = { id: uid, ...teacherData };
        localStorage.setItem('teacher_data', JSON.stringify(AppState.currentUser));
        return AppState.currentUser;
      }
    } catch (error) {
      console.error('loadTeacherProfile error:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('teacher_data');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.id === uid || parsed.uid === uid) {
            AppState.currentUser = parsed;
            return parsed;
          }
        } catch (e) {
          console.warn('Invalid cached teacher data');
        }
      }
      
      throw error;
    }
  },

  finalizeTeacher() {
    localStorage.setItem('explicit_logout', 'false');
    localStorage.setItem('teacher_sess', 'true');
    localStorage.setItem('teacher_email', AppState.currentUser.email);
    localStorage.setItem('teacher_data', JSON.stringify(AppState.currentUser));

    if (!AppState.currentUser.fullName || !AppState.currentUser.phone) {
      if (window.Router && typeof Router.showTeacherProfileForm === 'function') {
        Router.showTeacherProfileForm();
      }
    } else {
      if (window.Router && typeof Router.initTeacher === 'function') {
        Router.initTeacher();
      }
    }
  },

  async reloadTeacherSession() {
    const storedData = localStorage.getItem('teacher_data');
    if (!storedData) {
      document.getElementById('auth-screen').classList.add('show');
      return;
    }

    try {
      const teacherData = JSON.parse(storedData);
      const docRef = doc(db, "teachers", teacherData.id || teacherData.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        AppState.role = 'teacher';
        AppState.currentUser = { id: docSnap.id, ...docSnap.data() };

        if (!AppState.currentUser.fullName || !AppState.currentUser.phone) {
          if (window.Router && typeof Router.showTeacherProfileForm === 'function') {
            Router.showTeacherProfileForm();
          }
          return;
        }

        const lastGroupId = localStorage.getItem('selectedGroup');
        if (lastGroupId && lastGroupId !== 'undefined') {
          AppState.selectedGroup = JSON.parse(lastGroupId);
        }

        if (typeof window.initRealTimeSync === 'function') window.initRealTimeSync();
        if (window.Router && typeof Router.initTeacher === 'function') Router.initTeacher();
      } else {
        // Fallback: use cached data
        AppState.role = 'teacher';
        AppState.currentUser = teacherData;
        const lastGroupId = localStorage.getItem('selectedGroup');
        if (lastGroupId && lastGroupId !== 'undefined') {
          AppState.selectedGroup = JSON.parse(lastGroupId);
        }
        if (window.Router && typeof Router.initTeacher === 'function') Router.initTeacher();
      }
    } catch (e) {
      console.error("Session Error:", e);
      if (navigator.onLine) {
        Auth.logout();
      } else {
        const cached = localStorage.getItem('teacher_data');
        if (cached) {
          AppState.currentUser = JSON.parse(cached);
          if (window.Router && typeof Router.initTeacher === 'function') Router.initTeacher();
        }
      }
    }
  },

  async confirmLogout() {
    const result = await Swal.fire({
      title: 'Confirm Logout',
      text: "Are you sure you want to logout?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) Auth.logout();
  },

  async logout() {
    localStorage.setItem('explicit_logout', 'true');
    if (typeof window.clearListeners === 'function') window.clearListeners();

    localStorage.removeItem('teacher_sess');
    localStorage.removeItem('teacher_email');
    localStorage.removeItem('teacher_data');
    localStorage.removeItem('selectedGroup');
    localStorage.removeItem('folderStructure');

    AppState.role = null;
    AppState.currentUser = null;
    AppState.selectedGroup = null;

    try {
      const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js");
      const auth = getAuth();
      await signOut(auth);
    } catch (e) { /* offline fallback */ }
    location.reload();
  }
};

// Expose globally
window.AuthUI = AuthUI;
window.Auth = Auth;
