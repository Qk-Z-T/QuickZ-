// src/teacher/core/auth.js
// Teacher authentication (custom Firestore-based)

import { db } from '../../shared/config/firebase.js';
import { AppState } from './state.js';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
        Swal.fire('Error', 'Teacher not found', 'error');
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
      const docRef = doc(db, "teachers", teacherData.id);
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
        Auth.logout();
      }
    } catch (e) {
      console.error("Session Error:", e);
      Auth.logout();
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
