// src/student/core/router.js
// Student portal routing – boxed menu items, auto‑close mobile drawer,
// NO teacher code required, missing course redirects to courses page,
// Refresh stays on current page, back button from home goes to root

import { auth, db } from '../../shared/config/firebase.js';
import { AppState, clearListeners, refreshExamCache } from './state.js';
import { StudentDashboard } from '../features/dashboard/dashboard.logic.js';
import { ResultsManager } from '../features/results/results.logic.js';
import { AnalysisManager } from '../features/analysis/analysis.logic.js';
import { CoursesManager } from '../features/courses/courses.logic.js';
import { ProfileManager } from '../features/profile/profile.logic.js';
import { ManagementManager } from '../features/management/management.logic.js';
import { Exam } from '../features/exam-taking/exam.logic.js';
import { renderRankSkeleton, renderResultsSkeleton, renderAnalysisSkeleton, renderManagementSkeleton } from '../components/skeletons.js';
import { loadMathJax } from '../../shared/utils/dom-helper.js';

function renderHeader(activePage) {
  const user = AppState.userProfile || {};
  const initial = (user && user.name) ? user.name.charAt(0).toUpperCase() : 'U';
  let currentCourseName = 'কোর্স নির্বাচন করুন';
  if (AppState.activeGroupId && AppState.joinedGroups) {
    const active = AppState.joinedGroups.find(g => g.groupId === AppState.activeGroupId);
    if (active) currentCourseName = active.groupName || 'অজানা কোর্স';
  }

  return `
  <!-- Desktop Sidebar -->
  <aside class="hidden md:!flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 h-screen w-[250px] z-50 shadow-sm">
    <div class="p-6 flex items-center border-b border-gray-100 dark:border-gray-700">
      <div class="flex-1">
        <div class="text-xl font-bold quickz-logo">
          <span class="quick">Quick</span><span class="z">Z</span>
        </div>
        <div class="text-[10px] text-gray-500 dark:text-gray-400">The ultimate exam platform</div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="Router.student('notices')" class="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <i class="fas fa-bell text-xl text-gray-600 dark:text-gray-300"></i>
          <span id="notification-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hidden">0</span>
        </button>
        <button onclick="Router.student('profile')" class="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg border-2 border-white shadow-md">
          ${initial}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto py-6 px-4 space-y-2">
      <button onclick="Router.student('dashboard')" class="sidebar-menu-item ${activePage === 'dashboard' ? 'active' : ''}">
        <i class="fas fa-home w-5 text-lg"></i> হোম
      </button>
      <button onclick="Router.student('courses')" class="sidebar-menu-item ${activePage === 'courses' ? 'active' : ''}">
        <i class="fas fa-book-open w-5 text-lg"></i> কোর্সসমূহ
      </button>
      <button onclick="Router.student('rank')" class="sidebar-menu-item ${activePage === 'rank' ? 'active' : ''}">
        <i class="fas fa-trophy w-5 text-lg"></i> র‍্যাংক
      </button>
      <button onclick="Router.student('results')" class="sidebar-menu-item ${activePage === 'results' ? 'active' : ''}">
        <i class="fas fa-clipboard-list w-5 text-lg"></i> ফলাফল
      </button>
      <button onclick="Router.student('analysis')" class="sidebar-menu-item ${activePage === 'analysis' ? 'active' : ''}">
        <i class="fas fa-chart-pie w-5 text-lg"></i> অগ্রগতি
      </button>
      <button onclick="Router.student('notices')" class="sidebar-menu-item ${activePage === 'notices' ? 'active' : ''}">
        <i class="fas fa-bell w-5 text-lg"></i> নোটিস
      </button>
      <button onclick="Router.student('management')" class="sidebar-menu-item ${activePage === 'management' ? 'active' : ''}">
        <i class="fas fa-cogs w-5 text-lg"></i> ম্যানেজমেন্ট
      </button>
    </div>
  </aside>

  <!-- Mobile Header -->
  <header class="md:!hidden sticky top-0 z-40 px-5 py-3 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
    <div class="flex items-center gap-3">
      <div>
        <div class="text-xl font-bold quickz-logo"><span class="quick">Quick</span><span class="z">Z</span></div>
        <div class="text-[8px] text-gray-500 dark:text-gray-400">The ultimate exam platform</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="Router.student('notices')" class="relative p-2"><i class="fas fa-bell text-xl text-gray-600 dark:text-gray-300"></i><span id="notification-badge-mobile" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center hidden">0</span></button>
      <button onclick="Router.student('profile')" class="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-base border-2 border-white shadow-sm">${initial}</button>
      <button onclick="toggleMobileDrawer()" class="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700"><i class="fas fa-bars text-lg"></i></button>
    </div>
  </header>

  <!-- Desktop Top Bar -->
  <div class="hidden md:!block fixed top-0 left-[250px] right-0 z-40 px-6 py-2 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">বর্তমান কোর্স:</span>
        <div class="relative course-switcher-dropdown">
          <button id="course-switcher-btn" onclick="StudentDashboard.toggleCourseSwitcher()" class="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold transition">
            <i class="fas fa-book-open text-indigo-500"></i>
            <span id="current-course-name-display">${currentCourseName}</span>
            <i class="fas fa-chevron-down text-xs opacity-60"></i>
          </button>
          <div id="course-switcher-menu" class="hidden absolute top-full left-0 mt-2 w-64 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 z-50 max-h-80 overflow-y-auto">
            <div id="course-switcher-list" class="py-2">
              ${AppState.joinedGroups && AppState.joinedGroups.length > 0 ?
                AppState.joinedGroups.map(g => `
                  <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition flex items-center justify-between ${g.groupId === AppState.activeGroupId ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}" onclick="StudentDashboard.switchCourseFromDropdown('${g.groupId}')">
                    <div class="flex-1"><div class="font-medium text-sm text-gray-800 dark:text-gray-200">${g.groupName || 'অজানা কোর্স'}</div></div>
                    ${g.groupId === AppState.activeGroupId ? '<i class="fas fa-check text-indigo-600 text-xs"></i>' : ''}
                  </div>
                `).join('')
                : '<div class="px-4 py-3 text-center text-sm text-gray-400">কোনো কোর্সে জয়েন নেই</div>'
              }
            </div>
            <div class="border-t border-gray-200 dark:border-gray-600 p-2">
              <button onclick="Router.student('courses'); StudentDashboard.toggleCourseSwitcher();" class="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold py-2 hover:underline"><i class="fas fa-plus mr-1"></i> নতুন কোর্স খুঁজুন</button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="Router.student('profile')" class="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-base border-2 border-white shadow-sm">${initial}</button>
      </div>
    </div>
  </div>

  <!-- Mobile Drawer Overlay -->
  <div id="drawerOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden transition-opacity" onclick="toggleMobileDrawer()"></div>

  <!-- Mobile Drawer -->
  <div class="mobile-drawer z-50 fixed top-0 right-0 h-full w-[280px] bg-white dark:bg-gray-900 transform translate-x-full transition-transform duration-300" id="mobileDrawer">
    <div class="flex justify-between items-center mb-6 p-5">
      <div class="text-xl font-bold quickz-logo"><span class="quick">Quick</span><span class="z">Z</span></div>
      <button onclick="toggleMobileDrawer()" class="text-2xl text-gray-800 dark:text-gray-200">&times;</button>
    </div>
    <div class="mb-4 px-5">
      <label class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">বর্তমান কোর্স</label>
      <select id="mobile-course-switcher" class="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" onchange="StudentDashboard.switchCourseFromMobile(this.value)">
        ${AppState.joinedGroups && AppState.joinedGroups.length > 0 ?
          AppState.joinedGroups.map(g => `<option value="${g.groupId}" ${g.groupId === AppState.activeGroupId ? 'selected' : ''}>${g.groupName || 'অজানা কোর্স'}</option>`).join('')
          : '<option disabled>কোনো কোর্স নেই</option>'
        }
      </select>
    </div>
    <div class="px-3 space-y-2">
      <div class="sidebar-menu-item" onclick="toggleMobileDrawer(); Router.student('dashboard');"><i class="fas fa-home"></i> হোম</div>
      <div class="sidebar-menu-item" onclick="toggleMobileDrawer(); Router.student('courses');"><i class="fas fa-book-open"></i> কোর্সসমূহ</div>
      <div class="sidebar-menu-item" onclick="toggleMobileDrawer(); Router.student('rank');"><i class="fas fa-trophy"></i> র‍্যাংক</div>
      <div class="sidebar-menu-item" onclick="toggleMobileDrawer(); Router.student('results');"><i class="fas fa-clipboard-list"></i> ফলাফল</div>
      <div class="sidebar-menu-item" onclick="toggleMobileDrawer(); Router.student('analysis');"><i class="fas fa-chart-pie"></i> অগ্রগতি</div>
      <div class="sidebar-menu-item" onclick="toggleMobileDrawer(); Router.student('notices');"><i class="fas fa-bell"></i> নোটিস</div>
      <div class="sidebar-menu-item" onclick="toggleMobileDrawer(); Router.student('management');"><i class="fas fa-cogs"></i> ম্যানেজমেন্ট</div>
    </div>
  </div>

  <!-- Main Content Area -->
  <main id="page-content" class="md:ml-[250px] md:pt-[60px] min-h-screen relative w-full md:w-[calc(100%-250px)]"></main>
  `;
}

