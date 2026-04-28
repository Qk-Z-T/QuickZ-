// src/teacher/features/profile/profile.logic.js
// Teacher profile management logic

import { db } from '../../../shared/config/firebase.js';
import { AppState } from '../../core/state.js';
import { Teacher } from '../../teacher-core.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { renderProfileDisplay, renderProfileEditForm } from './profile.view.js';

export const ProfileLogic = {

  /**
   * Show teacher's own profile.
   */
  async viewProfile() {
    if (!AppState.currentUser) return;

    document.getElementById('app-container').innerHTML = renderProfileDisplay(AppState.currentUser);
    document.getElementById('profile-edit-btn')?.addEventListener('click', () => this.enableEditMode());
  },

  /**
   * Switch profile view to edit mode.
   */
  enableEditMode() {
    appContainer.innerHTML = renderProfileEditForm(AppState.currentUser);

    document.getElementById('profile-save-btn')?.addEventListener('click', () => this.saveProfile());
  },

  /**
   * Save teacher profile (fullName, phone).
   */
  async saveProfile() {
    const fullName = document.getElementById('profile-fullname')?.value.trim();
    const phone = document.getElementById('profile-phone')?.value.trim();

    if (!fullName || !phone) {
      Swal.fire('ত্রুটি', 'সব ঘর পূরণ করুন', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, "teachers", AppState.currentUser.id), {
        fullName,
        phone,
        updatedAt: new Date()
      });

      AppState.currentUser.fullName = fullName;
      AppState.currentUser.phone = phone;
      localStorage.setItem('teacher_data', JSON.stringify(AppState.currentUser));

      Swal.fire('সফল', 'প্রোফাইল আপডেট হয়েছে', 'success').then(() => this.viewProfile());
    } catch (error) {
      Swal.fire('ত্রুটি', 'প্রোফাইল আপডেট ব্যর্থ: ' + error.message, 'error');
    }
  },

  /**
   * Change teacher password (prompt for old/new).
   */
  async changePassword() {
    const { value: formValues } = await Swal.fire({
      title: 'পাসওয়ার্ড পরিবর্তন',
      html:
        '<input id="swal-old" class="swal2-input" placeholder="বর্তমান পাসওয়ার্ড" type="password">' +
        '<input id="swal-new" class="swal2-input" placeholder="নতুন পাসওয়ার্ড" type="password">' +
        '<input id="swal-conf" class="swal2-input" placeholder="নতুন পাসওয়ার্ড নিশ্চিত করুন" type="password">',
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return [
          document.getElementById('swal-old').value,
          document.getElementById('swal-new').value,
          document.getElementById('swal-conf').value
        ];
      }
    });

    if (!formValues) return;

    const [oldPass, newPass, confPass] = formValues;
    if (!oldPass || !newPass || !confPass) {
      Swal.fire('ত্রুটি', 'সব ঘর পূরণ করুন', 'error');
      return;
    }
    if (newPass !== confPass) {
      Swal.fire('ত্রুটি', 'নতুন পাসওয়ার্ড মিলছে না', 'error');
      return;
    }
    if (oldPass !== AppState.currentUser.password) {
      Swal.fire('ত্রুটি', 'বর্তমান পাসওয়ার্ড ভুল', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, "teachers", AppState.currentUser.id), {
        password: newPass,
        updatedAt: new Date()
      });

      AppState.currentUser.password = newPass;
      localStorage.setItem('teacher_data', JSON.stringify(AppState.currentUser));
      Swal.fire('সফল', 'পাসওয়ার্ড পরিবর্তন হয়েছে', 'success');
    } catch (error) {
      Swal.fire('ত্রুটি', 'পাসওয়ার্ড পরিবর্তন ব্যর্থ: ' + error.message, 'error');
    }
  },

  /**
   * View a student profile from teacher side.
   */
  async viewStudentProfile(studentId, groupId) {
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
              <button id="student-edit-btn" onclick="ProfileLogic.enableStudentEdit()" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold transition bengali-text">
                <i class="fas fa-edit mr-1"></i> পিতামাতার ফোন সম্পাদনা
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="text-xs font-bold dark:text-white bengali-text">পূর্ণ নাম</label>
                <input class="w-full p-2 border rounded bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed" value="${s.fullName || s.name || ''}" readonly>
              </div>
              <div>
                <label class="text-xs font-bold dark:text-white bengali-text">শিক্ষার্থীর ফোন</label>
                <input class="w-full p-2 border rounded bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed" value="${s.phone || ''}" readonly>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-bold dark:text-white bengali-text text-indigo-600 dark:text-indigo-400">পিতার ফোন</label>
                  <input id="edit-s-fphone" class="w-full p-2 border rounded bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 transition-all" value="${s.fatherPhone || ''}" readonly>
                </div>
                <div>
                  <label class="text-xs font-bold dark:text-white bengali-text text-indigo-600 dark:text-indigo-400">মাতার ফোন</label>
                  <input id="edit-s-mphone" class="w-full p-2 border rounded bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 transition-all" value="${s.motherPhone || ''}" readonly>
                </div>
              </div>
              <div>
                <label class="text-xs font-bold dark:text-white bengali-text">বিদ্যালয়ের নাম</label>
                <input class="w-full p-2 border rounded bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed" value="${s.schoolName || ''}" readonly>
              </div>
              <div>
                <label class="text-xs font-bold dark:text-white bengali-text">কলেজের নাম</label>
                <input class="w-full p-2 border rounded bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed" value="${s.collegeName || ''}" readonly>
              </div>
              <button id="student-save-btn" onclick="ProfileLogic.updateStudentProfileByTeacher('${studentId}', '${groupId}')" class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold mt-4 bengali-text hidden shadow-lg">পরিবর্তন সংরক্ষণ</button>
            </div>
          </div>
        </div>`;
    } catch (e) {
      console.error(e);
      Swal.fire('ত্রুটি', 'শিক্ষার্থীর প্রোফাইল লোড করতে ব্যর্থ', 'error');
    }
  },

  enableStudentEdit() {
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
  },

  async updateStudentProfileByTeacher(studentId, groupId) {
    const updateData = {
      fatherPhone: document.getElementById('edit-s-fphone')?.value.trim() || '',
      motherPhone: document.getElementById('edit-s-mphone')?.value.trim() || '',
      updatedAt: new Date()
    };

    try {
      await updateDoc(doc(db, "students", studentId), updateData);
      Swal.fire('সফল', 'পিতামাতার ফোন নম্বর আপডেট হয়েছে', 'success');
      this.viewStudentProfile(studentId, groupId);
    } catch (e) {
      Swal.fire('ত্রুটি', e.message, 'error');
    }
  }
};

// Attach to Teacher object
Teacher.viewProfile = ProfileLogic.viewProfile;
Teacher.viewStudentProfile = ProfileLogic.viewStudentProfile;
Teacher.enableStudentEdit = ProfileLogic.enableStudentEdit;
Teacher.updateStudentProfileByTeacher = ProfileLogic.updateStudentProfileByTeacher;
Teacher.changePassword = ProfileLogic.changePassword;
