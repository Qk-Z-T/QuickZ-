// src/student/features/exam-taking/exam.logic.js
// Exam taking logic: start, submit, timer, auto-save, mark answers

import { auth, db } from '../../../shared/config/firebase.js';
import { AppState, ExamCache } from '../../core/state.js';
import { loadMathJax } from '../../../shared/utils/dom-helper.js';
import { MathHelper } from '../../../shared/utils/math-helper.js';
import { DB } from '../../../shared/services/db.service.js';
import {
  doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export const Exam = {
  d: null,           // current exam object (without correct answers for UI)
  ans: [],           // user answers (index -> option index)
  marked: [],        // marked-for-review flags
  t: null,           // timer interval ID
  currentPage: 0,
  isPractice: false,
  startedAt: null,
  currentAttemptId: null,
  autoSaveInterval: null,

  async start(examId, forcePractice = false) {
    if (AppState.userDisabled) {
      Swal.fire('প্রবেশাধিকার নেই', 'আপনার অ্যাকাউন্ট নিষ্ক্রিয়।', 'warning');
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'পরীক্ষা শুরু করবেন?',
      text: 'একবার শুরু করলে সময় গণনা শুরু হবে। আপনি কি নিশ্চিত?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'হ্যাঁ, শুরু করুন',
      cancelButtonText: 'না'
    });
    if (!confirmResult.isConfirmed) return;

    try {
      // 1. Fetch exam data
      let examData;
      if (navigator.onLine) {
        const docSnap = await getDoc(doc(db, "exams", examId));
        if (!docSnap.exists()) throw new Error('পরীক্ষা পাওয়া যায়নি');
        examData = { id: docSnap.id, ...docSnap.data() };
      } else {
        // offline fallback
        examData = this._loadFromCache(examId);
        if (!examData) {
          Swal.fire('অফলাইন', 'পরীক্ষার ডেটা ক্যাশে নেই। ইন্টারনেট সংযোগ দিন।', 'error');
          return;
        }
      }

      const exam = examData;
      const uid = auth.currentUser.uid;
      const isLive = exam.type === 'live' && !forcePractice;

      let questions;
      try {
        questions = JSON.parse(exam.questions);
        if (!Array.isArray(questions) || questions.length === 0) throw new Error();
      } catch (e) {
        Swal.fire('ত্রুটি', 'প্রশ্নপত্র ফরম্যাট সঠিক নয়', 'error');
        return;
      }

      // 2. Handle attempts (live only)
      if (isLive) {
        if (navigator.onLine) {
          const attemptQuery = query(
            collection(db, "attempts"),
            where("userId", "==", uid),
            where("examId", "==", examId),
            where("isPractice", "==", false)
          );
          const attemptSnap = await getDocs(attemptQuery);

          let existingAttempt = null;
          attemptSnap.forEach(doc => {
            const data = doc.data();
            if (!data.submittedAt) existingAttempt = { id: doc.id, ...data };
          });

          if (existingAttempt) {
            // resume existing attempt
            this.currentAttemptId = existingAttempt.id;
            this.ans = existingAttempt.answers || new Array(questions.length).fill(null);
            this.marked = existingAttempt.markedAnswers || new Array(questions.length).fill(false);
            this.startedAt = existingAttempt.startedAt?.toDate() || new Date();
          } else {
            // check if already submitted
            const submittedSnap = await getDocs(attemptQuery);
            let hasSubmitted = false;
            submittedSnap.forEach(d => { if (d.data().submittedAt) hasSubmitted = true; });
            if (hasSubmitted) {
              Swal.fire('অংশগ্রহণ সম্পন্ন', 'আপনি ইতিমধ্যে এই পরীক্ষায় জমা দিয়েছেন।', 'info');
              return;
            }
            // create new attempt
            const newAttemptRef = await addDoc(collection(db, "attempts"), {
              userId: uid,
              userName: AppState.userProfile?.name || auth.currentUser.displayName,
              examId,
              examTitle: exam.title,
              status: 'in-progress',
              startedAt: new Date(),
              answers: [],
              markedAnswers: [],
              score: 0,
              isPractice: false,
              groupId: AppState.activeGroupId
            });
            this.currentAttemptId = newAttemptRef.id;
            this.ans = new Array(questions.length).fill(null);
            this.marked = new Array(questions.length).fill(false);
            this.startedAt = new Date();
          }
        } else {
          // offline live exam – create local attempt
          const localId = 'local_' + Date.now() + '_' + examId;
          this.currentAttemptId = localId;
          this.ans = new Array(questions.length).fill(null);
          this.marked = new Array(questions.length).fill(false);
          this.startedAt = new Date();
        }
      } else {
        // mock / practice – always fresh
        this.ans = new Array(questions.length).fill(null);
        this.marked = new Array(questions.length).fill(false);
        this.startedAt = new Date();
        this.currentAttemptId = null;
      }

      // 3. Remove correct answers from UI questions
      const questionsWithoutCorrect = questions.map(({ correct, ...rest }) => rest);
      this.d = { ...exam, qs: questionsWithoutCorrect, fullQuestions: questions };
      this.currentPage = 0;
      this.isPractice = forcePractice || exam.type === 'mock';

      document.getElementById('review-panel-btn')?.classList.remove('hidden');

      await this.render();
      this.runTimer(exam.duration * 60);
      this.updateReviewPanel();

      if (isLive) this.startAutoSave();
    } catch (error) {
      console.error(error);
      Swal.fire('ত্রুটি', 'পরীক্ষা শুরু করতে সমস্যা', 'error');
    }
  },

  _loadFromCache(examId) {
    if (ExamCache && ExamCache[examId]) return ExamCache[examId];
    if (!AppState.activeGroupId) return null;
    const cached = localStorage.getItem('offlineExamCache_' + AppState.activeGroupId);
    if (!cached) return null;
    const cacheObj = JSON.parse(cached);
    return cacheObj[examId] || null;
  },

  startAutoSave() {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = setInterval(async () => {
      if (!this.currentAttemptId || !this.d) return;
      const progress = {
        firestoreId: this.currentAttemptId,
        answers: this.ans,
        markedAnswers: this.marked,
        status: 'in-progress',
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('currentExamProgress', JSON.stringify(progress));

      if (navigator.onLine && !this.currentAttemptId.startsWith('local_')) {
        try {
          await updateDoc(doc(db, "attempts", this.currentAttemptId), {
            answers: this.ans,
            markedAnswers: this.marked,
            lastSaved: new Date()
          });
        } catch(e) { console.warn('Online save failed', e); }
      }
    }, 20000);
  },

  toggleMark(index) {
    this.marked[index] = !this.marked[index];
    const btn = document.getElementById(`mark-btn-${index}`);
    if (btn) {
      if (this.marked[index]) {
        btn.classList.add('text-amber-500');
        btn.classList.remove('text-gray-400');
        btn.innerHTML = '<i class="fas fa-bookmark"></i> চিহ্নিত';
      } else {
        btn.classList.remove('text-amber-500');
        btn.classList.add('text-gray-400');
        btn.innerHTML = '<i class="far fa-bookmark"></i> চিহ্নিত করুন';
      }
    }
    this.updateReviewPanel();
  },

  updateReviewPanel() {
    const panel = document.getElementById('question-numbers');
    if (!panel) return;
    panel.innerHTML = '';
    const perPage = 25;
    this.d.qs.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'question-number-btn';
      if (this.ans[i] !== null) btn.classList.add('answered');
      const start = this.currentPage * perPage;
      const end = start + perPage;
      if (i >= start && i < end) btn.classList.add('current-view');
      btn.textContent = i + 1;
      btn.onclick = () => {
        const targetPage = Math.floor(i / perPage);
        if (targetPage !== this.currentPage) {
          this.currentPage = targetPage;
          this.render();
        }
        setTimeout(() => {
          const el = document.getElementById(`q-${i}`);
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'center' });
            el.style.backgroundColor = 'rgba(79,70,229,0.1)';
            setTimeout(() => el.style.backgroundColor = '', 1000);
          }
        }, 50);
        document.getElementById('review-panel')?.classList.remove('show');
      };
      panel.appendChild(btn);
    });
  },

  async render() {
    const perPage = 25;
    const start = this.currentPage * perPage;
    const end = Math.min(start + perPage, this.d.qs.length);
    const answeredCount = this.ans.filter(a => a !== null).length;

    let qHTML = '';
    for (let i = start; i < end; i++) {
      const q = this.d.qs[i];
      const qText = MathHelper.renderExamContent(q.q);
      const isAnswered = this.ans[i] !== null;
      qHTML += `
        <div class="p-4 rounded-xl shadow-sm border mb-4 bg-white dark:bg-gray-800" id="q-${i}">
          <div class="flex justify-between items-center mb-3">
            <span class="bg-indigo-50 text-indigo-600 px-2 py-0.5 text-sm rounded">${i+1}</span>
            <button id="mark-btn-${i}" onclick="Exam.toggleMark(${i})" class="text-xs font-bold ${this.marked[i] ? 'text-amber-500' : 'text-gray-400'}">
              <i class="${this.marked[i] ? 'fas' : 'far'} fa-bookmark"></i> ${this.marked[i] ? 'চিহ্নিত' : 'চিহ্নিত করুন'}
            </button>
          </div>
          <p class="font-bold mb-3 text-gray-800 dark:text-gray-200 text-left flex gap-2">
            <span class="flex-1 bengali-text">${qText}</span>
          </p>
          <div class="space-y-2">
            ${q.options.map((o, oi) => {
              const selected = this.ans[i] === oi ? 'selected' : '';
              const locked = isAnswered ? 'locked' : '';
              const optText = MathHelper.renderExamContent(o);
              return `<button onclick="Exam.sel(${i},${oi})" class="opt-btn option-btn w-full text-left p-3 rounded-lg border text-sm flex gap-2 transition ${selected} ${locked}" ${isAnswered ? 'disabled' : ''}>
                <span class="font-bold opacity-50 w-6">${String.fromCharCode(65+oi)}.</span>
                <span class="flex-1 text-left bengali-text">${optText}</span>
                ${selected ? '<i class="fas fa-check text-indigo-600 ml-2"></i>' : ''}
              </button>`;
            }).join('')}
          </div>
        </div>`;
    }

    const totalPages = Math.ceil(this.d.qs.length / perPage);
    const paginationHTML = totalPages > 1 ? `
      <div class="flex justify-center gap-2 mt-6">
        <button onclick="Exam.prevPage()" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${this.currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentPage === 0 ? 'disabled' : ''}>
          <i class="fas fa-chevron-left"></i> পূর্ববর্তী
        </button>
        <span class="px-4 py-2 text-sm">পৃষ্ঠা ${this.currentPage + 1}/${totalPages}</span>
        <button onclick="Exam.nextPage()" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${this.currentPage === totalPages-1 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentPage === totalPages-1 ? 'disabled' : ''}>
          পরবর্তী <i class="fas fa-chevron-right"></i>
        </button>
      </div>` : '';

    document.getElementById('app-container').innerHTML = `
      <div class="sticky top-0 border-b px-4 py-3 flex justify-between items-center z-30 shadow-md bg-white/95 dark:bg-gray-900/95">
        <div>
          ${this.isPractice ? '<span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded inline-block mb-1"><i class="fas fa-flask"></i> অনুশীলন</span>' : ''}
          <div class="text-center">
            <span class="font-bold block text-sm truncate w-32 mx-auto">${this.d.title}</span>
            <div class="flex items-center justify-center gap-2 mt-1">
              <span id="tm" class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">00:00</span>
              <span id="answered-counter" class="text-xs font-mono bg-indigo-100 text-indigo-600 px-1 rounded">সম্পন্ন: ${answeredCount}/${this.d.qs.length}</span>
            </div>
          </div>
        </div>
        <button onclick="Exam.sub()" class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow">জমা দিন</button>
      </div>
      <div class="p-4 pb-20 min-h-screen select-none bg-gray-50 dark:bg-gray-900">
        ${qHTML}
        ${paginationHTML}
      </div>`;

    loadMathJax(null, document.getElementById('app-container'));
    this.updateReviewPanel();
  },

  sel(qi, oi) {
    if (this.ans[qi] !== null) return;
    this.ans[qi] = oi;
    // update UI locally
    const questionDiv = document.getElementById(`q-${qi}`);
    if (questionDiv) {
      const buttons = questionDiv.querySelectorAll('.option-btn');
      buttons.forEach((btn, idx) => {
        if (idx === oi) {
          btn.classList.add('selected');
          if (!btn.querySelector('.fa-check')) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-check text-indigo-600 ml-2';
            btn.appendChild(icon);
          }
        }
        btn.classList.add('locked');
        btn.disabled = true;
      });
    }
    const counter = document.getElementById('answered-counter');
    if (counter) counter.textContent = `সম্পন্ন: ${this.ans.filter(a => a !== null).length}/${this.d.qs.length}`;
    this.updateReviewPanel();
  },

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.render();
    }
  },

  nextPage() {
    if (this.currentPage < Math.ceil(this.d.qs.length / 25) - 1) {
      this.currentPage++;
      this.render();
    }
  },

  runTimer(sec) {
    this.t = setInterval(() => {
      sec--;
      const el = document.getElementById('tm');
      if (el) el.innerText = `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
      if (sec <= 0) this.sub(true);
    }, 1000);
  },

  async sub(auto = false) {
    if (!auto && !confirm('পরীক্ষা জমা দিতে চান?')) return;
    clearInterval(this.t);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);

    // Determine full questions with correct answers
    let fullQs, fullExam;
    if (this.d.fullQuestions) {
      fullQs = this.d.fullQuestions;
      fullExam = this.d;
    } else {
      if (navigator.onLine) {
        try {
          const snap = await getDoc(doc(db, "exams", this.d.id));
          fullExam = snap.data();
          fullQs = JSON.parse(fullExam.questions);
        } catch(e) {
          fullExam = this._loadFromCache(this.d.id);
          if (fullExam) fullQs = JSON.parse(fullExam.questions);
          else throw new Error('পরীক্ষার তথ্য পাওয়া যায়নি');
        }
      } else {
        fullExam = this._loadFromCache(this.d.id);
        if (fullExam) fullQs = JSON.parse(fullExam.questions);
        else throw new Error('পরীক্ষার তথ্য পাওয়া যায়নি');
      }
    }

    const neg = fullExam.negativeMark ? parseFloat(fullExam.negativeMark) : 0;
    let score = 0;
    fullQs.forEach((q, i) => {
      if (this.ans[i] == q.correct) score++;
      else if (this.ans[i] !== null) score -= neg;
    });
    score = Math.max(0, score);

    const submissionData = {
      userId: auth.currentUser.uid,
      userName: AppState.userProfile?.name || auth.currentUser.displayName,
      examId: this.d.id,
      examTitle: this.d.title,
      score,
      answers: this.ans,
      markedAnswers: this.marked,
      startedAt: this.startedAt,
      submittedAt: new Date().toISOString(),
      isPractice: this.isPractice || fullExam.type === 'mock',
      groupId: AppState.activeGroupId,
      status: 'submitted'
    };

    // Submit to Firestore or offline queue
    if (navigator.onLine && !this.currentAttemptId?.startsWith('local_')) {
      try {
        if (this.currentAttemptId) {
          await updateDoc(doc(db, "attempts", this.currentAttemptId), {
            answers: this.ans,
            markedAnswers: this.marked,
            score,
            submittedAt: new Date(),
            status: 'submitted'
          });
        } else {
          await addDoc(collection(db, "attempts"), { ...submissionData, submittedAt: new Date(), startedAt: this.startedAt });
        }
        localStorage.removeItem('currentExamProgress');
      } catch(e) {
        await this._saveOffline(submissionData);
      }
    } else {
      await this._saveOffline(submissionData);
    }

    // Show result
    const showInstant = fullExam.type === 'mock' || this.isPractice || !navigator.onLine;
    if (showInstant) {
      Swal.fire({ title: 'ফলাফল', html: `আপনার স্কোর: <strong>${score.toFixed(2)}</strong>`, icon: 'success', confirmButtonText: 'দেখুন' }).then(() => {
        document.getElementById('review-panel-btn')?.classList.add('hidden');
        document.getElementById('review-panel')?.classList.remove('show');
        Router.student('results');
      });
    } else {
      Swal.fire('জমা দেওয়া হয়েছে', 'ফলাফলের জন্য অপেক্ষা করুন।', 'success').then(() => {
        document.getElementById('review-panel-btn')?.classList.add('hidden');
        document.getElementById('review-panel')?.classList.remove('show');
        Router.student('dashboard');
      });
    }
  },

  async _saveOffline(data) {
    if (window.DB) {
      await DB.addToSyncQueue({ collection: 'attempts', operation: 'add', payload: data, docId: this.currentAttemptId });
    }
    const pending = JSON.parse(localStorage.getItem('pendingSyncAttempts') || '[]');
    pending.push({ ...data, localId: this.currentAttemptId });
    localStorage.setItem('pendingSyncAttempts', JSON.stringify(pending));
    if (!navigator.onLine) {
      Swal.fire({ title: 'অফলাইন সাবমিশন', text: 'পরীক্ষা লোকালি সেভ হয়েছে। ইন্টারনেট ফিরলে সিঙ্ক হবে।', icon: 'info' });
    }
  }
};

// Expose globally
window.Exam = Exam;
