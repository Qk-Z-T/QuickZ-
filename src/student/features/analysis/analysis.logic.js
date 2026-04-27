// src/student/features/analysis/analysis.logic.js
// Student analysis page – overall progress, subject-wise, and mock completion

import { auth, db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import {
  doc, getDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export const AnalysisManager = {
  async loadAnalysis() {
    if (!AppState.activeGroupId) {
      Swal.fire('কোর্স প্রয়োজন', 'প্রথমে কোর্সে জয়েন করুন', 'warning');
      return;
    }
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;
    contentEl.innerHTML = '<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>';

    const uid = auth.currentUser.uid;

    try {
      // 1. Fetch all live exams of the course
      const liveSnaps = await getDocs(query(
        collection(db, "exams"),
        where("groupId", "==", AppState.activeGroupId),
        where("type", "==", "live")
      ));
      const allLiveExams = [];
      liveSnaps.forEach(doc => allLiveExams.push({ id: doc.id, ...doc.data() }));

      // 2. Fetch user attempts
      const attemptSnaps = await getDocs(query(collection(db, "attempts"), where("userId", "==", uid)));
      const userAttempts = {};
      const mockAttemptsMap = {};
      attemptSnaps.forEach(doc => {
        const a = doc.data();
        if (a.isPractice) {
          if (!mockAttemptsMap[a.examId]) mockAttemptsMap[a.examId] = [];
          mockAttemptsMap[a.examId].push(a);
        } else {
          userAttempts[a.examId] = a;
        }
      });

      // 3. Live exam stats
      const totalLive = allLiveExams.length;
      const attendedLive = allLiveExams.filter(e => userAttempts[e.id]).length;
      const attendancePercent = totalLive ? (attendedLive / totalLive) * 100 : 0;

      let totalMarksAvailable = 0, totalMarksObtained = 0;
      const subjectScores = {};
      const recentPerformance = [];

      allLiveExams.forEach(exam => {
        if (exam.totalMarks) totalMarksAvailable += exam.totalMarks;
        const sub = exam.subject || 'Uncategorized';
        if (!subjectScores[sub]) subjectScores[sub] = { obtained: 0, total: 0, count: 0 };
        subjectScores[sub].total += exam.totalMarks || 0;

        const attempt = userAttempts[exam.id];
        if (attempt) {
          totalMarksObtained += attempt.score || 0;
          subjectScores[sub].obtained += attempt.score || 0;
          subjectScores[sub].count++;
          recentPerformance.push({
            title: exam.title,
            date: exam.createdAt?.toDate(),
            score: attempt.score,
            total: exam.totalMarks,
            percentage: (attempt.score / exam.totalMarks) * 100
          });
        }
      });
      const overallPercent = totalMarksAvailable ? (totalMarksObtained / totalMarksAvailable) * 100 : 0;

      // 4. Mock exam stats
      const folderSnap = await getDoc(doc(db, "folderStructures", `${AppState.activeTeacherCode}_${AppState.activeGroupId}`));
      let totalMock = 0, attemptedMock = 0;
      const subjectMockStats = {};
      if (folderSnap.exists()) {
        const mockSubjects = folderSnap.data().mock || [];
        mockSubjects.forEach(sub => {
          let subTotal = 0, subCompleted = 0;
          sub.children.forEach(chap => {
            chap.exams.forEach(ex => {
              subTotal++;
              totalMock++;
              if (mockAttemptsMap[ex.id]) {
                subCompleted++;
                attemptedMock++;
              }
            });
          });
          subjectMockStats[sub.name] = { total: subTotal, completed: subCompleted };
        });
      }
      const mockCompletionPercent = totalMock ? (attemptedMock / totalMock) * 100 : 0;

      // 5. Render UI
      let subjectBarsHTML = '';
      for (const [sub, data] of Object.entries(subjectScores)) {
        const percent = data.total ? (data.obtained / data.total) * 100 : 0;
        subjectBarsHTML += `
          <div class="flex items-center gap-2 mb-2">
            <span class="w-20 text-xs font-semibold truncate">${sub}</span>
            <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full" style="width:${percent}%"></div>
            </div>
            <span class="w-12 text-right text-xs">${percent.toFixed(1)}%</span>
          </div>`;
      }

      let mockSubjectHTML = '';
      for (const [name, stats] of Object.entries(subjectMockStats)) {
        const subPercent = stats.total ? (stats.completed / stats.total) * 100 : 0;
        mockSubjectHTML += `
          <div class="flex items-center gap-2 mb-2">
            <span class="w-20 text-xs font-semibold truncate">${name}</span>
            <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full" style="width:${subPercent}%"></div>
            </div>
            <span class="w-16 text-right text-xs">${stats.completed}/${stats.total}</span>
          </div>`;
      }

      let recentHTML = recentPerformance
        .sort((a, b) => b.date - a.date)
        .slice(0, 5)
        .map(p => `
          <tr class="border-b dark:border-gray-700">
            <td class="py-2 text-sm">${p.title}</td>
            <td class="py-2 text-sm">${p.score.toFixed(2)}/${p.total}</td>
            <td class="py-2 text-sm">${p.percentage.toFixed(1)}%</td>
          </tr>`).join('');

      contentEl.innerHTML = `
        <div class="p-5 pb-20">
          <h2 class="text-xl font-bold mb-4 text-center">অগ্রগতি বিশ্লেষণ</h2>

          <!-- Attendance & Overall -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5 mb-4">
            <h3 class="font-bold text-lg mb-3">উপস্থিতি ও সার্বিক পারফরম্যান্স</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <canvas id="attendanceChart" style="max-height:160px; width:100%"></canvas>
                <p class="text-center text-sm font-bold mt-1">উপস্থিতি: ${attendancePercent.toFixed(1)}%</p>
                <p class="text-center text-xs text-gray-500">${attendedLive}/${totalLive} পরীক্ষা</p>
              </div>
              <div>
                <div class="text-3xl font-bold text-emerald-600">${totalMarksObtained.toFixed(2)}</div>
                <div class="text-xs text-gray-500">মোট প্রাপ্ত নম্বর</div>
                <div class="text-sm mt-2">সম্ভাব্য: ${totalMarksAvailable}</div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full" style="width:${overallPercent}%"></div>
                </div>
                <div class="text-right text-xs">${overallPercent.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <!-- Subject-wise live performance -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5 mb-4">
            <h3 class="font-bold text-lg mb-3">বিষয়ভিত্তিক পারফরম্যান্স</h3>
            ${subjectBarsHTML || '<p class="text-gray-400">কোনো তথ্য নেই</p>'}
          </div>

          <!-- Recent live exam results -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5 mb-4">
            <h3 class="font-bold text-lg mb-3">সাম্প্রতিক লাইভ পরীক্ষার ফলাফল</h3>
            ${recentHTML ? '<table class="w-full text-sm">'+recentHTML+'</table>' : '<p class="text-gray-400">কোনো লাইভ পরীক্ষায় অংশগ্রহণ করেননি</p>'}
          </div>

          <!-- Mock test progress -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5 mb-4">
            <h3 class="font-bold text-lg mb-3">মক টেস্ট অগ্রগতি</h3>
            <div class="mb-4">
              <div class="flex justify-between text-sm">
                <span>সামগ্রিক সম্পন্ন</span>
                <span>${attemptedMock}/${totalMock} (${mockCompletionPercent.toFixed(1)}%)</span>
              </div>
              <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full" style="width:${mockCompletionPercent}%"></div>
              </div>
            </div>
            <h4 class="font-semibold text-sm mb-2">বিষয় অনুযায়ী</h4>
            ${mockSubjectHTML || '<p class="text-gray-400">কোনো মক পরীক্ষা নেই</p>'}
          </div>
        </div>`;

      // Render chart
      setTimeout(() => {
        const ctx = document.getElementById('attendanceChart');
        if (ctx) {
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['উপস্থিত', 'অনুপস্থিত'],
              datasets: [{
                data: [attendedLive, totalLive - attendedLive],
                backgroundColor: ['#4f46e5', '#e2e8f0'],
                borderWidth: 0
              }]
            },
            options: {
              cutout: '70%',
              responsive: true,
              maintainAspectRatio: true,
              plugins: { legend: { display: false } }
            }
          });
        }
      }, 100);
    } catch (e) {
      console.error(e);
      contentEl.innerHTML = '<div class="p-10 text-center text-red-500">বিশ্লেষণ লোড করতে ত্রুটি</div>';
    }
  }
};

window.AnalysisManager = AnalysisManager;
