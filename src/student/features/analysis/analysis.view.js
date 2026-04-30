// src/student/features/analysis/analysis.view.js
// Student analysis page UI – attendance chart, subject bars, recent exams, mock progress

export function renderOverallStats(attendedLive, totalLive, totalMarksObtained, totalMarksAvailable) {
  const attendancePercent = totalLive ? ((attendedLive / totalLive) * 100) : 0;
  const overallPercent = totalMarksAvailable ? ((totalMarksObtained / totalMarksAvailable) * 100) : 0;

  return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 mb-4">
      <h3 class="font-bold text-lg mb-3 dark:text-white">উপস্থিতি ও সার্বিক পারফরম্যান্স</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <canvas id="attendanceChart" style="max-height:160px; width:100%"></canvas>
          <p class="text-center text-sm font-bold mt-1 dark:text-white">উপস্থিতি: ${attendancePercent.toFixed(1)}%</p>
          <p class="text-center text-xs text-gray-500 dark:text-gray-400">${attendedLive}/${totalLive} পরীক্ষা</p>
        </div>
        <div>
          <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${totalMarksObtained.toFixed(2)}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">মোট প্রাপ্ত নম্বর</div>
          <div class="text-sm mt-2 dark:text-white">সম্ভাব্য: ${totalMarksAvailable}</div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full" style="width:${overallPercent}%"></div>
          </div>
          <div class="text-right text-xs text-gray-500 dark:text-gray-400">${overallPercent.toFixed(1)}%</div>
        </div>
      </div>
    </div>`;
}

export function renderSubjectBars(subjectScores) {
  if (!subjectScores || Object.keys(subjectScores).length === 0) {
    return '<p class="text-gray-400 dark:text-gray-500 text-sm">কোনো তথ্য নেই</p>';
  }
  let html = '';
  for (const [sub, data] of Object.entries(subjectScores)) {
    const percent = data.total ? ((data.obtained / data.total) * 100) : 0;
    html += `
      <div class="flex items-center gap-2 mb-2">
        <span class="w-20 text-xs font-semibold truncate dark:text-white">${sub}</span>
        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-indigo-500 rounded-full" style="width:${percent}%"></div>
        </div>
        <span class="w-12 text-right text-xs text-gray-500 dark:text-gray-400">${percent.toFixed(1)}%</span>
      </div>`;
  }
  return `<div class="space-y-1">${html}</div>`;
}

export function renderRecentLiveResults(performanceList) {
  if (!performanceList || performanceList.length === 0) {
    return '<p class="text-gray-400 dark:text-gray-500 text-sm">কোনো লাইভ পরীক্ষায় অংশগ্রহণ করেননি</p>';
  }
  const rows = performanceList
    .sort((a, b) => b.date - a.date)
    .slice(0, 5)
    .map(p => `
      <tr class="border-b dark:border-gray-700">
        <td class="py-2 text-sm dark:text-white">${p.title}</td>
        <td class="py-2 text-sm dark:text-white">${p.score.toFixed(2)}/${p.total}</td>
        <td class="py-2 text-sm dark:text-white">${p.percentage.toFixed(1)}%</td>
      </tr>`).join('');
  return `<table class="w-full text-sm">${rows}</table>`;
}

export function renderMockProgress(attemptedMock, totalMock, subjectMockStats) {
  const completionPercent = totalMock ? ((attemptedMock / totalMock) * 100) : 0;
  let subjectHtml = '';
  for (const [name, stats] of Object.entries(subjectMockStats || {})) {
    const percent = stats.total ? ((stats.completed / stats.total) * 100) : 0;
    subjectHtml += `
      <div class="flex items-center gap-2 mb-2">
        <span class="w-20 text-xs font-semibold truncate dark:text-white">${name}</span>
        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-amber-500 rounded-full" style="width:${percent}%"></div>
        </div>
        <span class="w-16 text-right text-xs text-gray-500 dark:text-gray-400">${stats.completed}/${stats.total}</span>
      </div>`;
  }
  return `
    <div class="mb-4">
      <div class="flex justify-between text-sm dark:text-white mb-1">
        <span>সামগ্রিক সম্পন্ন</span>
        <span>${attemptedMock}/${totalMock} (${completionPercent.toFixed(1)}%)</span>
      </div>
      <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
        <div class="h-full bg-amber-500 rounded-full" style="width:${completionPercent}%"></div>
      </div>
    </div>
    <h4 class="font-semibold text-sm mb-2 dark:text-white">বিষয় অনুযায়ী</h4>
    ${subjectHtml || '<p class="text-gray-400 dark:text-gray-500">কোনো মক পরীক্ষা নেই</p>'}`;
}

export function renderFullAnalysisPage(attendanceData, subjectScores, recentLive, mockData) {
  return `
    <div class="p-5 pb-20">
      <h2 class="text-xl font-bold mb-4 text-center dark:text-white">অগ্রগতি বিশ্লেষণ</h2>
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 mb-4">
        <h3 class="font-bold text-lg mb-3 dark:text-white">উপস্থিতি ও সার্বিক পারফরম্যান্স</h3>
        ${renderOverallStats(attendanceData.attended, attendanceData.total, attendanceData.obtained, attendanceData.available)}
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 mb-4">
        <h3 class="font-bold text-lg mb-3 dark:text-white">বিষয়ভিত্তিক পারফরম্যান্স</h3>
        ${renderSubjectBars(subjectScores)}
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 mb-4">
        <h3 class="font-bold text-lg mb-3 dark:text-white">সাম্প্রতিক লাইভ পরীক্ষার ফলাফল</h3>
        ${renderRecentLiveResults(recentLive)}
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 mb-4">
        <h3 class="font-bold text-lg mb-3 dark:text-white">মক টেস্ট অগ্রগতি</h3>
        ${renderMockProgress(mockData.attempted, mockData.total, mockData.subjectStats)}
      </div>
    </div>`;
}
