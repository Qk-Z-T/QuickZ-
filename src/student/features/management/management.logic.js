// src/student/features/management/management.logic.js
// Account management – teacher code section removed

import { auth, db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Router } from '../../core/router.js';
import {
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export const ManagementManager = {
  async load() {
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="p-5 pb-20 max-w-md mx-auto">
        <h2 class="text-2xl font-bold mb-4 text-center dark:text-white">ম্যানেজমেন্ট</h2>
        <div class="p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-6">
          <div id="groups-section"></div>
          <div id="password-section"></div>
          <button onclick="Auth.confirmLogout()" class="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition">
            লগআউট
          </button>
        </div>
      </div>`;

    await this.renderJoinedGroups();
    this.renderPasswordChange();
  },

  async renderJoinedGroups() {
    const container = document.getElementById('groups-section');
    if (!container) return;

    const joinedGroups = AppState.joinedGroups || [];
    let html = '';

    if (joinedGroups.length === 0) {
      html = `
        <div class="mb-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-bold text-lg dark:text-white">আমার কোর্স</h3>
            <button onclick="Router.student('courses')" class="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg font-bold">
              <i class="fas fa-plus mr-1"></i> নতুন কোর্স খুঁজুন
            </button>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">আপনি কোনো কোর্সে জয়েন করেননি।</p>
        </div>`;
    } else {
      const groupsHtml = joinedGroups.map(group => {
        const isActive = group.groupId === AppState.activeGroupId;
        return `
          <div class="p-3 rounded-xl mb-2 flex justify-between items-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div class="font-bold text-sm dark:text-white">${group.groupName || 'অজানা কোর্স'}</div>
            <div class="flex gap-2">
              ${!isActive ? `<button onclick="ManagementManager.switchGroup('${group.groupId}')" class="text-xs bg-indigo-500 text-white px-2 py-1 rounded">সুইচ</button>` : '<span class="text-xs bg-green-500 text-white px-2 py-1 rounded">সক্রিয়</span>'}
              <button onclick="ManagementManager.confirmLeaveGroup('${group.groupId}')" class="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-1 rounded">ত্যাগ</button>
            </div>
          </div>`;
      }).join('');

      html = `
        <div class="mb-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-bold text-lg dark:text-white">আমার কোর্স</h3>
            <button onclick="Router.student('courses')" class="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg font-bold">
              <i class="fas fa-plus mr-1"></i> নতুন কোর্স খুঁজুন
            </button>
          </div>
          <div class="space-y-2">${groupsHtml}</div>
        </div>`;
    }

    container.innerHTML = html;
  },

  renderPasswordChange() {
    const container = document.getElementById('password-section');
    if (!container) return;
    container.innerHTML = `
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div id="password-header" class="flex justify-between items-center cursor-pointer p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600" onclick="ManagementManager.togglePasswordForm()">
          <div class="flex items-center gap-2">
            <i class="fas fa-key text-indigo-500"></i>
            <span class="font-bold dark:text-white">পাসওয়ার্ড পরিবর্তন</span>
          </div>
          <i id="password-chevron" class="fas fa-chevron-down text-gray-400"></i>
        </div>
        <div id="password-form" class="overflow-hidden transition-all max-h-0 mt-3 space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">বর্তমান পাসওয়ার্ড</label>
            <div class="relative">
              <input type="password" id="current-password" class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white" placeholder="বর্তমান পাসওয়ার্ড">
              <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('current-password', this)"></i>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">নতুন পাসওয়ার্ড</label>
            <div class="relative">
              <input type="password" id="new-password" class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white" placeholder="নতুন পাসওয়ার্ড">
              <i class="fas fa-eye absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onclick="AuthUI.togglePass('new-password', this)"></i>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
            <div class="relative">
              <input type="password" id="confirm-password" class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white" placeholder="পুনরায় লিখুন">
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

  async switchGroup(groupId) {
    if (groupId === AppState.activeGroupId) return;
    AppState.activeGroupId = groupId;
    localStorage.setItem('activeGroupId', groupId);
    const { refreshExamCache } = await import('../../core/state.js');
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
      Swal.fire('অফলাইন', 'ইন্টারনেট সংযোগ ছাড়া সম্ভব নয়', 'warning');
      return;
    }

    try {
      const user = auth.currentUser;
      const updatedGroups = AppState.joinedGroups.filter(g => g.groupId !== groupId);
      await updateDoc(doc(db, "students", user.uid), { joinedGroups: updatedGroups });

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
        const { refreshExamCache } = await import('../../core/state.js');
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
