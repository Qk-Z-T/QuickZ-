// assets.js
const STATIC_ASSETS = [
  // Root level
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/src/shared/styles/global.css',
  '/src/shared/styles/animations.css',
  '/src/landing/main.js',
  '/src/shared/services/db.service.js',

  // Student portal
  '/student/',
  '/student/index.html',
  '/src/student/app.js',
  '/src/student/core/state.js',
  '/src/student/core/auth.js',
  '/src/student/core/router.js',
  '/src/student/components/skeletons.js',
  '/src/student/features/dashboard/dashboard.logic.js',
  '/src/student/features/exam-taking/exam.logic.js',
  '/src/student/features/results/results.logic.js',
  '/src/student/features/analysis/analysis.logic.js',
  '/src/student/features/courses/courses.logic.js',
  '/src/student/features/profile/profile.logic.js',
  '/src/student/features/management/management.logic.js',

  // Teacher portal
  '/teacher/',
  '/teacher/index.html',
  '/src/teacher/app.js',
  '/src/teacher/core/state.js',
  '/src/teacher/core/auth.js',
  '/src/teacher/core/router.js',
  '/src/teacher/teacher-core.js',
  '/src/teacher/components/folder-tree.js',
  '/src/teacher/components/question-item.js',
  '/src/teacher/features/realtime-sync/sync.logic.js',
  '/src/teacher/features/math-editor/editor.logic.js',
  '/src/teacher/features/exam-create/create.logic.js',
  '/src/teacher/features/exam-create/create.view.js',
  '/src/teacher/features/library/library.logic.js',
  '/src/teacher/features/library/library.view.js',
  '/src/teacher/features/management/management.logic.js',
  '/src/teacher/features/rankings/rankings.logic.js',
  '/src/teacher/features/rankings/rankings.view.js',
  '/src/teacher/features/notice-poll/notice.logic.js',
  '/src/teacher/features/notice-poll/notice.view.js',
  '/src/teacher/features/groups/groups.logic.js',
  '/src/teacher/features/groups/groups.view.js',
  '/src/teacher/features/profile/profile.logic.js',
  '/src/teacher/features/profile/profile.view.js',

  // Shared modules
  '/src/shared/config/firebase.js',
  '/src/shared/services/auth.service.js',
  '/src/shared/services/offline-sync.js',
  '/src/shared/utils/math-helper.js',
  '/src/shared/utils/date-formatter.js',
  '/src/shared/utils/dom-helper.js',

  // CDN fallbacks (will be cached by the browser)
  'https://cdn.tailwindcss.com/',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap'
];

self.STATIC_ASSETS = STATIC_ASSETS;
