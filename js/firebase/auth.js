/* =========================================================
   Money — js/firebase/auth.js
   Firebase Authentication Session Engine & Identity Management
   ========================================================= */

import { auth, googleProvider } from './config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';

let currentUser = null;
const authListeners = [];

// Configure persistent browser session
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch(err => {
    console.warn('Auth persistence config note:', err);
  });
}

export const FirebaseAuth = {
  init(onUserChange) {
    if (onUserChange) authListeners.push(onUserChange);

    if (auth) {
      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authListeners.forEach(fn => fn(user));
      });
    } else {
      currentUser = null;
      authListeners.forEach(fn => fn(null));
    }
  },

  getUser() {
    return currentUser;
  },

  getUid() {
    return currentUser ? currentUser.uid : null;
  },

  async loginWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Authentication is initialized in offline mode.');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      currentUser = cred.user;
      return cred.user;
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  },

  async registerWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Authentication is initialized in offline mode.');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      currentUser = cred.user;
      return cred.user;
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  },

  async resetPassword(email) {
    if (!auth) throw new Error('Firebase Authentication is initialized in offline mode.');
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  },

  async loginWithGoogle() {
    if (!auth) throw new Error('Firebase Authentication is initialized in offline mode.');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      currentUser = cred.user;
      return cred.user;
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  },

  async logoutUser() {
    if (auth) {
      await signOut(auth);
    }
    currentUser = null;
  },

  formatAuthError(err) {
    const code = err.code || '';
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email address or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/popup-closed-by-user':
        return 'Google Sign-In popup was closed before completing.';
      case 'auth/network-request-failed':
        return 'Network connection failure. Please check your internet connection.';
      default:
        return err.message || 'Authentication operation failed. Please try again.';
    }
  }
};
