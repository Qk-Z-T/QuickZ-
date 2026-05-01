// src/student/features/dashboard/dashboard.logic.js
// Student dashboard, live & mock exam listing logic, rankings, notices

import { auth, db } from '../../../shared/config/firebase.js';
import { AppState, ExamCache, unsubscribes, lastMockContext } from '../../core/state.js';
import { Router } from '../../core/router.js';
import { loadMathJax } from '../../../shared/utils/dom-helper.js';
import { MathHelper } from '../../../shared/utils/math-helper.js';
import { renderRankRow } from '../../components/result-row.js';
import {
  doc, getDoc, getDocs, collection, query, where, orderBy, onSnapshot, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Local mutable filter
let pastSubjectFilter = 'all';

// Helper: get content container
function getContentContainer() {
  return document.getElementById('page-content');
}

function setPageContent(html) {
  const container = getContentContainer();
  if (container) container.innerHTML = html;
  return container;
}

export const StudentDashboard = {
  // ---- Course Switcher UI helpers ----
  toggleCourseSwitcher() {
    const menu = document.getElementById('course-switcher-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
      setTimeout(() => window.addEventListener('click', this._closeSwitcherOnOutside), 10);
    } else {
      window.removeEventListener('click', this._closeSwitcherOnOutside);
    }
  },

  _closeSwitcherOnOutside(e) {
    const btn = document.getElementById('course-switcher-btn');
    const menu = document.getElementById('course-switcher-menu');
    if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
      menu.classList.add('hidden');
      window.removeEventListener('click', this._closeSwitcherOnOutside);
    }
  },

  async switchCourseFromDropdown(groupId) {
    const menu = document.getElementById('course-switcher-menu');
    if (menu) menu.classList.add('hidden');
    if (groupId !== AppState.activeGroupId) {
      await this.switchGroup(groupId);
    }
  },

  async switchCourseFromMobile(groupId) {
    if (!groupId || groupId === AppState.activeGroupId) return;
    await this.switchGroup(groupId);
  },

  async switchGroup(groupId) {
    AppState.activeGroupId = groupId;
    localStorage.setItem('activeGroupId', groupId);
    const { refreshExamCache } = await import('../../core/state.js');
    refreshExamCache();

    const activeGroup = (AppState.joinedGroups || []).find(g => g.groupId === groupId);
    if (activeGroup) {
      const displayName = document.getElementById('current-course-name-display');
      if (displayName) displayName.textContent = activeGroup.groupName || 'অজানা কোর্স';
      const mobileSelect = document.getElementById('mobile-course-switcher');
      if (mobileSelect) mobileSelect.value = groupId;
    }

    Swal.fire('সফল', 'কোর্স পরিবর্তন করা হয়েছে', 'success').then(() => Router.student('dashboard'));
  },

  // ---- Notification listener ----
  initNotificationListener() {
    if (!AppState.activeGroupId) return;
    const uid = auth.currentUser.uid;
    const q = query(collection(db, "notices"), where("groupId", "==", AppState.activeGroupId));
    const unsub = onSnapshot(q, (snap) => {
      let unreadCount = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (!data.views || !data.views[uid]) unreadCount++;
      });
      const badge = document.getElementById('notification-badge');
      const badgeMobile = document.getElementById('notification-badge-mobile');
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
      if (badgeMobile) {
        if (unreadCount > 0) {
          badgeMobile.textContent = unreadCount;
          badgeMobile.classList.remove('hidden');
        } else {
          badgeMobile.classList.add('hidden');
        }
      }
    });
    unsubscribes.push(unsub);
  },

  // ---- Main Dashboard ----
  async loadDashboard() {
    const myRouteId = window.currentRouteId;
    const contentEl = setPageContent(`
      <div class="p-5 pb-20 max-w-lg mx-auto">
        <div id="active-course-card" class="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 overflow-hidden mb-6 blue-course-card">
          <div class="p-5">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 text-xl">
                <i class="fas fa-book-open"></i>
              </div>
              <div class="flex-1">
                <h4 class="font-bold dark:text-white">লোড হচ্ছে...</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">কোর্স তথ্য</p>
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-6">
          <button id="live-exam-card" onclick="StudentDashboard.checkGroupAndLoad('live')"
            class="glass-exam-card shadow-xl">
            <div class="dashboard-card-indicator live-now"></div>
            <div class="dashboard-card-indicator upcoming"></div>
            <div class="dashboard-card-content">
              <div class="dashboard-card-icon"><i class="fas fa-broadcast-tower"></i></div>
              <div class="dashboard-card-title">Live exam</div>
            </div>
          </button>

          <button onclick="StudentDashboard.checkGroupAndLoad('mock')"
            class="glass-exam-card shadow-xl">
            <div class="dashboard-card-content">
              <div class="dashboard-card-icon"><i class="fas fa-book-reader"></i></div>
              <div class="dashboard-card-title">Mock exam</div>
            </div>
          </button>
        </div>
      </div>
    `);
    if (!contentEl) return;

    if (AppState.activeGroupId) {
      try {
        const groupDoc = await getDoc(doc(db, "groups", AppState.activeGroupId));
        if (!groupDoc.exists()) return;
        const group = groupDoc.data();
        const cardContainer = document.getElementById('active-course-card');
        if (!cardContainer) return;

        const classBadge = group.classLevel ?
          `<span class="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">${group.classLevel === 'Admission' ? 'এডমিশন' : group.classLevel}</span>` : '';
        const streamBadge = group.admissionStream ?
          `<span class="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30 ml-1">${group.admissionStream}</span>` : '';
        const imageHtml = group.imageUrl ?
          `<img src="${group.imageUrl}" class="w-full h-36 object-cover rounded-t-2xl">` :
          `<div class="w-full h-36 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-3xl text-indigo-400 rounded-t-2xl"><i class="fas fa-book-open"></i></div>`;

        // Blue gradient course card
        cardContainer.innerHTML = `
          ${imageHtml}
          <div class="p-5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-xl font-bold bengali-text">${group.name}</h3>
                <p class="text-xs text-indigo-100 mt-1">
                  <i class="fas fa-user-tie mr-1"></i> ${group.teacherName || 'শিক্ষক'}
                  <span class="mx-1 text-indigo-200">|</span>
                  ${group.studentIds?.length || 0} শিক্ষার্থী
                </p>
              </div>
              <div class="flex items-center gap-1">${classBadge} ${streamBadge}</div>
            </div>

            <div id="course-desc" class="text-sm text-indigo-100 mt-3 line-clamp-none hidden">
              ${group.description || 'কোনো বিবরণ নেই'}
            </div>

            <button onclick="
              const desc = document.getElementById('course-desc');
              const isHidden = desc.classList.toggle('hidden');
              this.innerHTML = isHidden
                ? '<i class=\\'fas fa-chevron-down mr-1\\'></i> বিস্তারিত দেখুন'
                : '<i class=\\'fas fa-chevron-up mr-1\\'></i> লুকান'
            " class="text-xs font-bold text-white mt-3 flex items-center gap-1 hover:underline opacity-90">
              <i class="fas fa-chevron-down mr-1"></i> বিস্তারিত দেখুন
            </button>
          </div>
        `;

        // Check live exam indicators
        const snap = await getDocs(query(collection(db, "exams"), where("groupId", "==", AppState.activeGroupId), where("type", "==", "live")));
        const now = new Date();
        let hasOngoing = false, hasUpcoming = false;
        snap.forEach(doc => {
          const e = doc.data();
          if (e.isDraft || e.cancelled || e.resultPublished) return;
          const st = new Date(e.startTime);
          const et = new Date(e.endTime);
          if (now >= st && now <= et) hasOngoing = true;
          else if (now < st) hasUpcoming = true;
        });
        const liveCard = document.getElementById('live-exam-card');
        if (liveCard) {
          if (hasOngoing) liveCard.classList.add('has-live');
          else liveCard.classList.remove('has-live');
          if (hasUpcoming) liveCard.classList.add('has-upcoming');
          else liveCard.classList.remove('has-upcoming');
        }
      } catch (e) {
        console.error("Dashboard error:", e);
      }
    } else {
      const cardContainer = document.getElementById('active-course-card');
      if (cardContainer) {
        cardContainer.innerHTML = `
          <div class="p-5 text-center">
            <i class="fas fa-info-circle text-3xl text-gray-400 mb-3"></i>
            <h4 class="font-bold dark:text-white mb-2">কোনো সক্রিয় কোর্স নেই</h4>
            <p class="text-xs text-gray-500 mb-4">পরীক্ষা দিতে ও র‍্যাংক দেখতে একটি কোর্সে জয়েন করুন</p>
            <button onclick="Router.student('courses')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">কোর্স খুঁজুন</button>
          </div>
        `;
      }
    }
  },

  checkGroupAndLoad(type) {
    if (!AppState.activeGroupId) {
      Swal.fire('কোর্স প্রয়োজন', 'আপনাকে অবশ্যই একটি কোর্সে যোগ দিতে হবে', 'warning').then(() => StudentDashboard.showGroupCodeModal());
      return;
    }
    if (type === 'live') StudentDashboard.loadLiveExams();
    else StudentDashboard.loadMockHub();
  },

  showGroupCodeModal() {
    document.getElementById('group-code-modal').classList.remove('hidden');
  },

  // ---- Group Members Modal ----
  async showGroupMembersModal(groupId) {
    const modal = document.getElementById('group-members-modal');
    const title = document.getElementById('group-members-title');
    const subtitle = document.getElementById('group-members-subtitle');
    const list = document.getElementById('group-members-list');
    if (!modal) return;
    modal.classList.remove('hidden');
    list.innerHTML = '<div class="text-center p-10"><div class="quick-loader mx-auto"></div></div>';
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (!groupDoc.exists()) return;
      const group = groupDoc.data();
      const studentIds = group.studentIds || [];
      const students = [];
      for (const sid of studentIds) {
        const sDoc = await getDoc(doc(db, "students", sid));
        if (sDoc.exists()) {
          const s = sDoc.data();
          students.push({ id: sid, name: s.name || s.fullName || 'No Name', disabled: s.disabled });
        }
      }
      title.textContent = group.name + ' - সদস্যবৃন্দ';
      subtitle.textContent = `মোট ${students.length} জন সদস্য`;
      const currentUserId = auth.currentUser?.uid;
      let html = students.map(s => `
        <div class="group-member-item">
          <div class="group-member-avatar">${s.name.charAt(0)}</div>
          <div class="group-member-info">
            <div class="group-member-name">${s.name} ${s.id === currentUserId ? '<span class="text-indigo-500 font-normal">(আপনি)</span>' : ''}</div>
          </div>
          <span class="text-xs ${s.disabled ? 'text-red-500' : 'text-green-600'}">${s.disabled ? 'নিষ্ক্রিয়' : 'সক্রিয়'}</span>
        </div>
      `).join('');
      list.innerHTML = html || '<p>কোনো সদস্য নেই</p>';
    } catch (error) {
      list.innerHTML = '<div class="text-center p-10 text-red-500">সদস্য লোড করতে ত্রুটি</div>';
    }
  },

  hideGroupMembersModal() {
    document.getElementById('group-members-modal')?.classList.add('hidden');
  },

  // ---- Live Exams List ----
  async loadLiveExams() {
    const myRouteId = window.currentRouteId;
    if (AppState.userDisabled || !AppState.activeGroupId) return;
    const contentEl = setPageContent('<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>');
    if (!contentEl) return;

    const uid = auth.currentUser.uid;
    const now = new Date();
    let exams = [];
    let userAttempts = {};

    if (!navigator.onLine) {
      const cached = localStorage.getItem('offlineExamCache_' + AppState.activeGroupId);
      if (cached) {
        try {
          exams = Object.values(JSON.parse(cached));
        } catch(e) {}
      }
      if (exams.length === 0) {
        contentEl.innerHTML = `<div class="p-10 text-center text-gray-400"><i class="fas fa-wifi-slash text-4xl mb-3 opacity-30"></i><p>অফলাইনে কোনো ক্যাশকৃত পরীক্ষা নেই।</p></div>`;
        return;
      }
    } else {
      const userAttemptsSnap = await getDocs(query(collection(db, "attempts"), where("userId", "==", uid), where("isPractice", "==", false)));
      userAttemptsSnap.forEach(doc => { userAttempts[doc.data().examId] = doc.data(); });
      const snap = await getDocs(query(collection(db, "exams"), where("groupId", "==", AppState.activeGroupId)));
      snap.forEach(doc => exams.push({ id: doc.id, ...doc.data() }));
      const cacheObj = {};
      exams.forEach(e => cacheObj[e.id] = e);
      localStorage.setItem('offlineExamCache_' + AppState.activeGroupId, JSON.stringify(cacheObj));
    }

    if (myRouteId !== window.currentRouteId) return;

    const ongoing = [], upcoming = [];
    for (const e of exams) {
      if (e.type === 'live' && !e.isDraft && !e.cancelled && !e.resultPublished) {
        const st = new Date(e.startTime), et = new Date(e.endTime);
        if (now >= st && now <= et) ongoing.push(e);
        else if (now < st) upcoming.push(e);
      }
    }

    const renderCard = (exam, status) => {
      const startTime = moment(exam.startTime).format('DD MMM, h:mm A');
      const endTime = moment(exam.endTime).format('h:mm A');
      const userAttempt = userAttempts[exam.id];
      const isSubmitted = userAttempt?.submittedAt;
      let buttonHtml = '';
      let statusBadge = status === 'ongoing' ? '<span class="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">চলমান</span>' : '<span class="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">আসন্ন</span>';

      if (status === 'ongoing') {
        buttonHtml = isSubmitted
          ? `<button class="w-full bg-gray-400 text-white py-2 rounded-lg text-sm font-bold cursor-not-allowed" disabled><i class="fas fa-check-circle mr-2"></i> জমা দেওয়া হয়েছে</button>`
          : `<div class="flex gap-2"><button onclick="Exam.start('${exam.id}')" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-bold"><i class="fas fa-play-circle mr-2"></i> যোগ দিন</button><button onclick="StudentDashboard.loadLiveExams()" class="px-3 bg-indigo-100 text-indigo-600 rounded-lg"><i class="fas fa-sync-alt"></i></button></div>`;
      } else {
        buttonHtml = `<button class="w-full bg-blue-100 text-blue-600 py-2 rounded-lg text-sm font-bold cursor-not-allowed" disabled><i class="far fa-clock mr-2"></i> শুরু হবে ${startTime}</button>`;
      }

      return `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border mb-3">
          <div class="flex justify-between items-start mb-1">
            ${statusBadge}
            ${userAttempt ? '<span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">অংশগ্রহণ করেছেন</span>' : ''}
          </div>
          <h3 class="font-bold text-lg">${exam.title}</h3>
          ${exam.subject ? `<p class="text-xs text-indigo-500">${exam.subject} ${exam.chapter ? '• '+exam.chapter : ''}</p>` : ''}
          <div class="text-xs text-gray-500 mb-2 flex gap-2">
            <span><i class="fas fa-star text-amber-400"></i> ${exam.totalMarks} মার্ক</span>
            <span><i class="far fa-clock"></i> ${exam.duration}মি</span>
            <span><i class="far fa-calendar-alt"></i> ${moment(exam.startTime).format('DD MMM YYYY')}</span>
          </div>
          ${buttonHtml}
        </div>
      `;
    };

    let html = '';
    if (ongoing.length) html += `<h3 class="font-bold mb-2">চলমান পরীক্ষা</h3>` + ongoing.map(e => renderCard(e, 'ongoing')).join('');
    if (upcoming.length) html += `<h3 class="font-bold mb-2">আসন্ন লাইভ পরীক্ষা</h3>` + upcoming.map(e => renderCard(e, 'upcoming')).join('');
    if (!ongoing.length && !upcoming.length) html = '<div class="text-center py-20 text-gray-400">কোনো আসন্ন বা চলমান লাইভ পরীক্ষা নেই</div>';

    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <button onclick="StudentDashboard.loadDashboard()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> ড্যাশবোর্ড</button>
        <h2 class="text-2xl font-bold mb-4 text-center">লাইভ এক্সাম</h2>
        <div class="grid grid-cols-1 gap-6 mb-8">
          <button onclick="StudentDashboard.checkGroupAndLoad('past')" class="h-32 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-900 text-white p-5 text-left group">
            <div class="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-3"><i class="fas fa-history text-xl"></i></div>
            <h3 class="text-xl font-bold">পূর্বের লাইভ পরীক্ষা</h3>
            <p class="text-gray-300 text-xs mt-1">প্রশ্ন ও সমাধান সহ সকল পূর্ববর্তী লাইভ পরীক্ষা দেখুন</p>
          </button>
        </div>
        ${html}
      </div>
    `;
  },

  async loadPastLiveExams() {
    if (AppState.userDisabled || !AppState.activeGroupId) return;
    const contentEl = setPageContent('<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>');
    if (!contentEl) return;

    try {
      const uid = auth.currentUser.uid;
      const now = new Date();

      const snaps = await getDocs(query(collection(db, "exams"), where("groupId", "==", AppState.activeGroupId), where("type", "==", "live")));
      const liveExams = [];
      snaps.forEach(doc => {
        const e = { id: doc.id, ...doc.data() };
        if (e.resultPublished || (e.endTime && new Date(e.endTime) < now)) liveExams.push(e);
      });

      if (liveExams.length === 0) {
        contentEl.innerHTML = `<div class="p-5 pb-20"><h2 class="text-xl font-bold mb-4">পূর্বের লাইভ পরীক্ষা</h2><p class="text-gray-500">কোনো পরীক্ষা নেই</p></div>`;
        return;
      }

      const userAttemptsSnap = await getDocs(query(collection(db, "attempts"), where("userId", "==", uid), where("isPractice", "==", false)));
      const userAttempts = {};
      userAttemptsSnap.forEach(d => { userAttempts[d.data().examId] = d.data(); });

      const attended = [], absent = [];
      liveExams.forEach(e => {
        if (userAttempts[e.id]) attended.push(e);
        else absent.push(e);
      });

      const subjects = new Set();
      liveExams.forEach(e => subjects.add(e.subject || 'Uncategorized'));

      const filterBtns = ['all', ...Array.from(subjects).sort()].map(s =>
        `<button class="px-3 py-1 rounded-full text-xs font-bold ${pastSubjectFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}" onclick="StudentDashboard.setPastFilter('${s}')">${s}</button>`
      ).join('');

      const renderCard = (exam, isAttended) => `
        <div class="bg-white dark:bg-gray-800 p-3 rounded-xl border mb-2">
          <div class="flex justify-between items-start mb-1">
            <span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">শেষ</span>
            ${isAttended ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">অংশগ্রহণ করেছেন</span>' : '<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">অনুপস্থিত</span>'}
          </div>
          <h3 class="font-bold">${exam.title}</h3>
          <p class="text-xs text-indigo-500">${exam.subject || 'Uncategorized'} ${exam.chapter ? '• ' + exam.chapter : ''}</p>
          <div class="flex gap-2 mt-2">
            <button onclick="Exam.start('${exam.id}', true)" class="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-bold">পরীক্ষা দিন</button>
            <button onclick="StudentDashboard.viewExamSolutions('${exam.id}', 'live')" class="flex-1 bg-emerald-500 text-white py-1.5 rounded text-xs font-bold">সমাধান</button>
          </div>
        </div>`;

      let all = [...attended, ...absent];
      if (pastSubjectFilter !== 'all') all = all.filter(e => (e.subject || 'Uncategorized') === pastSubjectFilter);
      all.sort((a, b) => new Date(b.endTime || b.createdAt) - new Date(a.endTime || a.createdAt));

      contentEl.innerHTML = `
        <div class="p-5 pb-20">
          <button onclick="StudentDashboard.loadLiveExams()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> ফিরুন</button>
          <h2 class="text-xl font-bold mb-4 text-center">পূর্বের লাইভ পরীক্ষা</h2>
          <div class="flex gap-2 mb-4 overflow-x-auto">${filterBtns}</div>
          ${all.map(e => renderCard(e, attended.includes(e))).join('') || '<div class="text-center py-20 text-gray-400">কোনো পরীক্ষা নেই</div>'}
        </div>`;
    } catch(e) {
      console.error(e);
      Swal.fire('ত্রুটি', 'পূর্বের লাইভ পরীক্ষা লোড করতে ব্যর্থ', 'error');
    }
  },

  setPastFilter(subject) {
    pastSubjectFilter = subject;
    StudentDashboard.loadPastLiveExams();
  },

  async viewExamSolutions(examId, type) {
    const contentEl = setPageContent('<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>');
    if (!contentEl) return;
    if (!navigator.onLine) return;

    const examDoc = await getDoc(doc(db, "exams", examId));
    if (!examDoc.exists()) return;
    const exam = examDoc.data();
    const questions = JSON.parse(exam.questions);

    let html = `<div class="p-5 pb-24"><button onclick="StudentDashboard.loadPastLiveExams()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> ফিরুন</button><h2 class="font-bold text-xl mb-4">${exam.title} - সমাধান</h2>`;
    questions.forEach((q, i) => {
      const qText = MathHelper.renderExamContent(q.q);
      html += `
        <div class="border p-4 rounded-xl mb-4 bg-white dark:bg-gray-800">
          <div class="flex justify-between mb-2">
            <span class="font-bold">প্রশ্ন ${i+1}</span>
            <span class="text-green-600 text-xs font-bold">সঠিক: ${String.fromCharCode(65+q.correct)}</span>
          </div>
          <p class="font-semibold mb-2">${qText}</p>
          <div class="space-y-1">
            ${q.options.map((opt, oi) => {
              const optText = MathHelper.renderExamContent(opt);
              const isCorrect = oi === q.correct;
              return `<div class="p-2 rounded border ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-gray-50 dark:bg-gray-700'}">${String.fromCharCode(65+oi)}. ${optText} ${isCorrect ? '<i class="fas fa-check float-right text-green-600"></i>' : ''}</div>`;
            }).join('')}
          </div>
          ${q.expl ? `<div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs">${MathHelper.renderExamContent(q.expl)}</div>` : ''}
        </div>`;
    });
    html += '</div>';
    contentEl.innerHTML = html;
    loadMathJax(null, contentEl);
  },

  // ---- Mock Hub & Structure Navigation ----
  async loadMockHub() {
    if (!AppState.activeGroupId) return;
    const contentEl = setPageContent('<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>');
    if (!contentEl) return;

    if (!navigator.onLine) {
      const cached = localStorage.getItem('mockFolderCache_' + AppState.activeGroupId);
      if (cached) {
        try {
          const structure = JSON.parse(cached);
          const subjects = structure.mock || [];
          contentEl.innerHTML = `<div class="p-5 pb-20">
            <button onclick="StudentDashboard.loadDashboard()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> ড্যাশবোর্ড</button>
            <h2 class="text-xl font-bold mb-4 text-center">বিষয় নির্বাচন করুন</h2>
            ${subjects.map(sub => `<div onclick="StudentDashboard.loadMockChapters('${sub.id}', '${sub.teacherId}')" class="p-4 rounded-xl border mb-3 cursor-pointer flex justify-between"><span>${sub.name}</span><i class="fas fa-chevron-right"></i></div>`).join('')}
          </div>`;
        } catch(e) {
          contentEl.innerHTML = '<div class="p-10 text-center text-gray-400">অফলাইন ক্যাশে সমস্যা</div>';
        }
      } else {
        contentEl.innerHTML = '<div class="p-10 text-center text-gray-400">অফলাইনে মক পরীক্ষার তালিকা পাওয়া যায়নি</div>';
      }
      return;
    }

    let groupDoc;
    try {
      groupDoc = await getDoc(doc(db, "groups", AppState.activeGroupId));
    } catch (e) {
      contentEl.innerHTML = '<div class="p-10 text-center text-red-500">কোর্স তথ্য লোড করতে ত্রুটি</div>';
      return;
    }

    if (!groupDoc.exists()) {
      contentEl.innerHTML = '<div class="p-10 text-center text-gray-400">কোনো কোর্স পাওয়া যায়নি</div>';
      return;
    }

    const teacherId = groupDoc.data().teacherId;
    if (!teacherId) {
      contentEl.innerHTML = '<div class="p-10 text-center text-gray-400">শিক্ষকের তথ্য পাওয়া যায়নি</div>';
      return;
    }

    const folderSnap = await getDoc(doc(db, "folderStructures", `${teacherId}_${AppState.activeGroupId}`));
    if (!folderSnap.exists()) {
      contentEl.innerHTML = '<div class="p-10 text-center text-gray-400">কোনো মক পরীক্ষা নেই</div>';
      return;
    }

    const structure = folderSnap.data();
    localStorage.setItem('mockFolderCache_' + AppState.activeGroupId, JSON.stringify(structure));
    const subjects = structure.mock || [];
    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <button onclick="StudentDashboard.loadDashboard()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> ড্যাশবোর্ড</button>
        <h2 class="text-xl font-bold mb-4 text-center">বিষয় নির্বাচন করুন</h2>
        ${subjects.map(sub => `<div onclick="StudentDashboard.loadMockChapters('${sub.id}', '${teacherId}')" class="p-4 rounded-xl border mb-3 cursor-pointer flex justify-between"><span class="font-bold">${sub.name}</span><i class="fas fa-chevron-right"></i></div>`).join('')}
      </div>`;
  },

  async loadMockChapters(subId, teacherId) {
    const contentEl = setPageContent('<div class="quick-loader mx-auto"></div>');
    if (!contentEl) return;
    const structure = (await getDoc(doc(db, "folderStructures", `${teacherId}_${AppState.activeGroupId}`))).data();
    const subject = structure.mock.find(s => s.id === subId);
    if (!subject) return StudentDashboard.loadMockHub();
    lastMockContext.subject = subId;
    lastMockContext.teacherId = teacherId;
    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <button onclick="StudentDashboard.loadMockHub()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> বিষয় তালিকা</button>
        <h2 class="text-xl font-bold mb-2 text-center">${subject.name}</h2>
        <p class="text-xs text-center text-gray-500 mb-4">অধ্যায় নির্বাচন করুন</p>
        ${subject.children.map(chap => `<div onclick="StudentDashboard.loadMockExams('${subId}', '${chap.id}', '${teacherId}')" class="p-3 rounded-xl border mb-3 cursor-pointer flex justify-between"><span>${chap.name}</span><span class="text-xs bg-gray-200 px-2 py-1 rounded">${chap.exams.length} পরীক্ষা</span></div>`).join('')}
      </div>`;
  },

  async loadMockExams(subId, chapId, teacherId) {
    const contentEl = setPageContent('<div class="quick-loader mx-auto"></div>');
    if (!contentEl) return;
    const structure = (await getDoc(doc(db, "folderStructures", `${teacherId}_${AppState.activeGroupId}`))).data();
    const subject = structure.mock.find(s => s.id === subId);
    const chapter = subject?.children.find(c => c.id === chapId);
    if (!chapter) return StudentDashboard.loadMockHub();
    lastMockContext.subject = subId;
    lastMockContext.chapter = chapId;
    lastMockContext.teacherId = teacherId;

    const uid = auth.currentUser.uid;
    const examsWithStatus = await Promise.all(chapter.exams.map(async (e) => {
      const snap = await getDocs(query(collection(db, "attempts"), where("userId", "==", uid), where("examId", "==", e.id), where("isPractice", "==", true)));
      return { ...e, hasAttempted: !snap.empty };
    }));

    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <button onclick="StudentDashboard.loadMockChapters('${subId}', '${teacherId}')" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> অধ্যায় তালিকা</button>
        <h2 class="text-xl font-bold mb-1 text-center">${subject.name}</h2>
        <p class="text-sm text-gray-500 mb-4 text-center">${chapter.name}</p>
        ${examsWithStatus.map(e => `
          <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border mb-4">
            <h3 class="font-bold text-lg text-center">${e.name}</h3>
            <p class="text-xs text-gray-500 text-center mb-3">মার্ক: ${e.examData?.totalMarks || 0} • সময়: ${e.examData?.duration || 0}মি</p>
            <div class="flex gap-2">
              <button onclick="Exam.start('${e.id}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">অনুশীলন শুরু</button>
              <button onclick="${e.hasAttempted ? `StudentDashboard.viewExamSolutions('${e.id}', 'mock')` : `Swal.fire('আগে পরীক্ষা দিন', 'আপনাকে কমপক্ষে একবার পরীক্ষা দিতে হবে উত্তর দেখতে।', 'warning')`}" class="flex-1 ${e.hasAttempted ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-gray-200'} py-2 rounded-lg text-sm font-bold">${e.hasAttempted ? 'উত্তর দেখুন' : 'আগে পরীক্ষা দিন'}</button>
            </div>
          </div>
        `).join('')}
      </div>`;
  },

  // ---- Rankings (two‑step: list → detail) ----
  async loadRankings() {
    if (!AppState.activeGroupId) {
      Swal.fire('কোর্স প্রয়োজন', 'প্রথমে একটি কোর্সে জয়েন করুন', 'warning');
      return;
    }
    const contentEl = setPageContent('<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>');
    if (!contentEl) return;

    try {
      const snap = await getDocs(query(
        collection(db, "exams"),
        where("groupId", "==", AppState.activeGroupId),
        where("type", "==", "live"),
        where("resultPublished", "==", true)
      ));
      const exams = [];
      snap.forEach(d => exams.push({ id: d.id, ...d.data() }));

      if (exams.length === 0) {
        contentEl.innerHTML = `<div class="p-5 pb-20"><h2 class="text-xl font-bold mb-4">র‍্যাংকিং</h2><p class="text-gray-500">এখনো কোনো র‍্যাংক প্রকাশিত হয়নি</p></div>`;
        return;
      }

      let html = `<div class="p-5 pb-20">
        <h2 class="text-xl font-bold mb-4">র‍্যাংকিং</h2>
        <p class="text-sm text-gray-500 mb-4">একটি পরীক্ষা বেছে নিন</p>`;

      exams.forEach(exam => {
        const date = exam.createdAt?.toDate ? moment(exam.createdAt.toDate()).format('DD MMM, YYYY') : '';
        html += `
          <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border mb-3 flex justify-between items-center">
            <div>
              <div class="font-bold">${exam.title}</div>
              <div class="text-xs text-gray-500">${date}</div>
            </div>
            <button onclick="StudentDashboard.viewExamRanking('${exam.id}')" class="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold">View Rank</button>
          </div>`;
      });

      html += `</div>`;
      contentEl.innerHTML = html;
    } catch (e) {
      console.error(e);
      contentEl.innerHTML = '<div class="p-5 text-red-500">র‍্যাংকিং লোড করতে ত্রুটি</div>';
    }
  },

  async viewExamRanking(examId) {
    const contentEl = setPageContent('<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>');
    if (!contentEl) return;

    try {
      const uid = auth.currentUser.uid;

      // 1. Get exam details
      const examSnap = await getDoc(doc(db, "exams", examId));
      if (!examSnap.exists()) {
        Swal.fire('Error', 'Exam not found', 'error');
        return this.loadRankings();
      }
      const exam = examSnap.data();
      const totalMarks = exam.totalMarks || 0;
      const duration = exam.duration || 0;
      const examDate = exam.startTime
        ? moment(exam.startTime).format('DD MMM, YYYY')
        : moment(exam.createdAt?.toDate()).format('DD MMM, YYYY');
      const examTime = exam.startTime
        ? moment(exam.startTime).format('hh:mm A')
        : 'N/A';

      // 2. Get all real attempts (not practice, submitted)
      const attemptsSnap = await getDocs(query(
        collection(db, "attempts"),
        where("examId", "==", examId),
        where("isPractice", "==", false)
      ));

      // 3. Group by userId, keep only the FIRST submitted attempt (by submittedAt)
      const userFirstAttempt = {};
      attemptsSnap.forEach(doc => {
        const att = { id: doc.id, ...doc.data() };
        if (!att.submittedAt || att.score === undefined || att.score === null) return;

        const existing = userFirstAttempt[att.userId];
        if (!existing || att.submittedAt.toDate() < existing.submittedAt.toDate()) {
          userFirstAttempt[att.userId] = att;
        }
      });

      // 4. Convert to array and sort by score desc
      const rankedList = Object.values(userFirstAttempt).map(att => ({
        ...att,
        score: parseFloat(att.score) || 0,
        accuracy: 0, // placeholder
        timeTakenSeconds: att.startedAt && att.submittedAt
          ? Math.floor((att.submittedAt.toDate() - att.startedAt.toDate()) / 1000)
          : 0
      }));

      rankedList.sort((a, b) => b.score - a.score);

      // 5. Find current user's rank
      let myRank = null;
      rankedList.forEach((att, index) => {
        if (att.userId === uid) {
          myRank = index + 1;
        }
      });

      // 6. Build glass summary card
      const summaryHtml = `
        <div class="glass-card p-5 rounded-2xl mb-6">
          <h3 class="text-xl font-bold mb-2 dark:text-white">${exam.title}</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400"><i class="fas fa-star text-amber-400 mr-1"></i>মোট মার্ক:</span>
              <span class="font-bold dark:text-white ml-1">${totalMarks}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400"><i class="far fa-clock mr-1"></i>সময়:</span>
              <span class="font-bold dark:text-white ml-1">${duration} মিনিট</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400"><i class="far fa-calendar-alt mr-1"></i>তারিখ:</span>
              <span class="font-bold dark:text-white ml-1">${examDate}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400"><i class="far fa-clock mr-1"></i>পরীক্ষার সময়:</span>
              <span class="font-bold dark:text-white ml-1">${examTime}</span>
            </div>
            <div class="col-span-2 mt-2">
              <span class="text-gray-500 dark:text-gray-400"><i class="fas fa-trophy mr-1"></i>আপনার র‍্যাংক:</span>
              <span class="font-bold text-indigo-600 dark:text-indigo-400 text-lg ml-1">
                ${myRank ? myRank + ' / ' + rankedList.length : 'অংশগ্রহণ করেননি'}
              </span>
            </div>
          </div>
        </div>
      `;

      // 7. Build rank rows
      let rankHTML = '';
      rankedList.forEach((att, i) => {
        const studentInfo = { college: '', school: '' };
        rankHTML += renderRankRow(att, i, studentInfo, uid);
      });

      contentEl.innerHTML = `
        <div class="p-5 pb-20">
          <button onclick="StudentDashboard.loadRankings()" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> র‍্যাংকিং তালিকা</button>
          ${summaryHtml}
          <div class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow">
            ${rankHTML || '<div class="p-5 text-center text-gray-500">কোনো র‍্যাংক নেই</div>'}
          </div>
        </div>`;
    } catch (e) {
      console.error(e);
      contentEl.innerHTML = '<div class="p-5 text-red-500">র‍্যাংকিং লোড করতে ত্রুটি</div>';
    }
  },

  // ---- Notices ----
  async loadNotices() {
    if (!AppState.activeGroupId) {
      Swal.fire('কোর্স প্রয়োজন', 'প্রথমে একটি কোর্সে জয়েন করুন', 'warning');
      return;
    }
    const contentEl = setPageContent('<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>');
    if (!contentEl) return;

    try {
      const uid = auth.currentUser.uid;
      const snap = await getDocs(query(
        collection(db, "notices"),
        where("groupId", "==", AppState.activeGroupId),
        orderBy("createdAt", "desc")
      ));
      const notices = [];
      snap.forEach(d => notices.push({ id: d.id, ...d.data() }));

      for (const n of notices) {
        const noticeRef = doc(db, "notices", n.id);
        const currentViews = n.views || {};
        if (!currentViews[uid]) {
          currentViews[uid] = new Date();
          await updateDoc(noticeRef, { views: currentViews }).catch(() => {});
        }
      }

      let html = '';
      notices.forEach(n => {
        const isPoll = n.type === 'poll';
        const viewCount = Object.keys(n.views || {}).length;
        let pollSection = '';
        if (isPoll && n.options) {
          const votes = n.votes || {};
          const totalVotes = Object.keys(votes).length;
          pollSection = `<div class="mt-2 text-sm"><b>ভোট:</b> ${totalVotes}</div>`;
        }

        html += `
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border mb-3">
            <div class="flex justify-between">
              <span class="text-xs bg-indigo-100 px-2 py-1 rounded">${isPoll ? 'পোল' : 'নোটিশ'}</span>
              <span class="text-xs text-gray-500">${moment(n.createdAt?.toDate()).format('DD MMM, YYYY')}</span>
            </div>
            <h3 class="font-bold mt-2">${n.title}</h3>
            ${n.content ? `<p class="text-sm mt-1">${n.content}</p>` : ''}
            ${pollSection}
            <div class="text-xs text-gray-400 mt-2"><i class="far fa-eye"></i> ${viewCount} জন দেখেছেন</div>
          </div>`;
      });

      contentEl.innerHTML = `
        <div class="p-5 pb-20">
          <h2 class="text-xl font-bold mb-4">নোটিশ ও পোল</h2>
          ${html || '<p class="text-gray-500">কোনো নোটিশ নেই</p>'}
        </div>`;
    } catch (e) {
      console.error(e);
      contentEl.innerHTML = '<div class="p-5 text-red-500">নোটিশ লোড করতে ত্রুটি</div>';
    }
  }
};

window.StudentDashboard = StudentDashboard;
