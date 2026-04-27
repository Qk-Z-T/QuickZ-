// src/teacher/features/notice-poll/notice.view.js
// Notice & Poll UI rendering functions

/**
 * Render the list of notices/polls for the current course.
 * @param {Array} notices - array of notice objects from Firestore
 * @returns {string} HTML
 */
export function renderNoticeList(notices) {
  if (!notices || notices.length === 0) {
    return `<div class="text-center p-8 text-gray-400 bengali-text">কোনো নোটিশ বা পোল নেই</div>`;
  }

  let html = '';
  notices.forEach(n => {
    const isPoll = n.type === 'poll';
    const viewCount = Object.keys(n.views || {}).length;
    const voteCount = isPoll ? Object.keys(n.votes || {}).length : 0;

    let pollStatsHtml = '';
    if (isPoll && n.options && n.options.length > 0) {
      const votes = n.votes || {};
      const totalVotes = Object.keys(votes).length;
      const counts = {};
      n.options.forEach((_, i) => { counts[i] = 0; });
      Object.values(votes).forEach(optIdx => {
        if (counts[optIdx] !== undefined) counts[optIdx]++;
      });
      const pollColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

      pollStatsHtml = `
        <div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
          <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
            পোল ফলাফল · মোট ${totalVotes} ভোট
          </div>`;

      n.options.forEach((opt, i) => {
        const count = counts[i] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const col = pollColors[i % pollColors.length];
        pollStatsHtml += `
          <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
              <span style="font-size:12px;font-weight:600;color:#374151;font-family:'Hind Siliguri',sans-serif;">${opt}</span>
              <span style="font-size:11px;color:#64748b;font-weight:700;">${count} জন (${pct}%)</span>
            </div>
            <div style="background:#e2e8f0;border-radius:6px;height:8px;overflow:hidden;">
              <div style="background:${col};height:100%;width:${pct}%;border-radius:6px;min-width:${pct > 0 ? '3px' : '0'};"></div>
            </div>
          </div>`;
      });
      pollStatsHtml += '</div>';
    }

    html += `
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700" style="transition:box-shadow 0.2s;"
           onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
           onmouseout="this.style.boxShadow='none'">
        <div class="flex justify-between items-start">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span class="text-xs font-bold px-2 py-1 rounded ${isPoll ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                ${isPoll ? '📊 পোল' : '📢 নোটিশ'}
              </span>
              <span style="font-size:11px;color:#94a3b8;">
                📅 ${moment(n.createdAt.toDate()).format('DD MMM, YYYY')}
              </span>
            </div>
            <h3 class="font-bold text-base mt-1 dark:text-white bengali-text">${n.title}</h3>
            ${!isPoll ? `<p class="text-sm text-gray-600 dark:text-gray-300 bengali-text mt-1" style="line-height:1.5;">${(n.content || '').substring(0, 120)}${(n.content || '').length > 120 ? '...' : ''}</p>` : ''}
            <div class="flex gap-4 mt-2" style="font-size:12px;">
              <span class="cursor-pointer hover:underline" style="color:#64748b;" onclick="Teacher.showViewers('${n.id}')">
                👁️ ${viewCount} জন দেখেছেন
              </span>
            </div>
            ${pollStatsHtml}
          </div>
          <div class="flex gap-2" style="margin-left:12px;flex-shrink:0;">
            <button onclick="Teacher.deleteNotice('${n.id}')" class="text-red-500 hover:text-red-700" style="padding:6px 8px;border-radius:6px;border:1px solid #fecaca;background:#fff5f5;font-size:12px;" title="মুছুন">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>`;
  });

  return html;
}

/**
 * Render the create/edit notice/poll form.
 * @returns {string} HTML
 */
export function renderNoticeForm() {
  return `
    <div class="p-0 max-w-3xl">
      <button onclick="Teacher.noticeManagementView()" class="mb-4 text-xs font-bold text-gray-500 bengali-text">
        <i class="fas fa-arrow-left"></i> ফিরে যান
      </button>
      <h2 class="text-xl font-bold mb-4 dark:text-white bengali-text">নতুন নোটিশ / পোল</h2>
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white">ধরন</label>
          <select id="notice-type" class="w-full p-3 border rounded-xl dark:bg-black" onchange="Teacher.toggleNoticeType()">
            <option value="notice">সাধারণ নোটিশ</option>
            <option value="poll">পোল</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white">শিরোনাম</label>
          <input id="notice-title" class="w-full p-3 border rounded-xl dark:bg-black bengali-text" placeholder="শিরোনাম লিখুন">
        </div>
        <div id="notice-content-field" class="mb-4">
          <label class="block text-sm font-bold mb-1 dark:text-white">বিস্তারিত</label>
          <textarea id="notice-content" rows="4" class="w-full p-3 border rounded-xl dark:bg-black bengali-text" placeholder="নোটিশের বিস্তারিত..."></textarea>
        </div>
        <div id="poll-options-container" class="hidden mb-4">
          <label class="block text-sm font-bold mb-2 dark:text-white">পোল অপশন</label>
          <div id="poll-options-list">
            <div class="flex gap-2 mb-2">
              <input type="text" class="poll-option-input flex-1 p-2 border rounded dark:bg-black" placeholder="অপশন ১">
              <button onclick="Teacher.addPollOption()" class="px-3 bg-gray-200 rounded">+</button>
            </div>
          </div>
        </div>
        <button onclick="Teacher.saveNotice()" class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">প্রকাশ করুন</button>
      </div>
    </div>`;
}
