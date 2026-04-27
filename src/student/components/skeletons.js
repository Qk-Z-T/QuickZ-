// src/student/components/skeletons.js
// Skeleton loading placeholders for student pages

export function renderRankSkeleton() {
  return `
    <div class="p-5 pb-20">
      ${Array(5).fill().map(() => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      `).join('')}
    </div>`;
}

export function renderAnalysisSkeleton() {
  return `
    <div class="p-5 pb-20">
      ${Array(3).fill().map(() => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl mb-4 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      `).join('')}
    </div>`;
}

export function renderProfileSkeleton() {
  return `
    <div class="p-5 max-w-md mx-auto">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl animate-pulse">
        <div class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-2"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-6"></div>
        ${Array(4).fill().map(() => `<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>`).join('')}
      </div>
    </div>`;
}

export function renderManagementSkeleton() {
  return `
    <div class="p-5 pb-20 max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-4 text-center">ম্যানেজমেন্ট</h2>
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>`;
}

export function renderResultsSkeleton() {
  return `
    <div class="p-5 pb-20">
      <div class="flex justify-center gap-6 mb-4">
        <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      ${Array(4).fill().map(() => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl mb-3 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      `).join('')}
    </div>`;
}

// Make available globally for inline usage if needed
window.renderRankSkeleton = renderRankSkeleton;
window.renderAnalysisSkeleton = renderAnalysisSkeleton;
window.renderProfileSkeleton = renderProfileSkeleton;
window.renderManagementSkeleton = renderManagementSkeleton;
window.renderResultsSkeleton = renderResultsSkeleton;