function renderPage(pageId, contentCallback) {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  appContainer.innerHTML = renderHeader(pageId);
  const pageContent = document.getElementById('page-content');
  if (pageContent && contentCallback) {
    contentCallback(pageContent);
  }
  appContainer.classList.remove('hidden');
}

export const Router = {
  initStudent: async () => {
    document.getElementById('splash-screen')?.classList.add('hidden');
    document.getElementById('auth-screen')?.classList.add('hidden');

    refreshExamCache();

    // Determine initial page from URL hash (if valid)
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const validPages = ['dashboard', 'courses', 'rank', 'results', 'analysis', 'notices', 'management', 'profile'];
    let initialPage = 'dashboard';
    if (validPages.includes(hash)) {
      initialPage = hash;
    }

    // Replace current history entry with this page so back navigation works properly
    window.history.replaceState({ route: initialPage }, '', `#${initialPage}`);

    // Load the initial page without adding another history entry
    await Router._loadPage(initialPage, true);

    StudentDashboard.initNotificationListener();

    setTimeout(async () => {
      if (navigator.onLine && AppState.activeGroupId) {
        const { OfflineSync } = await import('../../shared/services/offline-sync.js');
        OfflineSync.syncPendingItems();
      }
    }, 2000);
  },

  // Internal page loader; isInitial = true uses replaceState, false uses pushState
  _loadPage(page, isInitial = false) {
    const updateHistory = (route) => {
      if (isInitial) {
        window.history.replaceState({ route }, '', `#${route}`);
      } else {
        window.history.pushState({ route }, '', `#${route}`);
      }
    };

    switch (page) {
      case 'profile':
        renderPage('profile', (el) => { el.innerHTML = `<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>`; ProfileManager.profile(); });
        updateHistory('profile');
        break;
      case 'dashboard':
        renderPage('dashboard', (el) => { el.innerHTML = `<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>`; StudentDashboard.loadDashboard(); });
        updateHistory('dashboard');
        break;
      case 'courses':
        renderPage('courses', (el) => { el.innerHTML = `<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>`; CoursesManager.loadCourses(); });
        updateHistory('courses');
        break;
      case 'rank':
        renderPage('rank', (el) => { el.innerHTML = renderRankSkeleton(); setTimeout(() => StudentDashboard.loadRankings(), 50); });
        updateHistory('rank');
        break;
      case 'results':
        renderPage('results', (el) => { el.innerHTML = renderResultsSkeleton(); setTimeout(() => ResultsManager.loadResults(), 50); });
        updateHistory('results');
        break;
      case 'analysis':
        renderPage('analysis', (el) => { el.innerHTML = renderAnalysisSkeleton(); setTimeout(() => AnalysisManager.loadAnalysis(), 50); });
        updateHistory('analysis');
        break;
      case 'notices':
        renderPage('notices', (el) => { el.innerHTML = `<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>`; StudentDashboard.loadNotices(); });
        updateHistory('notices');
        break;
      case 'management':
        renderPage('management', (el) => { el.innerHTML = renderManagementSkeleton(); setTimeout(() => ManagementManager.load(), 50); });
        updateHistory('management');
        break;
      default:
        // fallback
        renderPage('dashboard', (el) => { el.innerHTML = `<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>`; StudentDashboard.loadDashboard(); });
        updateHistory('dashboard');
    }
  },

  showProfileForm: () => {
    document.getElementById('splash-screen')?.classList.add('hidden');
    document.getElementById('auth-screen')?.classList.add('hidden');

    renderPage('profile', (contentEl) => {
      contentEl.innerHTML = `
        <div class="p-5 max-w-md mx-auto">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-3 mx-auto">
              <i class="fas fa-user-graduate"></i>
            </div>
            <h2 class="text-xl font-bold">Complete Your Profile</h2>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <form id="profile-form" class="space-y-4">
              <div>
                <label class="form-label">Full Name <span class="required">*</span></label>
                <input type="text" id="full-name" class="form-input" placeholder="Enter your full name" required>
              </div>
              <div>
                <label class="form-label">Phone Number <span class="optional">(Optional)</span></label>
                <input type="tel" id="phone" class="form-input" placeholder="Enter your phone number">
              </div>
              <div>
                <label class="form-label">Father's Phone Number <span class="required">*</span></label>
                <input type="tel" id="father-phone" class="form-input" placeholder="Enter father's phone number" required>
              </div>
              <div>
                <label class="form-label">Mother's Phone Number <span class="required">*</span></label>
                <input type="tel" id="mother-phone" class="form-input" placeholder="Enter mother's phone number" required>
              </div>
              <div>
                <label class="form-label">School Name <span class="required">*</span></label>
                <input type="text" id="school-name" class="form-input" placeholder="Enter school name" required>
              </div>
              <div>
                <label class="form-label">College/University Name</label>
                <input type="text" id="college-name" class="form-input" placeholder="Enter college/university name">
              </div>
              <div>
                <label class="form-label">Class/Level <span class="required">*</span></label>
                <select id="class-level" class="form-input" required>
                  <option value="">Select your class</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="SSC">SSC</option>
                  <option value="HSC">HSC</option>
                  <option value="Admission">Admission</option>
                </select>
              </div>
              <div class="form-group" id="admission-stream-group" style="display:none;">
                <label class="form-label">Stream <span class="required">*</span></label>
                <select id="admission-stream" class="form-input">
                  <option value="">Select stream</option>
                  <option value="Science">Science</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Commerce">Commerce</option>
                </select>
              </div>
              <!-- TEACHER CODE FIELD REMOVED -->
              <button type="button" onclick="window.saveStudentProfile()" class="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-xl font-bold mt-4">
                Save Profile & Continue
              </button>
            </form>
          </div>
        </div>
      `;

      const classSelect = document.getElementById('class-level');
      const streamGroup = document.getElementById('admission-stream-group');
      if (classSelect) {
        classSelect.addEventListener('change', function () {
          streamGroup.style.display = this.value === 'Admission' ? 'block' : 'none';
        });
      }

      window.saveStudentProfile = async () => {
        const fullName = document.getElementById('full-name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const fatherPhone = document.getElementById('father-phone').value.trim();
        const motherPhone = document.getElementById('mother-phone').value.trim();
        const schoolName = document.getElementById('school-name').value.trim();
        const collegeName = document.getElementById('college-name').value.trim();
        const classLevel = document.getElementById('class-level').value;
        const admissionStream = document.getElementById('admission-stream')?.value || null;

        if (!fullName || !fatherPhone || !motherPhone || !schoolName || !classLevel) {
          Swal.fire('ত্রুটি', 'সব আবশ্যক তথ্য পূরণ করুন', 'error');
          return;
        }
        if (classLevel === 'Admission' && !admissionStream) {
          Swal.fire('ত্রুটি', 'শাখা নির্বাচন করুন', 'error');
          return;
        }

        const user = auth.currentUser;
        if (!user) return;

        const profileData = {
          name: fullName,
          phone: phone || "",
          fatherPhone,
          motherPhone,
          schoolName,
          collegeName: collegeName || "",
          classLevel,
          admissionStream,
          teacherCodes: [],          // no teacher code needed
          profileCompleted: true,
          updatedAt: new Date()
        };

        const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const { updateProfile } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js");
        await updateProfile(user, { displayName: fullName });
        await updateDoc(doc(db, "students", user.uid), profileData);

        AppState.profileCompleted = true;
        AppState.userProfile = { ...AppState.userProfile, ...profileData };
        AppState.teacherCodes = [];
        AppState.activeTeacherCode = null;
        AppState.classLevel = classLevel;
        AppState.admissionStream = admissionStream;
        localStorage.setItem('studentClassLevel', classLevel);
        if (admissionStream) localStorage.setItem('studentAdmissionStream', admissionStream);
        localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));
        localStorage.setItem('userLoggedIn', 'true');

        Swal.fire('সফল', 'প্রোফাইল সংরক্ষিত হয়েছে!', 'success').then(() => Router.initStudent());
      };
    });

    window.history.replaceState({ route: 'profile' }, '', '#profile');
  },

  student: async (p) => {
    window.currentRouteId = (window.currentRouteId || 0) + 1;
    clearListeners();

    if (!AppState.profileCompleted && p !== 'profile') {
      Swal.fire('প্রোফাইল প্রয়োজন', 'প্রথমে প্রোফাইল সম্পূর্ণ করুন', 'warning').then(() => Router.showProfileForm());
      return;
    }

    // No teacher code required

    const exceptions = ['dashboard', 'profile', 'management', 'courses', 'notices'];
    if (!exceptions.includes(p) && !AppState.activeGroupId) {
      Swal.fire({
        title: 'কোর্সে জয়েন নেই',
        text: 'এই ফিচারটি ব্যবহার করতে আগে একটি কোর্সে জয়েন করুন।',
        icon: 'warning',
        confirmButtonText: 'কোর্স খুঁজুন',
        showCancelButton: true,
        cancelButtonText: 'বাতিল'
      }).then((result) => {
        if (result.isConfirmed) {
          Router.student('courses');
        }
      });
      return;
    }

    if (AppState.userDisabled && p !== 'profile' && p !== 'management') {
      Swal.fire('প্রবেশাধিকার নেই', 'আপনার অ্যাকাউন্ট নিষ্ক্রিয়।', 'warning').then(() => Router.student('profile'));
      return;
    }

    // Load the page with normal history push (adds new entry)
    Router._loadPage(p, false);
  }
};

window.Router = Router;

window.addEventListener('popstate', (event) => {
  if (!event.state) {
    // No history state – we are at the initial entry; go to landing page
    window.location.href = '/';
    return;
  }
  if (event.state.route) {
    Router._loadPage(event.state.route, false);  // load page without pushing again? We want to reflect the popped state without adding duplicate.
    // Actually, when the popstate happens, the URL already changed; we should just render the page.
    // To avoid pushing another state, we can call _loadPage with isInitial = true? No, because that would replace the current state.
    // Better: we'll just manually render without touching history.
    // Simplest: call the page loading functions directly, without push.
    Router._loadPage(event.state.route, true);  // replace the current state to match the popped URL
  } else {
    Router._loadPage('dashboard', true);
  }
});
