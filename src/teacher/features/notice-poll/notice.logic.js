// src/teacher/features/notice-poll/notice.logic.js
// Notice & Poll management logic

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Teacher } from '../../teacher-core.js';
import {
  collection, addDoc, query, where, orderBy, getDocs, doc, getDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { renderNoticeList, renderNoticeForm } from './notice.view.js';

export const NoticeLogic = {

  /**
   * Main entry: load and display notice/poll list
   */
  async showNoticeManagement() {
    if (!AppState.selectedGroup) {
      Teacher.selectGroupView?.('management');
      return;
    }

    document.getElementById('app-container').innerHTML = `
      <div class="pb-6">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="Router.teacher(AppState.currentPage)" class="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 bg-white dark:bg-gray-800 border dark:border-gray-700 px-3 py-2 rounded-lg transition bengali-text">
            <i class="fas fa-arrow-left"></i> ফিরে যান
          </button>
          <h2 class="text-xl font-bold dark:text-white bengali-text">নোটিশ ও পোল</h2>
        </div>
        <div class="flex justify-between items-center mb-5">
          <p class="text-sm text-gray-500 dark:text-gray-400 bengali-text">কোর্সের জন্য নোটিশ বা পোল তৈরি করুন ও পরিচালনা করুন</p>
          <button onclick="Teacher.createNoticeForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 bengali-text">
            <i class="fas fa-plus"></i> নতুন তৈরি
          </button>
        </div>
        <div id="notice-list-container" class="space-y-4">
          <div class="text-center p-8 text-gray-400 bengali-text">লোড হচ্ছে...</div>
        </div>
      </div>`;

    await NoticeLogic.loadNotices();
  },

  /**
   * Fetch and display all notices/polls for current group
   */
  async loadNotices() {
    try {
      const q = query(
        collection(db, "notices"),
        where("groupId", "==", AppState.selectedGroup.id),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const notices = [];
      snap.forEach(d => notices.push({ id: d.id, ...d.data() }));

      const container = document.getElementById('notice-list-container');
      if (!container) return;

      container.innerHTML = renderNoticeList(notices);
    } catch (error) {
      console.error('Error loading notices:', error);
    }
  },

  /**
   * Show create form for notice/poll
   */
  createNoticeForm() {
    document.getElementById('app-container').innerHTML = renderNoticeForm();
    window.pollOptionCount = 1;
  },

  /**
   * Toggle between notice and poll fields
   */
  toggleNoticeType() {
    const type = document.getElementById('notice-type')?.value;
    if (!type) return;
    const contentField = document.getElementById('notice-content-field');
    const pollOptions = document.getElementById('poll-options-container');
    if (type === 'poll') {
      contentField?.classList.add('hidden');
      pollOptions?.classList.remove('hidden');
    } else {
      contentField?.classList.remove('hidden');
      pollOptions?.classList.add('hidden');
    }
  },

  /**
   * Add a new poll option input
   */
  addPollOption() {
    window.pollOptionCount = (window.pollOptionCount || 1) + 1;
    const container = document.getElementById('poll-options-list');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'flex gap-2 mb-2';
    div.innerHTML = `
      <input type="text" class="poll-option-input flex-1 p-2 border rounded dark:bg-black" placeholder="অপশন ${window.pollOptionCount}">
      <button onclick="this.parentElement.remove()" class="px-3 bg-red-100 text-red-600 rounded">×</button>
    `;
    container.appendChild(div);
  },

  /**
   * Save the notice/poll to Firestore
   */
  async saveNotice() {
    const type = document.getElementById('notice-type')?.value;
    const title = document.getElementById('notice-title')?.value.trim();
    if (!title) {
      Swal.fire('ত্রুটি', 'শিরোনাম আবশ্যক', 'error');
      return;
    }

    let content = '';
    let options = [];

    if (type === 'notice') {
      content = document.getElementById('notice-content')?.value.trim() || '';
      if (!content) {
        Swal.fire('ত্রুটি', 'বিস্তারিত লিখুন', 'error');
        return;
      }
    } else {
      const inputs = document.querySelectorAll('.poll-option-input');
      inputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) options.push(val);
      });
      if (options.length < 2) {
        Swal.fire('ত্রুটি', 'কমপক্ষে দুটি অপশন দিন', 'error');
        return;
      }
    }

    const data = {
      groupId: AppState.selectedGroup.id,
      teacherId: AppState.currentUser.id,
      teacherName: AppState.currentUser.fullName,
      title,
      content,
      type,
      options: type === 'poll' ? options : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      views: {},
      votes: {}
    };

    try {
      await addDoc(collection(db, "notices"), data);
      Swal.fire('সফল', 'প্রকাশিত হয়েছে', 'success');
    } catch (e) {
      Swal.fire('ত্রুটি', 'সংরক্ষণ ব্যর্থ', 'error');
    }
    NoticeLogic.showNoticeManagement();
  },

  /**
   * Delete a notice/poll
   */
  async deleteNotice(noticeId) {
    const confirm = await Swal.fire({
      title: 'মুছে ফেলবেন?',
      icon: 'warning',
      showCancelButton: true
    });
    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "notices", noticeId));
        NoticeLogic.loadNotices();
      } catch (e) {
        Swal.fire('ত্রুটি', 'মুছতে ব্যর্থ', 'error');
      }
    }
  },

  /**
   * Show viewers list for a notice
   */
  async showViewers(noticeId) {
    try {
      const docSnap = await getDoc(doc(db, "notices", noticeId));
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const views = data.views || {};
      const studentIds = Object.keys(views);
      if (studentIds.length === 0) {
        Swal.fire('কেউ দেখেনি', 'এখনো কেউ এই নোটিশটি দেখেনি', 'info');
        return;
      }

      const names = [];
      for (const sid of studentIds) {
        const sDoc = await getDoc(doc(db, "students", sid));
        if (sDoc.exists()) {
          const s = sDoc.data();
          names.push(
            `${s.name || s.fullName || 'নাম নেই'} (${moment(views[sid].toDate()).format('DD MMM, h:mm A')})`
          );
        }
      }
      Swal.fire({ title: 'যারা দেখেছেন', html: names.join('<br>'), icon: 'info' });
    } catch (e) {
      Swal.fire('ত্রুটি', 'তথ্য লোড ব্যর্থ', 'error');
    }
  }
};

// Attach to Teacher object
Teacher.noticeManagementView = NoticeLogic.showNoticeManagement;
Teacher.loadNotices = NoticeLogic.loadNotices;
Teacher.createNoticeForm = NoticeLogic.createNoticeForm;
Teacher.toggleNoticeType = NoticeLogic.toggleNoticeType;
Teacher.addPollOption = NoticeLogic.addPollOption;
Teacher.saveNotice = NoticeLogic.saveNotice;
Teacher.deleteNotice = NoticeLogic.deleteNotice;
Teacher.showViewers = NoticeLogic.showViewers;
