// src/student/features/management/management.logic.js
// Account management: teacher codes, groups, password change, logout

import { auth, db } from '../../../shared/config/firebase.js';
import { AppState, refreshExamCache } from '../../core/state.js';
import { Router } from '../../core/router.js';
import { DB } from '../../../shared/services/db.service.js';
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export const ManagementManager = {
  async load() {
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;
    contentEl.innerHTML = `<div class="p-5 pb-20 max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-4 text-center">ম্যানেজমেন্ট</h2>
      <div class="p-6 rounded-2xl shadow-sm border bg-white dark:bg-gray-800 space-y-6">
        <div id="teacher-section"></div>
        <div id="groups-section"></div>
        <div id="password-section"></div>
        <button onclick="Auth.confirmLogout()" class="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition">লগআউট</button>
      </div>
    </div>`;

    await this.renderTeacherCodes();
    await this.renderJoinedGroups();
    this.renderPasswordChange();
  },

  async renderTeacherCodes() {
    const container = document.getElementById('teacher-section');
    if (!container) return;

    const teacherCodes = AppState.teacherCodes || [];
    await this._loadTeacherNames();

    let html = `<div class="flex justify-between items-center mb-3">
      <h3 class="font-bold text-lg">শিক্ষক অ্যাকাউন্ট</h3>
      <button onclick="ManagementManager.addTeacherCode()" class="text-sm bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg font-bold">
        <i class="fas fa-plus mr-1"></i> যোগ করুন
      </button>
    </div>`;

    if (teacherCodes.length === 0) {
      html += `<div class="alert-message alert-warning">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        কোনো শিক্ষক অ্যাকাউন্ট যোগ করা হয়নি। পরীক্ষা দেখতে অন্তত একটি শিক্ষক অ্যাকাউন্ট প্রয়োজন।
      </div>`;
    } else {
      const activeTeacher = teacherCodes.find(tc => tc.active);
      const activeName = activeTeacher ? this._getTeacherName(activeTeacher.code) : 'শিক্ষক নির্বাচন করুন';
      html += `
        <div class="relative teacher-switcher mb-4">
          <button onclick="document.getElementById('teacher-drop').classList.toggle('hidden')" class="flex items-center justify-between w-full px-4 py-3 rounded-xl text-indigo-600 font-bold text-sm transition border border-indigo-100 bg-white dark:bg-gray-700">
            <div class="flex items-center gap-2">
              <i class="fas fa-chalkboard-teacher"></i>
              <span>${activeName}</span>
              ${activeTeacher ? '<span class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">সক্রিয়</span>' : ''}
            </div>
            <i class="fas fa-chevron-down text-xs"></i>
          </button>
          <div id="teacher-drop" class="hidden absolute top-12 left-0 w-full bg-white dark:bg-gray-700 border rounded-xl shadow-xl z-50 overflow-hidden mt-1">
            ${teacherCodes.map(tc => {
              const name = this._getTeacherName(tc.code);
              return `
                <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer text-sm border-b flex justify-between items-center ${tc.active ? 'bg-indigo-50 dark:bg-indigo-900' : ''}">
                  <div class="flex-1" onclick="ManagementManager.switchTeacherCode('${tc.code}')">${name}</div>
                  ${teacherCodes.length > 1 ? `<button onclick="ManagementManager.confirmDeleteTeacher('${tc.code}')" class="delete-teacher-btn ml-2" title="মুছুন"><i class="fas fa-trash text-red-500"></i></button>` : ''}
                  ${tc.active ? '<i class="fas fa-check text-green-500"></i>' : ''}
                </div>`;
            }).join('')}
            <div onclick="ManagementManager.addTeacherCode()" class="p-3 text-indigo-600 font-bold text-center text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-600 border-t">
              <i class="fas fa-plus-circle mr-1"></i> নতুন শিক্ষক যোগ করুন
            </div>
          </div>
        </div>`;
    }
    container.innerHTML = html;
  },

  async renderJoinedGroups() {
    const container = document.getElementById('groups-section');
    if (!container) return;

    const joinedGroups = AppState.joinedGroups || [];
    let html = `<div class="flex justify-between items-center mb-3">
      <h3 class="font-bold text-lg">আমার কোর্স</h3>
      <button onclick="Router.student('courses')" class="text-sm bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg font-bold">
        <i class="fas fa-plus mr-1"></i> নতুন কোর্স খুঁজুন
      </button>
    </div>
    <div class="space-y-2">`;

    if (joinedGroups.length === 0) {
      html += '<p class="text-gray-400 text-sm">আপনি কোনো কোর্সে জয়েন করেননি।</p>';
    } else {
      joinedGroups.forEach(group => {
        const isActive = group.groupId === AppState.activeGroupId;
        html += `
          <div class="p-3 rounded-xl mb-2 flex justify-between items-center border bg-gray-50 dark:bg-gray-700">
            <div class="font-bold text-sm">${group.groupName || 'অজানা কোর্স'}</div>
            <div class="flex gap-2">
              ${!isActive ? `<button onclick="ManagementManager.switchGroup('${group.groupId}')" class="text-xs bg-indigo-500 text-white px-2 py-1 rounded">সুইচ</button>` : '<span class="text-xs bg-green-500 text-white px-2 py-1 rounded">সক্রিয়</span>'}
              <button onclick="ManagementManager.confirmLeaveGroup('${group.groupId}')" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">ত্যাগ</button>
            </div>
          </div>`;
      });
    }
    html += `</div>`;
    container.innerHTML = html;
  },

  renderPasswordChange() {
    const container = document.getElementById('password-section');
    if (!container) return;
    container.innerHTML = `
      <div class="change-password-dropdown pt-4 border-t">
        <div id="password-header" class="flex justify-between items-center cursor-pointer p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border" onclick="ManagementManager.togglePasswordForm()">
          <div class="flex items-center gap-2"><i class="fas fa-key text-indigo-500"></i><span class="font-bold">পাসওয়ার্ড পরিবর্তন</span></div>
          <i id="password-chevron" class="fas fa-chevron-down text-gray-400"></i>
        </div>
        <div id="password-form" class="overflow-hidden transition-all max-h-0 mt-3 space-y-3">
          <div>
            <label class="form-label">বর্তমান পাসওয়ার্ড</label>
            <div class="relative">
              <input type="password" id="current-password" class="form-input" placeholder="বর্তমান পাসওয়ার্ড">
              <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('current-password', this)"></i>
            </div>
          </div>
          <div>
            <label class="form-label">নতুন পাসওয়ার্ড</label>
            <div class="relative">
              <input type="password" id="new-password" class="form-input" placeholder="নতুন পাসওয়ার্ড">
              <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('new-password', this)"></i>
            </div>
          </div>
          <div>
            <label class="form-label">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
            <div class="relative">
              <input type="password" id="confirm-password" class="form-input" placeholder="পুনরায় লিখুন">
              <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('confirm-password', this)"></i>
            </div>
          </div>
          <button onclick="ManagementManager.changePassword()" class="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">পাসওয়ার্ড পরিবর্তন</button>
        </div>
      </div>`;
  },

  togglePasswordForm() {
    const form = document.getElementById('password-form');
    const chevron = document.getElementById('password-chevron');
    if (!form || !chevron) return;
    if (form.style.maxHeight === '0px' || !form.style.maxHeight) {
      form.style.maxHeight = '400px';
      chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
      form.style.maxHeight = '0px';
      chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
  },

  async changePassword() {
    const curr = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const conf = document.getElementById('confirm-password').value;

    if (!curr || !newPass || !conf) return Swal.fire('ত্রুটি', 'সব ঘর পূরণ করুন', 'error');
    if (newPass !== conf) return Swal.fire('ত্রুটি', 'নতুন পাসওয়ার্ড মিলছে না', 'error');
    if (newPass.length < 6) return Swal.fire('ত্রুটি', 'পাসওয়ার্ড অন্তত ৬ অক্ষরের', 'error');
    if (!navigator.onLine) return Swal.fire('অফলাইন', 'অফলাইনে পাসওয়ার্ড পরিবর্তন করা যাবে না', 'warning');

    try {
      const { signInWithEmailAndPassword, updatePassword } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js");
      await signInWithEmailAndPassword(auth, auth.currentUser.email, curr);
      await updatePassword(auth.currentUser, newPass);
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      this.togglePasswordForm();
      Swal.fire('সফল', 'পাসওয়ার্ড পরিবর্তন হয়েছে!', 'success');
    } catch (e) {
      if (e.code === 'auth/wrong-password') Swal.fire('ত্রুটি', 'বর্তমান পাসওয়ার্ড ভুল', 'error');
      else Swal.fire('ত্রুটি', 'পাসওয়ার্ড পরিবর্তন ব্যর্থ', 'error');
    }
  },

  // ---- Teacher code management ----
  async _loadTeacherNames() {
    try {
      const names = AppState.teacherNames || {};
      for (const tc of AppState.teacherCodes) {
        if (!names[tc.code]) {
          const q = query(collection(db, "teachers"), where("teacherCode", "==", tc.code));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            names[tc.code] = data.fullName || data.name || "Unknown Teacher";
          } else names[tc.code] = "Unknown Teacher";
        }
      }
      AppState.teacherNames = names;
    } catch (e) { console.error(e); }
  },

  _getTeacherName(code) {
    return AppState.teacherNames[code] || "Unknown Teacher";
  },

  async addTeacherCode() {
    const { value: code } = await Swal.fire({
      title: 'শিক্ষক অ্যাকাউন্ট যোগ করুন',
      input: 'text',
      inputLabel: 'শিক্ষক কোড লিখুন',
      inputPlaceholder: 'শিক্ষক কোড',
      showCancelButton: true,
      inputValidator: (value) => !value ? 'শিক্ষক কোড আবশ্যক' : null
    });
    if (!code) return;
    if (!navigator.onLine) {
      Swal.fire('অফলাইন', 'ইন্টারনেট সংযোগ ছাড়া শিক্ষক যোগ করা যাবে না।', 'warning');
      return;
    }

    try {
      const q = query(collection(db, "teachers"), where("teacherCode", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) {
        Swal.fire('ত্রুটি', 'ভুল শিক্ষক কোড', 'error');
        return;
      }
      const teacherInfo = snap.docs[0].data();

      if (AppState.teacherCodes.find(tc => tc.code === code)) {
        Swal.fire('ত্রুটি', 'এই কোড ইতিমধ্যে যোগ করা আছে', 'error');
        return;
      }

      const newCodes = [...AppState.teacherCodes, { code, active: AppState.teacherCodes.length === 0 }];
      await updateDoc(doc(db, "students", auth.currentUser.uid), { teacherCodes: newCodes });
      AppState.teacherCodes = newCodes;
      AppState.teacherNames[code] = teacherInfo.fullName || teacherInfo.name || 'Unknown';
      if (newCodes.length === 1) {
        AppState.activeTeacherCode = code;
        // join first group of this teacher
        const groupsSnap = await getDocs(query(collection(db, "groups"), where("teacherCode", "==", code)));
        if (!groupsSnap.empty && !AppState.activeGroupId) {
          const g = groupsSnap.docs[0];
          AppState.activeGroupId = g.id;
          localStorage.setItem('activeGroupId', g.id);
          refreshExamCache();
        }
      }
      localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));
      Swal.fire('সফল', 'শিক্ষক অ্যাকাউন্ট যোগ হয়েছে!', 'success').then(() => this.load());
    } catch (e) {
      Swal.fire('ত্রুটি', 'শিক্ষক যোগ করতে ব্যর্থ', 'error');
    }
  },

  async switchTeacherCode(code) {
    const newCodes = AppState.teacherCodes.map(tc => ({ ...tc, active: tc.code === code }));
    await updateDoc(doc(db, "students", auth.currentUser.uid), { teacherCodes: newCodes });
    AppState.teacherCodes = newCodes;
    AppState.activeTeacherCode = code;
    localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));
    refreshExamCache();
    Swal.fire('সফল', 'শিক্ষক অ্যাকাউন্ট পরিবর্তন হয়েছে', 'success').then(() => this.load());
  },

  async confirmDeleteTeacher(code) {
    if (AppState.teacherCodes.length <= 1) {
      Swal.fire('ত্রুটি', 'অন্তত একটি শিক্ষক অ্যাকাউন্ট রাখতে হবে', 'error');
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: 'শিক্ষক অ্যাকাউন্ট মুছবেন?',
      text: 'এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33'
    });
    if (!isConfirmed) return;

    const updated = AppState.teacherCodes.filter(tc => tc.code !== code);
    if (updated.find(tc => tc.active)) {
      // active stays
    } else if (updated.length > 0) {
      updated[0].active = true;
    }
    await updateDoc(doc(db, "students", auth.currentUser.uid), { teacherCodes: updated });
    AppState.teacherCodes = updated;
    if (updated.length > 0) AppState.activeTeacherCode = updated.find(tc => tc.active)?.code || null;
    localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));
    refreshExamCache();
    Swal.fire('মুছে ফেলা হয়েছে', '', 'success').then(() => this.load());
  },

  // ---- Group management ----
  async switchGroup(groupId) {
    if (groupId === AppState.activeGroupId) return;
    AppState.activeGroupId = groupId;
    localStorage.setItem('activeGroupId', groupId);
    refreshExamCache();
    Swal.fire('সফল', 'কোর্স পরিবর্তন হয়েছে', 'success').then(() => Router.student('dashboard'));
  },

  async confirmLeaveGroup(groupId) {
    const { value: confirmText } = await Swal.fire({
      title: 'কোর্স ত্যাগ করবেন?',
      text: "নিশ্চিত করতে 'QuickZ' লিখুন",
      input: 'text',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      inputValidator: (val) => val !== 'QuickZ' ? 'QuickZ লিখুন' : null
    });
    if (!confirmText) return;

    if (!navigator.onLine) {
      Swal.fire('অফলাইন', 'ইন্টারনেট সংযোগ ছাড়া কোর্স ত্যাগ করা যাবে না', 'warning');
      return;
    }
    try {
      const user = auth.currentUser;
      const updatedGroups = AppState.joinedGroups.filter(g => g.groupId !== groupId);
      await updateDoc(doc(db, "students", user.uid), { joinedGroups: updatedGroups });

      // Remove student from group
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        const studentIds = (data.studentIds || []).filter(id => id !== user.uid);
        await updateDoc(doc(db, "groups", groupId), { studentIds });
      }

      AppState.joinedGroups = updatedGroups;
      if (AppState.activeGroupId === groupId) {
        AppState.activeGroupId = updatedGroups[0]?.groupId || null;
        localStorage.setItem('activeGroupId', AppState.activeGroupId || '');
        refreshExamCache();
      }
      localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));
      Swal.fire('সফল', 'কোর্স ত্যাগ করা হয়েছে', 'success').then(() => this.load());
    } catch (e) {
      Swal.fire('ত্রুটি', 'কোর্স ত্যাগ ব্যর্থ', 'error');
    }
  }
};

window.ManagementManager = ManagementManager;
