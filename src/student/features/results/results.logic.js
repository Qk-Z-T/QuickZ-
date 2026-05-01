// src/student/features/results/results.logic.js
// Student results listing, filtering, and detailed result view

import { auth, db } from '../../../shared/config/firebase.js';
import { AppState, ExamCache, unsubscribes } from '../../core/state.js';
import { Router } from '../../core/router.js';
import { loadMathJax } from '../../../shared/utils/dom-helper.js';
import { MathHelper } from '../../../shared/utils/math-helper.js';
import { StarRating } from '../../core/state.js';
import {
  doc, getDoc, collection, query, where, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ---------- Local mutable filter & state ----------
let resultTypeFilter = 'live';
let resultsSubjectFilter = 'all';
let currentResultPage = 1;
let resultFilter = 'all';
let filteredQuestions = [];

export const ResultsManager = {
  async loadResults() {
    const myRouteId = window.currentRouteId;
    if (AppState.userDisabled) {
      Swal.fire('প্রবেশাধিকার নেই', 'আপনার অ্যাকাউন্ট নিষ্ক্রিয়।', 'warning');
      return;
    }
    if (!AppState.activeGroupId) {
      Swal.fire('কোর্স প্রয়োজন', 'প্রথমে কোর্সে জয়েন করুন', 'warning').then(() => StudentDashboard.showGroupCodeModal?.());
      return;
    }

    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;
    contentEl.innerHTML = '<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>';

    if (!navigator.onLine) {
      contentEl.innerHTML = '<div class="p-10 text-center text-gray-400"><i class="fas fa-wifi-slash text-4xl mb-3 opacity-30"></i><p>ফলাফল দেখতে ইন্টারনেট সংযোগ প্রয়োজন।</p></div>';
      return;
    }

    const uid = auth.currentUser.uid;
    const snap = await getDocs(query(collection(db, "attempts"), where("userId", "==", uid), orderBy("submittedAt", "desc")));
    if (myRouteId !== window.currentRouteId) return;

    if (snap.empty) {
      contentEl.innerHTML = '<div class="p-10 text-center text-gray-400">আপনি এখনো কোনো পরীক্ষা দেননি।</div>';
      return;
    }

    const attempts = [];
    snap.forEach(d => attempts.push({ id: d.id, ...d.data() }));

    const subjectsSet = new Set();
    const resultsData = { live: [], mock: [] };

    for (const attempt of attempts) {
      try {
        const exam = ExamCache[attempt.examId];
        if (!exam || exam.groupId !== AppState.activeGroupId) continue;

        const isCancelled = exam.cancelled;
        const isPublic = !isCancelled && (exam.type === 'mock' || exam.resultPublished);
        if (isCancelled && !exam.resultPublished) continue;

        const subject = exam.subject || 'Uncategorized';
        subjectsSet.add(subject);

        const item = { attempt, exam, subject };
        if (attempt.isPractice || exam.type === 'mock') {
          resultsData.mock.push(item);
        } else {
          resultsData.live.push(item);
        }
      } catch (e) { console.error(e); }
    }

    const subjectList = Array.from(subjectsSet).sort();
    let filterBtns = `<button class="px-3 py-1 rounded-full text-xs font-bold ${resultsSubjectFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}" onclick="ResultsManager.setSubjectFilter('all')">সব</button>`;
    subjectList.forEach(s => {
      filterBtns += `<button class="px-3 py-1 rounded-full text-xs font-bold ${resultsSubjectFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}" onclick="ResultsManager.setSubjectFilter('${s}')">${s}</button>`;
    });

    const renderCard = (item) => {
      const { attempt, exam } = item;
      return `
        <div class="bg-white dark:bg-gray-800 p-4 mb-3 rounded-2xl border shadow-sm">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-bold text-sm">${attempt.examTitle}</div>
              <div class="text-xs text-gray-500 mt-1">${attempt.submittedAt ? moment(attempt.submittedAt.toDate()).format('DD MMM, h:mm A') : ''}</div>
              <div class="text-[10px] mt-1">
                <span class="px-2 py-1 rounded ${attempt.isPractice ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}">${attempt.isPractice ? 'মক' : 'লাইভ'}</span>
                <span class="ml-1 text-gray-500">${exam.subject || ''}</span>
              </div>
            </div>
            <div class="text-xl font-bold">${parseFloat(attempt.score).toFixed(2)}</div>
          </div>
          <div class="mt-3 pt-3 border-t">
            <button onclick="ResultsManager.viewDetailedResult('${attempt.id}')" class="w-full bg-emerald-50 text-emerald-700 py-2 rounded-lg text-xs font-bold border border-emerald-100">ফলাফল</button>
          </div>
        </div>`;
    };

    let filteredLive = resultsData.live.filter(i => resultsSubjectFilter === 'all' || i.subject === resultsSubjectFilter);
    let filteredMock = resultsData.mock.filter(i => resultsSubjectFilter === 'all' || i.subject === resultsSubjectFilter);

    const liveActive = resultTypeFilter === 'live' ? 'active border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500';
    const mockActive = resultTypeFilter === 'mock' ? 'active border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500';

    contentEl.innerHTML = `
      <div class="p-5 pb-20">
        <div class="flex justify-center gap-6 mb-4">
          <button onclick="ResultsManager.setResultType('live')" class="text-sm font-bold pb-1 ${liveActive}">লাইভ (${filteredLive.length})</button>
          <button onclick="ResultsManager.setResultType('mock')" class="text-sm font-bold pb-1 ${mockActive}">মক (${filteredMock.length})</button>
        </div>
        <div class="flex gap-2 mb-4 overflow-x-auto justify-center">${filterBtns}</div>
        <div id="results-container">
          ${(resultTypeFilter === 'live' ? filteredLive : filteredMock).map(renderCard).join('') || '<div class="text-center py-20 text-gray-400">কোনো ফলাফল নেই</div>'}
        </div>
      </div>
    `;
  },

  setResultType(type) {
    resultTypeFilter = type;
    this.loadResults();
  },

  setSubjectFilter(subject) {
    resultsSubjectFilter = subject;
    this.loadResults();
  },

  async viewDetailedResult(attemptId) {
    if (AppState.userDisabled) return;
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;
    contentEl.innerHTML = '<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>';

    try {
      console.log('🔍 Fetching attempt:', attemptId);
      const attSnap = await getDoc(doc(db, "attempts", attemptId));
      console.log('✅ Attempt exists:', attSnap.exists());
      if (!attSnap.exists()) throw new Error("ফলাফল পাওয়া যায়নি");
      const att = attSnap.data();

      const exSnap = await getDoc(doc(db, "exams", att.examId));
      if (!exSnap.exists()) throw new Error("পরীক্ষার তথ্য পাওয়া যায়নি");
      const exam = exSnap.data();

      let questions;
      try {
        questions = JSON.parse(exam.questions);
      } catch(e) {
        throw new Error("প্রশ্নপত্র পার্স করতে ব্যর্থ");
      }
      const qs = questions;

      currentResultPage = 1;
      resultFilter = 'all';
      filteredQuestions = [...qs];

      const totalQ = qs.length;
      const correct = qs.reduce((acc, q, i) => acc + (att.answers[i] === q.correct ? 1 : 0), 0);
      const accuracy = totalQ > 0 ? ((correct / totalQ) * 100) : 0;
      const wrong = att.answers.reduce((acc, a, i) => acc + (a !== null && a !== qs[i].correct ? 1 : 0), 0);
      const skipped = att.answers.filter(a => a === null).length;
      let timeStr = 'N/A';
      if (att.submittedAt && att.startedAt) {
        const diff = Math.floor((att.submittedAt.toDate() - att.startedAt.toDate()) / 1000);
        const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
        timeStr = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
      }

      const renderQuestions = (subQuestions) => {
        let h = '';
        subQuestions.forEach(q => {
          const idx = qs.indexOf(q);
          const u = att.answers[idx];
          const corr = q.correct;
          const st = u === corr ? 'correct' : u === null ? 'skipped' : 'wrong';
          const badge = st === 'correct' ? '<span class="text-green-600 font-bold text-xs">সঠিক</span>' : st === 'skipped' ? '<span class="text-amber-600 font-bold text-xs">স্কিপ</span>' : '<span class="text-red-600 font-bold text-xs">ভুল</span>';
          const qText = MathHelper.renderExamContent(q.q);
          h += `<div class="ans-card ${st} p-4 rounded-xl mb-4 bg-white dark:bg-gray-800 shadow-sm border">
            <div class="flex justify-between mb-2"><span class="font-bold text-sm">প্রশ্ন ${idx+1}</span>${badge}</div>
            <p class="text-sm font-semibold mb-3">${qText}</p>
            <div class="space-y-1">
              ${q.options.map((opt, oi) => {
                const optText = MathHelper.renderExamContent(opt);
                let cls = 'opt-res bg-white dark:bg-gray-700';
                if (oi === corr) cls += ' right bg-green-50 dark:bg-green-900';
                else if (oi === u) cls += ' wrong-select bg-red-50 dark:bg-red-900';
                return `<div class="${cls}"><span>${String.fromCharCode(65+oi)}. ${optText}</span> ${oi === corr ? '<i class="fas fa-check text-green-600"></i>' : oi === u ? '<i class="fas fa-times text-red-600"></i>' : ''}</div>`;
              }).join('')}
            </div>
            ${q.expl ? `<div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs">${MathHelper.renderExamContent(q.expl)}</div>` : ''}
          </div>`;
        });
        return h;
      };

      const updateView = () => {
        const perPage = 25;
        const start = (currentResultPage - 1) * perPage;
        const currentQs = filteredQuestions.slice(start, start + perPage);
        const totalPages = Math.ceil(filteredQuestions.length / perPage);

        const filterBtns = `
          <div class="flex gap-2 mb-4 overflow-x-auto justify-center">
            <button onclick="ResultsManager.setResultFilter('all')" class="filter-btn ${resultFilter === 'all' ? 'bg-indigo-600 text-white' : ''}">সব</button>
            <button onclick="ResultsManager.setResultFilter('correct')" class="filter-btn ${resultFilter === 'correct' ? 'bg-indigo-600 text-white' : ''}">সঠিক</button>
            <button onclick="ResultsManager.setResultFilter('wrong')" class="filter-btn ${resultFilter === 'wrong' ? 'bg-indigo-600 text-white' : ''}">ভুল</button>
            <button onclick="ResultsManager.setResultFilter('skipped')" class="filter-btn ${resultFilter === 'skipped' ? 'bg-indigo-600 text-white' : ''}">স্কিপ</button>
          </div>`;

        const pagination = totalPages > 1 ? `
          <div class="flex justify-center items-center gap-4 mt-4">
            <button onclick="ResultsManager.prevResultPage()" class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50" ${currentResultPage === 1 ? 'disabled' : ''}>পূর্ববর্তী</button>
            <span class="text-xs">পৃষ্ঠা ${currentResultPage}/${totalPages}</span>
            <button onclick="ResultsManager.nextResultPage()" class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50" ${currentResultPage === totalPages ? 'disabled' : ''}>পরবর্তী</button>
          </div>` : '';

        contentEl.innerHTML = `
          <div class="p-5 pb-24">
            <button onclick="Router.student('results')" class="mb-4 text-xs font-bold text-gray-500"><i class="fas fa-arrow-left"></i> ফলাফল তালিকা</button>
            <div class="compact-summary-card">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <div class="font-bold text-lg">${exam.title}</div>
                  <div class="text-xs text-gray-500">${moment(att.submittedAt.toDate()).format('lll')}</div>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold text-indigo-600">${parseFloat(att.score).toFixed(2)}</div>
                  <div class="text-xs text-green-600 font-bold">${accuracy.toFixed(1)}% নির্ভুলতা</div>
                </div>
              </div>
              <div class="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold">${totalQ}</div><div class="text-[10px] text-gray-500">মোট</div></div>
                <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold text-green-600">${correct}</div><div class="text-[10px] text-gray-500">সঠিক</div></div>
                <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold text-red-500">${wrong}</div><div class="text-[10px] text-gray-500">ভুল</div></div>
                <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold">${skipped}</div><div class="text-[10px] text-gray-500">স্কিপ</div></div>
                <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><div class="font-bold">${timeStr}</div><div class="text-[10px] text-gray-500">সময়</div></div>
                <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">${StarRating(accuracy)}</div>
              </div>
            </div>
            ${filterBtns}
            ${renderQuestions(currentQs)}
            ${pagination}
          </div>`;
        loadMathJax(null, contentEl);
      };

      // Attach filter/pagination methods
      this.setResultFilter = (f) => {
        resultFilter = f;
        currentResultPage = 1;
        if (f === 'all') {
          filteredQuestions = [...qs];
        } else {
          filteredQuestions = qs.filter((q, i) => {
            const u = att.answers[i];
            const st = u === q.correct ? 'correct' : u === null ? 'skipped' : 'wrong';
            return st === f;
          });
        }
        updateView();
      };

      this.prevResultPage = () => {
        if (currentResultPage > 1) {
          currentResultPage--;
          updateView();
        }
      };

      this.nextResultPage = () => {
        if (currentResultPage < Math.ceil(filteredQuestions.length / 25)) {
          currentResultPage++;
          updateView();
        }
      };

      updateView();
    } catch (error) {
      console.error('❌ Detailed result error:', error);
      Swal.fire('ত্রুটি', 'ফলাফল লোড ব্যর্থ', 'error');
      Router.student('results');
    }
  }
};

window.ResultsManager = ResultsManager;
