// src/student/features/courses/courses.logic.js
// Course listing, filtering, joining logic – description expand/collapse,
// persistent search & filter state, class badge on cards,
// ONLY SHOW COURSES THAT HAVE A CLASS LEVEL,
// Unread notice counts displayed on each course card,
// NEW: Quick join by permission key

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

    const currentSearchTerm = (document.getElementById('course-search-input')?.value || '').trim();
    const currentFilterClass = document.getElementById('course-filter-class')?.value || 'all';
    const currentStreamFilter = document.getElementById('course-filter-stream')?.value || 'all';
    const currentPermissionKey = (document.getElementById('quick-join-key')?.value || '').trim();

    const searchTerm = currentSearchTerm.toLowerCase();

    // Only courses with a class level
    let filtered = allGroups.filter(g => {
      if (!g.classLevel) return false;
      if (currentFilterClass !== 'all') {
        if (g.classLevel !== currentFilterClass) return false;
        if (currentFilterClass === 'Admission') {
          if (currentStreamFilter && currentStreamFilter !== 'all' && g.admissionStream !== currentStreamFilter) return false;
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

    // Sort matching class first
    filtered.sort((a, b) => {
      if (a.classLevel === studentClass && b.classLevel !== studentClass) return -1;
      if (a.classLevel !== studentClass && b.classLevel === studentClass) return 1;
      return 0;
    });

    const classLevels = ['6', '7', '8', 'SSC', 'HSC', 'Admission'];
    const classOptions = classLevels.map(lvl => {
      const selected = lvl === currentFilterClass ? 'selected' : '';
      const label = lvl === 'Admission' ? 'এডমিশন' : (lvl === 'SSC' ? 'এসএসসি' : (lvl === 'HSC' ? 'এইচএসসি' : lvl + 'ম শ্রেণী'));
      return `<option value="${lvl}" ${selected}>${label}</option>`;
    }).join('');

    const streamOptions = `
      <option value="all" ${currentStreamFilter === 'all' ? 'selected' : ''}>সব শাখা</option>
      <option value="Science" ${currentStreamFilter === 'Science' ? 'selected' : ''}>সায়েন্স</option>
      <option value="Humanities" ${currentStreamFilter === 'Humanities' ? 'selected' : ''}>মানবিক</option>
      <option value="Commerce" ${currentStreamFilter === 'Commerce' ? 'selected' : ''}>কমার্স</option>`;

    const unreadCounts = AppState.unreadNoticeCounts || {};

    const courseCards = filtered.length > 0 ? filtered.map(group => {
      const isJoined = joinedGroupIds.includes(group.id);
      const joinMethodText = {
        public: 'পাবলিক',
        code: 'কোর্স কোড',
        permission: 'পারমিশন কী'
      }[group.joinMethod] || 'কোর্স কোড';

      const classBadge = group.classLevel ?
        `<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">${group.classLevel === 'Admission' ? 'এডমিশন' : group.classLevel}</span>` : '';
      const streamBadge = group.admissionStream ?
        `<span class="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 ml-1">${group.admissionStream}</span>` : '';

      const unread = unreadCounts[group.id] || 0;
      const unreadBadge = unread > 0 ? `<span class="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">${unread}</span>` : '';

      const imageHtml = group.imageUrl ?
        `<div class="relative"><img src="${group.imageUrl}" class="w-full h-36 object-cover rounded-t-xl" alt="${group.name}">${unreadBadge}</div>` :
        `<div class="relative"><div class="w-full h-36 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-3xl text-indigo-400 rounded-t-xl"><i class="fas fa-book-open"></i></div>${unreadBadge}</div>`;

      const actionButton = isJoined
        ? `<button class="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-2 rounded-lg text-sm font-bold" disabled><i class="fas fa-check-circle"></i> জয়েন করেছেন</button>`
        : `<button onclick="CoursesManager.joinCourse('${group.id}', '${group.joinMethod}', '${group.groupCode || ''}')" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">জয়েন করুন</button>`;

      const desc = group.description || '';
      const descHtml = desc ? `
        <div class="mb-3">
          <p id="desc-${group.id}" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">${desc}</p>
          <button onclick="const d=document.getElementById('desc-${group.id}'); const clamped=d.classList.toggle('line-clamp-1'); this.innerHTML=clamped?'আরও দেখুন <i class=\\'fas fa-chevron-down ml-1\\'></i>':'লুকান <i class=\\'fas fa-chevron-up ml-1\\'></i>';" class="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1 inline-flex items-center">
            আরও দেখুন <i class="fas fa-chevron-down ml-1"></i>
          </button>
        </div>` : '<div class="mb-3"></div>';

      return `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition hover:shadow-md">
          ${imageHtml}
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-bold text-lg dark:text-white">${group.name}</h3>
              <div class="flex items-center gap-1">${classBadge}${streamBadge}</div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1"><i class="fas fa-user-tie"></i> ${group.teacherName || 'শিক্ষক'}</p>
            ${descHtml}
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">${joinMethodText}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400"><i class="fas fa-users"></i> ${group.studentIds?.length || 0} শিক্ষার্থী</span>
            </div>
            ${actionButton}
          </div>
        </div>`;
    }).join('') : `<div class="col-span-2 text-center p-10 text-gray-400">কোনো কোর্স পাওয়া যায়নি</div>`;

    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <h2 class="text-2xl font-bold mb-2 text-center dark:text-white">কোর্সসমূহ</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">আপনার পছন্দের কোর্স খুঁজুন ও জয়েন করুন</p>

        <!-- Filters & Quick Join -->
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">সার্চ</label>
              <input type="text" id="course-search-input" class="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" placeholder="কোর্সের নাম, শিক্ষক...">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">ক্লাস/লেভেল</label>
              <select id="course-filter-class" class="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
                <option value="all">সব ক্লাস</option>
                ${classOptions}
              </select>
            </div>
            <div id="stream-filter-container" style="display:${currentFilterClass === 'Admission' ? 'block' : 'none'};">
              <label class="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">শাখা</label>
              <select id="course-filter-stream" class="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
                ${streamOptions}
              </select>
            </div>
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <label class="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">পারমিশন কী</label>
                <input type="text" id="quick-join-key" class="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" placeholder="পারমিশন কী">
              </div>
              <button onclick="CoursesManager.quickJoinByPermissionKey()" class="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition">
                জয়েন
              </button>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <div>
              ${studentClass ? `<p class="text-xs text-indigo-600 dark:text-indigo-400"><i class="fas fa-graduation-cap"></i> আপনার ক্লাস: ${studentClass} ${studentStream ? '(' + studentStream + ')' : ''}</p>` : ''}
            </div>
            <button onclick="CoursesManager.applyFilter()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
              ফিল্টার
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="course-list-container">
          ${courseCards}
        </div>
      </div>`;

    // Restore values
    const searchInput = document.getElementById('course-search-input');
    if (searchInput) {
      searchInput.value = currentSearchTerm;
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') CoursesManager.applyFilter();
      });
    }

    const classSelect = document.getElementById('course-filter-class');
    const streamContainer = document.getElementById('stream-filter-container');
    if (classSelect) {
      classSelect.value = currentFilterClass;
      classSelect.addEventListener('change', function () {
        streamContainer.style.display = this.value === 'Admission' ? 'block' : 'none';
      });
    }

    const streamSelect = document.getElementById('course-filter-stream');
    if (streamSelect) streamSelect.value = currentStreamFilter;

    // Restore permission key input value
    const permInput = document.getElementById('quick-join-key');
    if (permInput) {
      permInput.value = currentPermissionKey;
      permInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') CoursesManager.quickJoinByPermissionKey();
      });
    }
  },

  applyFilter() {
    this.renderCourseList();
  },

  // NEW: Quick join using a permission key
  async quickJoinByPermissionKey() {
    const keyInput = document.getElementById('quick-join-key');
    const key = keyInput ? keyInput.value.trim() : '';
    if (!key) {
      Swal.fire('ত্রুটি', 'পারমিশন কী আবশ্যক', 'error');
      return;
    }

    if (!navigator.onLine) {
      Swal.fire('অফলাইন', 'ইন্টারনেট সংযোগ ছাড়া জয়েন করা যাবে না', 'warning');
      return;
    }

    try {
      // Find group by permission key, not used, and joinMethod = permission
      const groupsSnap = await getDocs(query(
        collection(db, "groups"),
        where("joinMethod", "==", "permission"),
        where("permissionKey", "==", key),
        where("permissionKeyUsed", "==", false)
      ));

      if (groupsSnap.empty) {
        Swal.fire('ত্রুটি', 'কোনো মিল পাওয়া যায়নি অথবা কী ব্যবহৃত হয়েছে', 'error');
        return;
      }

      // There should be only one unique permission key, but take the first
      const groupDoc = groupsSnap.docs[0];
      const group = { id: groupDoc.id, ...groupDoc.data() };

      // Show modal
      Swal.fire({
        title: `<span class="text-lg font-bold">"${group.name}" কোর্সে যুক্ত করা হচ্ছে</span>`,
        html: `<p class="text-sm text-gray-500">অপেক্ষা করুন...</p>`,
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Mark permission key as used
      await updateDoc(doc(db, "groups", group.id), {
        permissionKeyUsed: true,
        permissionKeyUsedBy: auth.currentUser.uid,
        permissionKeyUsedAt: new Date()
      });

      // Add student to group (directly or approval)
      await this.addToGroupDirectly(group.id);

      Swal.fire({
        title: 'স্বাগতম!',
        html: `<p class="text-sm">আপনি <strong>"${group.name}"</strong> কোর্সে সফলভাবে যুক্ত হয়েছেন।</p>`,
        icon: 'success',
        confirmButtonText: 'চলুন'
      }).then(() => {
        // Navigate to dashboard
        Router.student('dashboard');
      });
    } catch (error) {
      console.error(error);
      Swal.fire('ত্রুটি', 'কোর্সে যুক্ত হতে ব্যর্থ: ' + error.message, 'error');
    }
  },

  async joinCourse(groupId, joinMethod, groupCode) {
    if (!navigator.onLine) {
      Swal.fire('অফলাইন', 'ইন্টারনেট সংযোগ ছাড়া কোর্সে জয়েন করা যাবে না।', 'warning');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      if (joinMethod === 'public') {
        await this.addToGroupDirectly(groupId);
        return;
      }

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
      // Already joined, still show success
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
      // Still show success for quick join? Yes, but inform approval pending.
      Swal.fire({
        title: 'অনুরোধ পাঠানো হয়েছে',
        text: 'শিক্ষক অনুমোদন করলে আপনি কোর্সে যুক্ত হবেন।',
        icon: 'info'
      });
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
    refreshExamCache();
  }
};

window.CoursesManager = CoursesManager;
