// src/shared/services/auth.service.js
// Shared authentication service for both Student and Teacher portals

import { auth, db } from '../config/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export const AuthService = {
  /**
   * Student sign‑up (Firebase Auth)
   */
  async studentSignUp(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Create initial student document
    await setDoc(doc(db, "students", cred.user.uid), {
      uid: cred.user.uid,
      email: email,
      name: "",
      phone: "",
      fatherPhone: "",
      motherPhone: "",
      schoolName: "",
      collegeName: "",
      teacherCodes: [],
      groupCode: "",
      joinedGroups: [],
      profileCompleted: false,
      blocked: false,
      disabled: false,
      joined: new Date()
    });
    return cred.user;
  },

  /**
   * Student sign‑in (Firebase Auth)
   */
  async studentSignIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "students", cred.user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.blocked) {
        await signOut(auth);
        throw new Error('account_blocked');
      }
    }
    return cred.user;
  },

  /**
   * Teacher sign‑in (custom authentication via Firestore teachers collection)
   */
  async teacherSignIn(email, password) {
    const teachersQuery = query(collection(db, "teachers"), where("email", "==", email));
    const querySnapshot = await getDocs(teachersQuery);

    if (querySnapshot.empty) {
      throw new Error('teacher_not_found');
    }

    let teacherData = null;
    let teacherId = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.password === password) {
        teacherData = data;
        teacherId = doc.id;
      }
    });

    if (!teacherData) {
      throw new Error('invalid_credentials');
    }

    if (teacherData.disabled) {
      throw new Error('account_disabled');
    }

    // Build session object and cache
    const teacherSession = {
      id: teacherId,
      ...teacherData
    };
    localStorage.setItem('teacher_sess', 'true');
    localStorage.setItem('teacher_email', email);
    localStorage.setItem('teacher_data', JSON.stringify(teacherSession));

    return teacherSession;
  },

  /**
   * Sign out (both portals)
   */
  async signOut() {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut failed:', e);
    }
    // Clear teacher session if present
    localStorage.removeItem('teacher_sess');
    localStorage.removeItem('teacher_email');
    localStorage.removeItem('teacher_data');
    localStorage.removeItem('selectedGroup');
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userProfile');
  },

  /**
   * Auth state observer (primarily for student portal)
   */
  observeAuth(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get current Firebase user (or null)
   */
  getCurrentUser() {
    return auth.currentUser;
  }
};
