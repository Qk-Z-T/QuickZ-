// src/teacher/features/groups/groups.logic.js
// Groups/Students management: list students, approve/reject join requests, remove students, archive/restore courses

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Teacher } from '../../teacher-core.js';
import {
  collection, doc, getDoc, updateDoc, deleteDoc,
  query, where, orderBy, getDocs, arrayUnion, addDoc, arrayRemove
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { renderGroupList, renderStudentList, renderStudentProfileEdit } from './groups.view.js';

const CLASS_LEVELS = ['6', '7', '8', 'SSC', 'HSC', 'Admission'];
const ADMISSION_STREAMS = ['Science', 'Humanities', 'Commerce'];

// ---------- Group CRUD ----------

Teacher.manageGroupsView = async function () {
  document.getElementById('app-container').innerHTML = `
    <div class="pb-6">
      <div class="flex items-center gap-3 mb-6">
        <button onclick="Router.teacher(AppState.currentPage)" class="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 bg-white dark:bg-gray-800 border dark:border-gray-700 px-3 py-2 rounded-lg transition bengali-text">
          <i class="fas fa-arrow-left"></i> ফিরে যান
        </button>
        <h2 class="text-2xl font-bold font-en text-gray-800 dark:text-white bengali-text">কোর্স ব্যবস্থাপনা</h2>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700 sticky top-4">
            <h3 class="font-bold text-base mb-4 dark:text-white bengali-text flex items-center gap-2"><i class="fas fa-plus-circle text-indigo-600"></i> নতুন কোর্স তৈরি</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold mb-1 dark:text-white bengali-text text-gray-600">কোর্সের নাম <span class="text-red-500">*</span></label>
                <input type="text" id="new-group-name" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl bengali-text text-sm" placeholder="যেমনঃ ক্লাস ১০ ব্যাচ-১">
              </div>
              <div>
                <label class="block text-xs font-bold mb-1 dark:text-white bengali-text text-gray-600">ক্লাস/লেভেল <span class="text-red-500">*</span></label>
                <select id="new-group-class" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl bengali-text text-sm">
                  <option value="">সিলেক্ট করুন</option>
                  ${CLASS_LEVELS.map(lvl => `<option value="${lvl}">${lvl === 'Admission' ? 'এডমিশন' : (lvl === 'SSC' ? 'এসএসসি' : (lvl === 'HSC' ? 'এইচএসসি' : lvl + 'ম শ্রেণী'))}</option>`).join('')}
                </select>
              </div>
              <div id="admission-stream-container" class="hidden">
                <label class="block text-xs font-bold mb-1 dark:text-white bengali-text text-gray-600">শাখা (Admission)</label>
                <select id="new-group-admission-stream" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl bengali-text text-sm">
                  <option value="">সিলেক্ট করুন</option>
                  ${ADMISSION_STREAMS.map(s => `<option value="${s}">${s === 'Science' ? 'সায়েন্স' : (s === 'Humanities' ? 'মানবিক' : 'কমার্স')}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold mb-1 dark:text-white bengali-text text-gray-600">বিবরণ</label>
                <textarea id="new-group-description" rows="3" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl bengali-text text-sm" placeholder="কোর্স সম্পর্কে বিস্তারিত লিখুন..."></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold mb-1 dark:text-white bengali-text text-gray-600">জয়েন মেথড <span class="text-red-500">*</span></label>
                <select id="new-group-join-method" class="w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl bengali-text text-sm">
                  <option value="public">পাবলিক (যে কেউ জয়েন করতে পারবে)</option>
                  <option value="code">কোর্স কোড প্রয়োজন</option>
                  <option value="permission">পারমিশন কী প্রয়োজন</option>
                </select>
              </div>
              <button onclick="Teacher.createFullGroup()" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg text-sm hover:opacity-90 transition bengali-text">
                <i class="fas fa-plus mr-2"></i>কোর্স তৈরি
              </button>
            </div>
          </div>
        </div>
        <div class="lg:col-span-2">
          <div id="groups-container">
            <div class="text-center p-8 text-gray-400 bengali-text">কোর্স লোড হচ্ছে...</div>
          </div>
        </div>
      </div>
    </div>`;

  // Admission stream toggle
  const classSelect = document.getElementById('new-group-class');
  const streamContainer = document.getElementById('admission-stream-container');
  classSelect?.addEventListener('change', () => {
    streamContainer.style.display = classSelect.value === 'Admission' ? 'block' : 'none';
  });

  await Teacher.loadTeacherGroups();
  // loadTeacherGroups is defined below
};

Teacher.createFullGroup = async function () {
  const name = document.getElementById('new-group-name').value.trim();
  const classLevel = document.getElementById('new-group-class').value;
  const description = document.getElementById('new-group-description').value.trim();
  const joinMethod = document.getElementById('new-group-join-method').value;
  const imageFile = document.getElementById('new-group-image')?.files?.[0];

  if (!name) return Swal.fire('ত্রুটি', 'কোর্সের নাম আবশ্যক', 'error');
  if (!classLevel) return Swal.fire('ত্রুটি', 'ক্লাস/লেভেল সিলেক্ট করুন', 'error');

  let admissionStream = null;
  if (classLevel === 'Admission') {
    admissionStream = document.getElementById('new-group-admission-stream').value;
    if (!admissionStream) return Swal.fire('ত্রুটি', 'অনুগ্রহ করে শাখা সিলেক্ট করুন', 'error');
  }

  try {
    Swal.fire({ title: 'কোর্স তৈরি হচ্ছে...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let groupCode = '';
    for (let i = 0; i < 5; i++) groupCode += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 5; i++) groupCode += numbers.charAt(Math.floor(Math.random() * numbers.length));

    let imageUrl = null;
    // Image upload skipped for simplicity (can add later)
    const groupData = {
      name,
      groupCode,
      classLevel,
      admissionStream: admissionStream || null,
      description: description || '',
      imageUrl: imageUrl || null,
      joinMethod,
      permissionKey: null,
      permissionKeyUsed: false,
      teacherId: AppState.currentUser.id,
      teacherName: AppState.currentUser.fullName,
      archived: false,
      approvalRequired: false,
      joinEnabled: true,
      studentIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDoc(collection(db, "groups"), groupData);
    Swal.fire({
      title: 'কোর্স তৈরি হয়েছে!',
      html: `<div class="text-left"><p><strong>কোর্সের নাম:</strong> ${name}</p><p><strong>কোর্স কোড:</strong> <code>${groupCode}</code></p></div>`,
      icon: 'success'
    }).then(() => {
      Teacher.loadTeacherGroups();
      Teacher.loadGroupsForSwitcher();
    });
  } catch (error) {
    Swal.fire('ত্রুটি', 'কোর্স তৈরি ব্যর্থ: ' + error.message, 'error');
  }
};

// load teacher groups into UI
Teacher.loadTeacherGroups = async function () {
  try {
    const groupsQuery = query(
      collection(db, "groups"),
      where("teacherId", "==", AppState.currentUser.id),
      where("archived", "==", false),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(groupsQuery);
    const groups = [];
    snap.forEach(d => groups.push({ id: d.id, ...d.data() }));
    Teacher.teacherGroups = groups;

    const container = document.getElementById('groups-container');
    if (container) {
      container.innerHTML = renderGroupList(groups);
    }
  } catch (e) {
    console.error(e);
  }
};

// ---------- Student list view ----------
Teacher.viewGroupStudents = async function (groupId, initialFilter = 'all') {
  try {
    const groupDoc = await getDoc(doc(db, "groups", groupId));
    if (!groupDoc.exists()) return;
    const group = { id: groupDoc.id, ...groupDoc.data() };

    document.getElementById('app-container').innerHTML =
      '<div class="p-10 text-center"><div class="quick-loader mx-auto"></div></div>';

    // Fetch active students
    const students = [];
    if (group.studentIds && group.studentIds.length > 0) {
      const studentPromises = group.studentIds.map(async studentId => {
        const sDoc = await getDoc(doc(db, "students", studentId));
        if (sDoc.exists()) {
          const s = sDoc.data();
          return {
            id: studentId,
            studentId: studentId,
            fullName: s.fullName || s.name || '',
            email: s.email || '',
            phone: s.phone || '',
            fatherPhone: s.fatherPhone || '',
            motherPhone: s.motherPhone || '',
            schoolName: s.schoolName || '',
            collegeName: s.collegeName || '',
            status: 'active'
          };
        }
        return null;
      });
      const results = await Promise.all(studentPromises);
      results.forEach(r => { if (r) students.push(r); });
    }

    // Fetch pending join requests
    const reqQ = query(collection(db, "join_requests"), where("groupId", "==", groupId), where("status", "==", "pending"));
    const reqSnap = await getDocs(reqQ);
    const pendingStudents = [];
    reqSnap.forEach(d => {
      const r = d.data();
      pendingStudents.push({
        id: d.id,
        studentId: r.studentId,
        fullName: r.studentName,
        email: r.studentEmail,
        requestedAt: r.requestedAt,
        status: 'pending'
      });
    });

    const allStudents = [...students.map(s => ({ ...s, status: 'active' })), ...pendingStudents];

    window.currentGroupStudents = allStudents;
    window.currentGroupId = groupId;

    document.getElementById('app-container').innerHTML = `
      <div class="pb-6">
        <button onclick="Router.teacher(AppState.currentPage)" class="mb-4 text-xs font-bold text-gray-500 dark:text-gray-400 bengali-text">
          <i class="fas fa-arrow-left"></i> ফিরে যান
        </button>
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-xl font-bold font-en text-gray-800 dark:text-white bengali-text">${group.name}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 bengali-text">${allStudents.length} জন ব্যবহারকারী</p>
          </div>
          <div class="group-code-container mt-0">
            <span class="group-code-text">${group.groupCode}</span>
            <button onclick="Teacher.copyGroupCode('${group.groupCode}')" class="copy-btn"><i class="fas fa-copy"></i></button>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border dark:border-gray-700">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium dark:text-white bengali-text">যোগদান সক্রিয়</span>
              <label class="toggle-switch">
                <input type="checkbox" ${group.joinEnabled ? 'checked' : ''} onchange="Teacher.toggleGroupSetting('${group.id}', 'joinEnabled', this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="flex items-center justify-between border-l border-gray-100 dark:border-gray-700 pl-4">
              <span class="text-sm font-medium dark:text-white bengali-text">অনুমোদন প্রয়োজন</span>
              <label class="toggle-switch">
                <input type="checkbox" ${group.approvalRequired ? 'checked' : ''} onchange="Teacher.toggleGroupSetting('${group.id}', 'approvalRequired', this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p class="text-sm"><span class="font-bold">জয়েন মেথড:</span> ${
              { public: 'পাবলিক', code: 'কোর্স কোড', permission: 'পারমিশন কী' }[group.joinMethod] || 'কোর্স কোড'
            }</p>
            ${group.joinMethod === 'permission' && group.permissionKey && !group.permissionKeyUsed ? `
            <p class="text-sm mt-1">পারমিশন কী: <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${group.permissionKey}</code>
            <button onclick="Teacher.copyPermissionKey('${group.permissionKey}')" class="text-xs text-indigo-600 ml-2"><i class="fas fa-copy"></i></button></p>` : ''}
          </div>
        </div>
        <div class="search-bar-container mb-6">
          <input type="text" id="student-search-input" class="search-bar-input w-full p-3 border dark:border-gray-700 dark:bg-black dark:text-white rounded-xl bengali-text" placeholder="নাম, ফোন, ইমেইল, পিতা/মাতার নাম্বার বা প্রতিষ্ঠানের নাম লিখুন...">
          <i class="search-icon fas fa-search"></i>
          <button class="clear-search-btn" onclick="Teacher.clearStudentSearch()"><i class="fas fa-times"></i></button>
        </div>
        <div class="filter-tabs" id="student-filter-tabs">
          <div class="filter-tab bengali-text" onclick="Teacher.filterStudents('all')">সব (${allStudents.length})</div>
          <div class="filter-tab bengali-text" onclick="Teacher.filterStudents('active')">সক্রিয় (${students.length})</div>
          <div class="filter-tab bengali-text" onclick="Teacher.filterStudents('pending')">অপেক্ষমান (${pendingStudents.length})</div>
        </div>
        <div class="student-list-container" id="student-list"></div>
      </div>`;

    document.getElementById('student-search-input')?.addEventListener('input', Teacher.searchStudents);
    Teacher.filterStudents(initialFilter);
  } catch (e) {
    console.error(e);
    document.getElementById('app-container').innerHTML =
      '<div class="text-center p-10 text-red-500 bengali-text">শিক্ষার্থী লোড করতে ত্রুটি</div>';
  }
};

// ---------- Filter and search ----------
Teacher.filterStudents = function (filter) {
  window.currentFilter = filter;
  const tabs = document.querySelectorAll('#student-filter-tabs .filter-tab');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.textContent.toLowerCase().includes(filter.toLowerCase())) tab.classList.add('active');
  });

  let filtered = window.currentGroupStudents || [];
  if (filter === 'active') filtered = filtered.filter(s => s.status === 'active');
  else if (filter === 'pending') filtered = filtered.filter(s => s.status === 'pending');

  // Apply search term if any
  const searchInput = document.getElementById('student-search-input');
  if (searchInput && searchInput.value.trim()) {
    const term = searchInput.value.toLowerCase().trim();
    filtered = filtered.filter(s =>
      (s.fullName || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term) ||
      (s.fatherPhone || '').toLowerCase().includes(term) ||
      (s.motherPhone || '').toLowerCase().includes(term) ||
      (s.schoolName || '').toLowerCase().includes(term) ||
      (s.collegeName || '').toLowerCase().includes(term)
    );
  }

  document.getElementById('student-list').innerHTML = renderStudentList(filtered);
};

Teacher.searchStudents = function () {
  Teacher.filterStudents(window.currentFilter || 'all');
};

Teacher.clearStudentSearch = function () {
  const input = document.getElementById('student-search-input');
  if (input) input.value = '';
  Teacher.filterStudents(window.currentFilter || 'all');
};

// ---------- Approve / Reject / Remove ----------
Teacher.approveStudentRequest = async function (requestId, groupId) {
  const reqDoc = await getDoc(doc(db, "join_requests", requestId));
  if (!reqDoc.exists()) return;
  const request = reqDoc.data();

  await updateDoc(doc(db, "groups", groupId), {
    studentIds: arrayUnion(request.studentId),
    updatedAt: new Date()
  });
  await updateDoc(doc(db, "join_requests", requestId), {
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: AppState.currentUser.id
  });
  Swal.fire('অনুমোদিত!', 'শিক্ষার্থী কোর্সে যোগ করা হয়েছে', 'success');
  Teacher.viewGroupStudents(groupId);
};

Teacher.rejectStudentRequest = async function (requestId, groupId) {
  const result = await Swal.fire({
    title: 'অনুরোধ প্রত্যাখ্যান?',
    text: "এই অনুরোধ প্রত্যাখ্যান করা হবে",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'প্রত্যাখ্যান'
  });
  if (!result.isConfirmed) return;
  await updateDoc(doc(db, "join_requests", requestId), {
    status: 'rejected',
    rejectedAt: new Date(),
    rejectedBy: AppState.currentUser.id
  });
  Swal.fire('প্রত্যাখ্যাত!', 'অনুরোধ প্রত্যাখ্যান করা হয়েছে', 'success');
  Teacher.viewGroupStudents(groupId);
};

Teacher.removeStudentFromGroup = async function (studentId, groupId) {
  const result = await Swal.fire({
    title: 'কোর্স থেকে সরাবেন?',
    text: "এই শিক্ষার্থীকে কোর্স থেকে সরানো হবে।",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'হ্যাঁ, সরান'
  });
  if (!result.isConfirmed) return;

  await updateDoc(doc(db, "groups", groupId), {
    studentIds: arrayRemove(studentId)
  });

  const studentRef = doc(db, "students", studentId);
  const studentSnap = await getDoc(studentRef);
  if (studentSnap.exists()) {
    const data = studentSnap.data();
    const updatedJoined = (data.joinedGroups || []).filter(g => g.groupId !== groupId);
    await updateDoc(studentRef, { joinedGroups: updatedJoined });
  }

  Swal.fire('সরানো হয়েছে', 'শিক্ষার্থীকে কোর্স থেকে সরানো হয়েছে।', 'success');
  Teacher.viewGroupStudents(groupId);
};

// ---------- Archive / Restore / Delete ----------
Teacher.archiveGroupConfirm = async function (groupId, groupCode) {
  const { value: enteredCode } = await Swal.fire({
    title: 'কোর্স আর্কাইভ করবেন?',
    text: "নিশ্চিত করতে কোর্স কোড লিখুন",
    input: 'text',
    inputPlaceholder: 'কোর্স কোড লিখুন',
    showCancelButton: true,
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'আর্কাইভ',
    inputValidator: value => {
      if (!value) return 'কোর্স কোড দিতে হবে!';
      if (value !== groupCode) return 'কোর্স কোড মিলছে না!';
    }
  });
  if (enteredCode === groupCode) {
    await updateDoc(doc(db, "groups", groupId), { archived: true, updatedAt: new Date() });
    if (AppState.selectedGroup?.id === groupId) {
      AppState.selectedGroup = null;
      localStorage.removeItem('selectedGroup');
    }
    Swal.fire('আর্কাইভড!', 'কোর্স আর্কাইভে সরানো হয়েছে।', 'success');
    Teacher.loadTeacherGroups();
    Teacher.loadGroupsForSwitcher();
  }
};

Teacher.deleteGroupConfirm = async function (groupId, groupCode) {
  const { value: enteredCode } = await Swal.fire({
    title: 'কোর্স মুছে ফেলবেন?',
    text: "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। নিশ্চিত করতে কোর্স কোড লিখুন",
    input: 'text',
    inputPlaceholder: 'কোর্স কোড লিখুন',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'মুছে ফেলুন',
    inputValidator: value => {
      if (!value) return 'কোর্স কোড দিতে হবে!';
      if (value !== groupCode) return 'কোর্স কোড মিলছে না!';
    }
  });
  if (enteredCode === groupCode) {
    await deleteDoc(doc(db, "groups", groupId));
    if (AppState.selectedGroup?.id === groupId) {
      AppState.selectedGroup = null;
      localStorage.removeItem('selectedGroup');
    }
    Swal.fire('মুছে ফেলা হয়েছে!', 'কোর্স মুছে ফেলা হয়েছে।', 'success');
    Teacher.loadTeacherGroups();
    Teacher.loadGroupsForSwitcher();
  }
};

// Toggle group setting (joinEnabled, approvalRequired)
Teacher.toggleGroupSetting = async (groupId, setting, value) => {
  try {
    await updateDoc(doc(db, "groups", groupId), { [setting]: value, updatedAt: new Date() });
    const group = Teacher.teacherGroups.find(g => g.id === groupId);
    if (group) group[setting] = value;
  } catch (e) {
    Swal.fire('ত্রুটি', 'সেটিং আপডেট ব্যর্থ', 'error');
  }
};

// Copy permission key
Teacher.copyPermissionKey = (key) => {
  navigator.clipboard.writeText(key).then(() => Swal.fire('কপি হয়েছে', '', 'success'));
};

// View student profile (teacher side)
Teacher.viewStudentProfile = async function (studentId, groupId) {
  try {
    const studentDoc = await getDoc(doc(db, "students", studentId));
    if (!studentDoc.exists()) return;
    const s = studentDoc.data();

    document.getElementById('app-container').innerHTML = `
      <div class="p-0 max-w-2xl">
        <button onclick="Teacher.viewGroupStudents('${groupId}')" class="mb-4 text-xs font-bold text-gray-500 dark:text-gray-400 bengali-text">
          <i class="fas fa-arrow-left"></i> কোর্সে ফিরুন
        </button>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg dark:text-white bengali-text">শিক্ষার্থীর তথ্য</h3>
            <button id="student-edit-btn" onclick="Teacher.enableStudentEdit()" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold transition bengali-text">
              <i class="fas fa-edit mr-1"></i> পিতামাতার ফোন সম্পাদনা
            </button>
          </div>
          ${renderStudentProfileEdit(s)}
        </div>
      </div>`;
  } catch (e) {
    console.error(e);
    Swal.fire('ত্রুটি', 'প্রোফাইল লোড ব্যর্থ', 'error');
  }
};

// Enable editing of father/mother phone fields
Teacher.enableStudentEdit = function () {
  const inputs = ['edit-s-fphone', 'edit-s-mphone'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.removeAttribute('readonly');
      el.classList.remove('bg-gray-50', 'dark:bg-black/50', 'text-gray-500');
      el.classList.add('bg-white', 'dark:bg-black', 'text-gray-800', 'dark:text-white', 'focus:border-indigo-500');
    }
  });
  document.getElementById('student-edit-btn')?.classList.add('hidden');
  document.getElementById('student-save-btn')?.classList.remove('hidden');
};

Teacher.updateStudentProfileByTeacher = async function (studentId, groupId) {
  const updateData = {
    fatherPhone: document.getElementById('edit-s-fphone')?.value.trim() || '',
    motherPhone: document.getElementById('edit-s-mphone')?.value.trim() || '',
    updatedAt: new Date()
  };

  try {
    await updateDoc(doc(db, "students", studentId), updateData);
    Swal.fire('সফল', 'ফোন নম্বর আপডেট হয়েছে', 'success');
    Teacher.viewStudentProfile(studentId, groupId);
  } catch (e) {
    Swal.fire('ত্রুটি', e.message, 'error');
  }
};
