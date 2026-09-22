/* =========================================================
   Money — js/firebase/config.js
   Centralized Firebase Client Configuration (v10 ES Modules)
   ========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

// Dedicated Web Configuration for project ID: money-ca939
const firebaseConfig = {
  apiKey: "AIzaSyAprgnHM6xGCvC4A7Y4SJYM2CLJF-QzVK0",
  authDomain: "money-ca939.firebaseapp.com",
  projectId: "money-ca939",
  storageBucket: "money-ca939.firebasestorage.app",
  messagingSenderId: "552027725094",
  appId: "1:552027725094:web:82d19487b9a5b49e0db5e7"
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (err) {
  console.warn('Firebase initialization notice:', err);
}

export { app, auth, db, googleProvider };
