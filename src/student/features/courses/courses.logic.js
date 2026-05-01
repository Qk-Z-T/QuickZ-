// src/student/features/courses/courses.logic.js
// Course listing, filtering, joining logic – description expand/collapse

import { auth, db } from '../../../shared/config/firebase.js';
import { AppState, refreshExamCache } from '../../core/state.js';
import { Router } from '../../core/router.js';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export const CoursesManager = {
  async loadCourses() {
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <h2 class="text-2xl font-bold mb-4 text-center">কোর্সসমূহ</h2>
        <div class="text-center p-10"><div class="quick-loader mx-auto"></div></div>
      </div>`;

    try {
      const q = query(
        collection(db, "groups"),
        where("archived", "==", false),
        where("joinEnabled", "==", true)
      );
      const snap = await getDocs(q);
      const allGroups = [];
      snap.forEach(doc => allGroups.push({ id: doc.id, ...doc.data() }));

      window.allCoursesList = allGroups;
      this.renderCourseList();
    } catch (error) {
      console.error(error);
      contentEl.innerHTML = `<div class="p-5 text-center text-red-500">কোর্স লোড করতে ত্রুটি</div>`;
    }
  },

  renderCourseList() {
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;
    const allGroups = window.allCoursesList || [];
    const studentClass = AppState.classLevel || '';
    const studentStream = AppState.admissionStream || '';
    const joinedGroupIds = (AppState.joinedGroups || []).map(g => g.groupId);

    const filterClass = document.getElementById('course-filter-class')?.value || 'all';
    const searchTerm = (document.getElementById('course-search-input')?.value || '').toLowerCase().trim();

    let filtered = allGroups.filter(g => {
      if (filterClass !== 'all') {
        if (g.classLevel !== filterClass) return false;
        if (filterClass === 'Admission') {
          const streamFilter = document.getElementById('course-filter-stream')?.value;
          if (streamFilter && streamFilter !== 'all' && g.admissionStream !== streamFilter) return false;
        }
      }
      if (searchTerm) {
        const name = (g.name || '').toLowerCase();
        const teacher = (g.teacherName || '').toLowerCase();
        const desc = (g.description || '').toLowerCase();
        if (!name.includes(searchTerm) && !teacher.includes(searchTerm) && !desc.includes(searchTerm)) return false;
      }
      return true;
    });

    // Sort: matching class first
    filtered.sort((a, b) => {
      if (a.classLevel === studentClass && b.classLevel !== studentClass) return -1;
      if (a.classLevel !== studentClass && b.classLevel === studentClass) return 1;
      return 0;
    });

    const classLevels = ['6', '7', '8', 'SSC', 'HSC', 'Admission'];
    const classOptions = classLevels.map(lvl =>
      `<option value="${lvl}" ${filterClass === lvl ? 'selected' : ''}>${lvl === 'Admission' ? 'এডমিশন' : (lvl === 'SSC' ? 'এসএসসি' : (lvl === 'HSC' ? 'এইচএসসি' : lvl+'ম শ্রেণী'))}</option>`
    ).join('');

    const streamOptions = `
      <option value="all">সব শাখা</option>
      <option value="Science">সায়েন্স</option>
      <option value="Humanities">মানবিক</option>
      <option value="Commerce">কমার্স</option>`;

    const courseCards = filtered.length > 0 ? filtered.map(group => {
      const isJoined = joinedGroupIds.includes(group.id);
      const joinMethodText = {
        public: 'পাবলিক',
        code: 'কোর্স কোড',
        permission: 'পারমিশন কী'
      }[group.joinMethod] || 'কোর্স কোড';

      const classBadge = group.classLevel ?
        `<span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">${group.classLevel === 'Admission' ? 'এডমিশন' : group.classLevel}</span>` : '';
      const streamBadge = group.admissionStream ?
        `<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">${group.admissionStream}</span>` : '';

      const imageHtml = group.imageUrl ?
        `<img src="${group.imageUrl}" class="w-full h-36 object-cover rounded-t-xl">` :
        `<div class="w-full h-36 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-3xl text-indigo-400 rounded-t-xl"><i class="fas fa-book-open"></i></div>`;

      const actionButton = isJoined
        ? `<button class="w-full bg-green-100 text-green-700 py-2 rounded-lg text-sm font-bold" disabled><i class="fas fa-check-circle"></i> জয়েন করেছেন</button>`
        : `<button onclick="CoursesManager.joinCourse('${group.id}', '${group.joinMethod}', '${group.groupCode || ''}')" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">জয়েন করুন</button>`;

      // Description with toggle
      const desc = group.description || '';
      const descHtml = desc ? `
        <div class="mb-3">
          <p id="desc-${group.id}" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">${desc}</p>
          <button onclick="
            const d = document.getElementById('desc-${group.id}');
            const clamped = d.classList.toggle('line-clamp-1');
            this.innerHTML = clamped ? 'আরও দেখুন <i class=\\'fas fa-chevron-down ml-1\\'></i>' : 'লুকান <i class=\\'fas fa-chevron-up ml-1\\'></i>';
          " class="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1 inline-flex items-center">
            আরও দেখুন <i class="fas fa-chevron-down ml-1"></i>
          </button>
        </div>` : '';

      return `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
          ${imageHtml}
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-bold text-lg">${group.name}</h3>
              <div class="flex gap-1">${classBadge} ${streamBadge}</div>
            </div>
            <p class="text-xs text-gray-500 mb-1"><i class="fas fa-user-tie"></i> ${group.teacherName || 'শিক্ষক'}</p>
            ${descHtml}
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">${joinMethodText}</span>
              <span class="text-xs"><i class="fas fa-users"></i> ${group.studentIds?.length || 0} শিক্ষার্থী</span>
            </div>
            ${actionButton}
          </div>
        </div>`;
    }).join('') : `<div class="col-span-2 text-center p-10 text-gray-400">কোনো কোর্স পাওয়া যায়নি</div>`;

    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <h2 class="text-2xl font-bold mb-2 text-center">কোর্সসমূহ</h2>
        <p class="text-sm text-gray-500 mb-4 text-center">আপনার পছন্দের কোর্স খুঁজুন ও জয়েন করুন</p>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1">সার্চ</label>
              <input type="text" id="course-search-input" class="w-full p-2 border rounded-lg text-sm" placeholder="কোর্সের নাম, শিক্ষক...">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">ক্লাস/লেভেল</label>
              <select id="course-filter-class" class="w-full p-2 border rounded-lg text-sm">
                <option value="all">সব ক্লাস</option>
                ${classOptions}
              </select>
            </div>
            <div id="stream-filter-container" style="display:${filterClass==='Admission'?'block':'none'};">
              <label class="block text-xs font-bold mb-1">শাখা</label>
              <select id="course-filter-stream" class="w-full p-2 border rounded-lg text-sm">
                ${streamOptions}
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="CoursesManager.applyFilter()" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">ফিল্টার</button>
            </div>
          </div>
          ${studentClass ? `<p class="text-xs text-indigo-600 mt-3"><i class="fas fa-graduation-cap"></i> আপনার ক্লাস: ${studentClass} ${studentStream ? '('+studentStream+')' : ''}</p>` : ''}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="course-list-container">
          ${courseCards}
        </div>
      </div>`;

    // Attach events
    const classSelect = document.getElementById('course-filter-class');
    const streamContainer = document.getElementById('stream-filter-container');
    classSelect?.addEventListener('change', function () {
      streamContainer.style.display = this.value === 'Admission' ? 'block' : 'none';
    });
    document.getElementById('course-search-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') CoursesManager.applyFilter();
    });
    // Preselect stream if filtered
    if (filterClass === 'Admission') {
      const streamSelect = document.getElementById('course-filter-stream');
      if (streamSelect) streamSelect.value = document.getElementById('course-filter-stream')?.dataset?.value || 'all';
    }
  },

  applyFilter() {
    this.renderCourseList();
  },

  async joinCourse(groupId, joinMethod, groupCode) {
    if (!navigator.onLine) {
      Swal.fire('অফলাইন', 'ইন্টারনেট সংযোগ ছাড়া কোর্সে জয়েন করা যাবে না।', 'warning');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Public join
      if (joinMethod === 'public') {
        await this.addToGroupDirectly(groupId);
        return;
      }

      // Code join
      if (joinMethod === 'code') {
        const { value: code } = await Swal.fire({
          title: 'কোর্স কোড লিখুন',
          input: 'text',
          inputPlaceholder: 'কোর্স কোড',
          showCancelButton: true,
          inputValidator: (val) => !val ? 'কোর্স কোড আবশ্যক' : null
        });
        if (!code) return;
        if (code !== groupCode) {
          Swal.fire('ত্রুটি', 'ভুল কোর্স কোড', 'error');
          return;
        }
        await this.addToGroupDirectly(groupId);
        return;
      }

      // Permission key join
      if (joinMethod === 'permission') {
        const { value: key } = await Swal.fire({
          title: 'পারমিশন কী লিখুন',
          input: 'text',
          inputPlaceholder: 'যেমন: abcde-12345',
          showCancelButton: true,
          inputValidator: (val) => !val ? 'পারমিশন কী আবশ্যক' : null
        });
        if (!key) return;

        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (!groupDoc.exists()) throw new Error("কোর্স নেই");
        const group = groupDoc.data();

        if (group.permissionKey !== key || group.permissionKeyUsed) {
          Swal.fire('ত্রুটি', 'ভুল বা ব্যবহৃত পারমিশন কী', 'error');
          return;
        }

        await updateDoc(doc(db, "groups", groupId), {
          permissionKeyUsed: true,
          permissionKeyUsedBy: user.uid,
          permissionKeyUsedAt: new Date()
        });

        await this.addToGroupDirectly(groupId);
      }
    } catch (error) {
      Swal.fire('ত্রুটি', error.message, 'error');
    }
  },

  async addToGroupDirectly(groupId) {
    const user = auth.currentUser;
    if (!user) return;

    if ((AppState.joinedGroups || []).find(g => g.groupId === groupId)) {
      Swal.fire('তথ্য', 'আপনি ইতিমধ্যে এই কোর্সে জয়েন করেছেন', 'info');
      return;
    }

    const groupSnap = await getDoc(doc(db, "groups", groupId));
    if (!groupSnap.exists()) throw new Error("কোর্স নেই");
    const groupData = groupSnap.data();

    if (groupData.approvalRequired) {
      await addDoc(collection(db, "join_requests"), {
        studentId: user.uid,
        studentName: AppState.userProfile?.name || user.displayName,
        studentEmail: user.email,
        groupId: groupId,
        teacherId: groupData.teacherId,
        status: 'pending',
        requestedAt: new Date()
      });
      Swal.fire('অনুরোধ পাঠানো হয়েছে', 'শিক্ষক অনুমোদন করলে আপনি কোর্সে যুক্ত হবেন।', 'success');
      return;
    }

    const studentIds = groupData.studentIds || [];
    if (!studentIds.includes(user.uid)) {
      studentIds.push(user.uid);
      await updateDoc(doc(db, "groups", groupId), { studentIds });
    }

    const joined = AppState.joinedGroups || [];
    joined.push({ groupId, groupName: groupData.name });
    await updateDoc(doc(db, "students", user.uid), { joinedGroups: joined });

    AppState.joinedGroups = joined;
    AppState.activeGroupId = groupId;
    localStorage.setItem('activeGroupId', groupId);
    localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));

    Swal.fire('সফল', `"${groupData.name}" কোর্সে জয়েন করেছেন`, 'success').then(() => {
      refreshExamCache();
      Router.student('dashboard');
    });
  }
};

window.CoursesManager = CoursesManager;
