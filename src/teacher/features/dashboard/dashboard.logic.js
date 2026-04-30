// src/teacher/features/dashboard/dashboard.logic.js
// Teacher Dashboard: home view logic, live exam management on home, quick actions

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Teacher } from '../../teacher-core.js';
import { renderDashboardLoading, renderDashboard } from './dashboard.view.js';
import { renderLiveExamCard } from '../management/management.view.js';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { saveFolderStructureToFirebase } from '../realtime-sync/sync.logic.js';

let ExamCache = window.ExamCache;
let folderStructure = window.folderStructure;

export const DashboardLogic = {
  /**
   * Main home view – fetch group data, count exams, detect active live exam.
   */
  async homeView() {
    if (!AppState.selectedGroup) {
      Teacher.selectGroupView('home');
      return;
    }

    document.getElementById('floating-math-btn')?.classList.add('hidden');
    document.getElementById('math-symbols-panel')?.classList.remove('show');

    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = renderDashboardLoading();

    try {
      const groupDoc = await getDoc(doc(db, "groups", AppState.selectedGroup.id));
      let groupData = null;
      let studentCount = 0;
      let groupCode = '';

      if (groupDoc.exists()) {
        groupData = groupDoc.data();
        studentCount = groupData.studentIds ? groupData.studentIds.length : 0;
        groupCode = groupData.groupCode;
      }

      // Pending join requests count
      let pendingCount = 0;
      try {
        const reqQ = query(collection(db, "join_requests"),
          where("groupId", "==", AppState.selectedGroup.id),
          where("status", "==", "pending"));
        const reqSnap = await getDocs(reqQ);
        pendingCount = reqSnap.size;
      } catch(e) {}

      // Exams in cache
      const examsQ = query(collection(db, "exams"),
        where("groupId", "==", AppState.selectedGroup.id));
      const examsSnap = await getDocs(examsQ);

      let liveExams = 0;
      let mockExams = 0;
      let activeLiveExam = null;
      const now = new Date();

      examsSnap.forEach(doc => {
        const ex = { id: doc.id, ...doc.data() };
        ExamCache[ex.id] = ex;

        if (ex.type === 'live') {
          liveExams++;
          if (!ex.isDraft && !ex.cancelled && !ex.resultPublished) {
            const st = ex.startTime ? new Date(ex.startTime) : null;
            const et = ex.endTime ? new Date(ex.endTime) : null;
            if (st && et && now >= st && now <= et) {
              activeLiveExam = ex;
            }
          }
        } else if (ex.type === 'mock') {
          mockExams++;
        }
      });

      // Active live exam card (if any)
      let activeLiveHTML = '';
      if (activeLiveExam) {
        activeLiveHTML = await DashboardLogic.renderActiveLiveExamOnHome(activeLiveExam.id);
      }

      const stats = {
        studentCount,
        liveExams,
        mockExams,
        pendingCount
      };

      appContainer.innerHTML = renderDashboard(groupData, stats, activeLiveHTML);
    } catch (error) {
      console.error('Dashboard load error:', error);
      appContainer.innerHTML = `<div class="text-center p-10 text-red-500 bengali-text">Error loading homepage</div>`;
    }
  },

  /**
   * Render the active live exam card on the home page with live stats.
   */
  async renderActiveLiveExamOnHome(examId) {
    const ex = ExamCache[examId];
    if (!ex) return '';

    // Fetch total submissions for this exam
    let totalSubmitted = 0;
    try {
      const attQ = query(collection(db, "attempts"),
        where("examId", "==", examId));
      const attSnap = await getDocs(attQ);
      totalSubmitted = attSnap.size;
    } catch(e) {}

    const endTimeStr = moment(ex.endTime).format('hh:mm A, DD MMM');
    const titleHTML = window.MathHelper?.renderExamContent(ex.title) || ex.title;
    const subjectHTML = (ex.subject && window.MathHelper) ? window.MathHelper.renderExamContent(ex.subject) : (ex.subject || 'No Subject');
    const chapterHTML = (ex.chapter && window.MathHelper) ? window.MathHelper.renderExamContent(ex.chapter) : (ex.chapter || '');

    return `
      <div class="bg-white dark:bg-dark-secondary rounded-2xl border border-red-200 dark:border-red-900 shadow-md mb-6 overflow-hidden relative">
        <div class="bg-red-50 dark:bg-red-900/30 p-3 border-b border-red-100 dark:border-red-800 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            <span class="font-bold text-red-600 dark:text-red-400 text-sm uppercase tracking-wider bengali-text">Ongoing Live Exam</span>
          </div>
          <button onclick="Teacher.renderActiveLiveExamOnHome('${examId}')" class="text-red-500 hover:text-red-700 bg-white dark:bg-black rounded-full w-8 h-8 flex items-center justify-center shadow-sm transition">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-2xl font-bold dark:text-white bengali-text">${titleHTML}</h3>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 bengali-text">
                <i class="fas fa-book-open mr-1"></i> ${subjectHTML} 
                ${chapterHTML ? '<i class="fas fa-angle-right mx-2 text-xs"></i> ' + chapterHTML : ''}
              </p>
            </div>
            <div class="text-right bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-800/50">
              <div class="text-xs font-bold text-red-400 uppercase tracking-wider mb-1 bengali-text">Ends At</div>
              <div class="text-base font-bold text-red-600 dark:text-red-400"><i class="far fa-clock mr-1"></i> ${endTimeStr}</div>
            </div>
          </div>
          <div class="flex items-center gap-4 bg-gray-50 dark:bg-dark-tertiary rounded-xl p-4 border dark:border-dark-tertiary w-fit mb-6">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-sm"><i class="fas fa-check-double"></i></div>
            <div>
              <div class="text-2xl font-black dark:text-white leading-none">${totalSubmitted}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mt-1 bengali-text">Total Submissions</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-dark-tertiary pt-5">
            <button onclick="Teacher.stopLiveExam('${examId}')" class="bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-bold text-sm transition bengali-text flex items-center justify-center gap-2">
              <i class="fas fa-ban"></i> Cancel Exam
            </button>
            <button onclick="Teacher.extendExamTime('${examId}')" class="bg-amber-100 hover:bg-amber-200 text-amber-700 py-3 rounded-xl font-bold text-sm transition bengali-text flex items-center justify-center gap-2">
              <i class="fas fa-clock"></i> Extend Time
            </button>
            <button onclick="Teacher.publish('${examId}')" class="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition shadow-md bengali-text flex items-center justify-center gap-2">
              <i class="fas fa-bullhorn"></i> Publish Result
            </button>
          </div>
        </div>
      </div>`;
  },

  /**
   * Generate a new permission key and save to Firestore.
   */
  async generatePermissionKeyFromHome(groupId) {
    try {
      const generateKey = () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        let key = '';
        for (let i = 0; i < 5; i++) key += letters.charAt(Math.floor(Math.random() * letters.length));
        key += '-';
        for (let i = 0; i < 5; i++) key += numbers.charAt(Math.floor(Math.random() * numbers.length));
        return key;
      };

      let newKey;
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 20) {
        newKey = generateKey();
        const q = query(collection(db, "groups"),
          where("permissionKey", "==", newKey),
          where("permissionKeyUsed", "==", false));
        const snap = await getDocs(q);
        if (snap.empty) isUnique = true;
        attempts++;
      }

      if (!isUnique) throw new Error('ইউনিক কী জেনারেট করা যায়নি');

      await updateDoc(doc(db, "groups", groupId), {
        permissionKey: newKey,
        permissionKeyUsed: false,
        permissionKeyUsedBy: null,
        permissionKeyUsedAt: null
      });

      Swal.fire({
        title: 'পারমিশন কী তৈরি হয়েছে',
        html: `<p>নতুন পারমিশন কী:</p><code style="font-size:1.5rem;background:#f0f0f0;padding:5px 15px;border-radius:8px;">${newKey}</code>`,
        icon: 'success',
        confirmButtonText: 'কপি করুন'
      }).then(() => {
        navigator.clipboard.writeText(newKey);
        Swal.fire('কপি হয়েছে', '', 'success');
        DashboardLogic.homeView();
      });
    } catch (error) {
      Swal.fire('ত্রুটি', error.message, 'error');
    }
  },

  /**
   * Quick edit join method (public/code/permission).
   */
  async quickEditJoinMethod(groupId, currentMethod) {
    const { value: newMethod } = await Swal.fire({
      title: 'জয়েন মেথড পরিবর্তন',
      input: 'select',
      inputOptions: {
        'public': 'পাবলিক (যে কেউ জয়েন করতে পারবে)',
        'code': 'কোর্স কোড প্রয়োজন',
        'permission': 'পারমিশন কী প্রয়োজন'
      },
      inputValue: currentMethod,
      showCancelButton: true,
      confirmButtonText: 'সংরক্ষণ'
    });

    if (newMethod) {
      try {
        const updateData = { joinMethod: newMethod, updatedAt: new Date() };
        if (currentMethod === 'permission' && newMethod !== 'permission') {
          updateData.permissionKey = null;
          updateData.permissionKeyUsed = false;
          updateData.permissionKeyUsedBy = null;
          updateData.permissionKeyUsedAt = null;
        }
        await updateDoc(doc(db, "groups", groupId), updateData);
        Swal.fire('সফল', 'জয়েন মেথড আপডেট হয়েছে', 'success');
        DashboardLogic.homeView();
      } catch (error) {
        Swal.fire('ত্রুটি', error.message, 'error');
      }
    }
  },

  /**
   * Copy permission key to clipboard.
   */
  copyPermissionKey(key) {
    navigator.clipboard.writeText(key).then(() => {
      Swal.fire('কপি হয়েছে', 'পারমিশন কী কপি করা হয়েছে', 'success');
    });
  }
};

// Attach all dashboard methods to Teacher object
Teacher.homeView = DashboardLogic.homeView;
Teacher.renderActiveLiveExamOnHome = DashboardLogic.renderActiveLiveExamOnHome;
Teacher.generatePermissionKeyFromHome = DashboardLogic.generatePermissionKeyFromHome;
Teacher.quickEditJoinMethod = DashboardLogic.quickEditJoinMethod;
Teacher.copyPermissionKey = DashboardLogic.copyPermissionKey;
