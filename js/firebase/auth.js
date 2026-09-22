/* =========================================================
   MoneyFlow — firebase/auth.js
   Firebase Authentication & Session Engine
   ========================================================= */

import { auth, googleProvider } from './config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';

let currentUser = null;
const authListeners = [];

export const FirebaseAuth = {
  init(onUserChange) {
    if (onUserChange) authListeners.push(onUserChange);

    if (auth) {
      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authListeners.forEach(fn => fn(user));
      });
    } else {
      // Local Guest mode fallback
      currentUser = { uid: 'guest_local_user', email: 'guest@moneyflow.local', isGuest: true };
      authListeners.forEach(fn => fn(currentUser));
    }
  },

  getUser() {
    return currentUser;
  },

  async loginWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth unavailable');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    return cred.user;
  },

  async registerWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth unavailable');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    return cred.user;
  },

  async loginWithGoogle() {
    if (!auth) throw new Error('Firebase Auth unavailable');
    const cred = await signInWithPopup(auth, googleProvider);
    currentUser = cred.user;
    return cred.user;
  },

  async logoutUser() {
    if (auth) {
      await signOut(auth);
    }
    currentUser = null;
  }
};
