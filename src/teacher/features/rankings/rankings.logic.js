// src/teacher/features/rankings/rankings.logic.js
// Rankings: list published exams, view ranks, student result analysis

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Teacher } from '../../teacher-core.js';
import {
  collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { loadMathJax, MathHelper } from '../../../shared/utils/math-helper.js';

let ExamCache = window.ExamCache;
let unsubscribes = window.unsubscribes;

export const RankingsLogic = {
  /**
   * Show list of published live exams for the selected course.
   */
  async showRankingsList() {
    if (!AppState.selectedGroup) {
      Teacher.selectGroupView?.('rank');
      return;
    }

    document.getElementById('floating-math-btn')?.classList.add('hidden');
    document.getElementById('math-symbols-panel')?.classList.remove('show');

    const app = document.getElementById('app-container');
    app.innerHTML = `
      <div class="pb-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold font-en dark:text-white">Live Exam Rankings</h2>
        </div>
        <div id="rank-course-info-card" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden mb-6">
          <div class="p-5">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600">
                <i class="fas fa-book"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-bold dark:text-white">${AppState.selectedGroup.name}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">বর্তমান কোর্স</p>
              </div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Only showing published live exams for the selected course.</p>
        <div id="rank-exams-list" class="text-center p-10">
          <div class="quick-loader mx-auto"></div>
        </div>
      </div>`;

    // Load published live exams from ExamCache
    const exams = Object.values(ExamCache)
      .filter(e => e.type === 'live' && e.groupId === AppState.selectedGroup.id && e.resultPublished && !e.cancelled)
      .sort((a, b) => b.createdAt - a.createdAt);

    const container = document.getElementById('rank-exams-list');
    if (!container) return;

    if (exams.length === 0) {
      container.innerHTML = '<div class="text-center p-10 text-gray-400">No published live exams found</div>';
      return;
    }

    let html = '';
    exams.forEach(e => {
      const date = e.createdAt?.toDate ? moment(e.createdAt.toDate()).format('DD MMM, YYYY') : '';
      html += `
        <div onclick="Teacher.viewRank('${e.id}', '${e.title.replace(/'/g, "\\'")}')" class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group mb-3">
          <div class="flex justify-between items-start mb-3">
            <span class="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Live</span>
            <div class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition">
              <i class="fas fa-trophy text-sm"></i>
            </div>
          </div>
          <div class="font-bold text-sm text-gray-800 dark:text-white mb-2" style="line-height:1.4;">${e.title}</div>
          <div class="text-xs text-gray-400">${date}</div>
          <div class="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">View Rank <i class="fas fa-arrow-right text-xs"></i></div>
        </div>`;
    });
    container.innerHTML = html;
  },

  /**
   * View rank list of a specific exam with realtime snapshot.
   */
  async viewRank(examId, title) {
    const app = document.getElementById('app-container');
    app.innerHTML = '<div class="p-10 text-center"><div class="quick-loader mx-auto"></div><p class="mt-2 text-xs">Loading rankings...</p></div>';

    try {
      const exSnap = await getDoc(doc(db, "exams", examId));
      if (!exSnap.exists()) {
        Swal.fire('Error', 'Exam information not found.', 'error');
        this.showRankingsList();
        return;
      }

      const exam = { id: exSnap.id, ...exSnap.data() };
      let questions = [];
      try {
        questions = JSON.parse(exam.questions);
      } catch (e) { /* ignore */ }

      const q = query(
        collection(db, "attempts"),
        where("examId", "==", examId),
        orderBy("score", "desc"),
        orderBy("submittedAt", "asc")
      );

      const unsub = onSnapshot(q, (snap) => {
        let rows = '';
        let highest = 0;

        if (snap.empty) {
          app.innerHTML = `
            <div class="pb-6">
              <button onclick="Teacher.rankView()" class="mb-4 text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 bg-white dark:bg-gray-800 border dark:border-gray-700 px-3 py-2 rounded-lg transition">
                <i class="fas fa-arrow-left mr-1"></i> Rankings
              </button>
              <div class="text-center p-10 text-gray-500">No one has participated in this exam yet.</div>
            </div>`;
          return;
        }

        snap.docs.forEach((d, i) => {
          const a = d.data();
          const scoreValue = parseFloat(a.score) || 0;
          if (scoreValue > highest) highest = scoreValue;

          let accuracy = "0";
          if (questions.length > 0 && a.answers && Array.isArray(a.answers)) {
            const correct = questions.reduce((acc, cur, idx) => {
              return acc + (a.answers[idx] !== undefined && a.answers[idx] === cur.correct ? 1 : 0);
            }, 0);
            accuracy = ((correct / questions.length) * 100).toFixed(1);
          }

          rows += `
            <div onclick="Teacher.viewUserResult('${d.id}')" class="flex items-center p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all">
              <div class="w-8 text-center text-xs font-bold text-gray-400">${i + 1}</div>
              <div class="flex-1 ml-3">
                <div class="font-bold text-sm dark:text-white">${a.userName || 'Unknown Student'}</div>
                <div class="text-[9px] text-gray-500 uppercase">Accuracy: ${accuracy}% | Time: ${a.submittedAt?.toDate ? moment(a.submittedAt.toDate()).format('h:mm A') : ''}</div>
              </div>
              <div class="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50 px-3 py-1 rounded text-xs">${scoreValue.toFixed(2)}</div>
            </div>`;
        });

        app.innerHTML = `
          <div class="pb-6">
            <button onclick="Teacher.rankView()" class="mb-4 text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 bg-white dark:bg-gray-800 border dark:border-gray-700 px-3 py-2 rounded-lg transition">
              <i class="fas fa-arrow-left mr-1"></i> Rankings
            </button>
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg mb-6 text-center">
              <h3 class="font-bold text-white text-lg">${title}</h3>
              <div class="grid grid-cols-2 gap-4 mt-5">
                <div class="bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <div class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Students</div>
                  <div class="text-xl font-bold text-white">${snap.size}</div>
                </div>
                <div class="bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <div class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Highest Score</div>
                  <div class="text-xl font-bold text-emerald-400">${highest.toFixed(2)}</div>
                </div>
              </div>
              <div class="mt-3 flex justify-end">
                <button onclick="Teacher.openExamAnalysis('${examId}')" class="text-indigo-300 hover:text-indigo-100 px-3 py-1 rounded-full text-xs font-bold transition border border-indigo-500/50">
                  <i class="fas fa-chart-bar mr-1"></i> Analysis
                </button>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm">
              <div class="bg-gray-50 dark:bg-gray-700/50 p-3 text-[10px] font-bold text-gray-500 flex uppercase tracking-widest border-b dark:border-gray-700">
                <div class="w-8 text-center">Pos</div>
                <div class="flex-1 ml-3">Student Details</div>
                <div>Score</div>
              </div>
              <div class="max-h-[60vh] overflow-y-auto">${rows}</div>
            </div>
            <p class="text-[10px] text-gray-400 text-center mt-4 italic">Click to view student's detailed answer script</p>
          </div>`;
      });

      unsubscribes.push(unsub);
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Failed to load rankings.', 'error');
      this.showRankingsList();
    }
  }
};

// Attach to global Teacher object
Teacher.rankView = RankingsLogic.showRankingsList;
Teacher.viewRank = RankingsLogic.viewRank;
