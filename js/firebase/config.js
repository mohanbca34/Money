/* =========================================================
   MoneyFlow — firebase/config.js
   Firebase SDK Initialization (v10 ES Modules)
   ========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

// Public Client Configuration (Protected by Firestore Security Rules)
const firebaseConfig = {
  apiKey: "AIzaSyDemoMoneyFlowKeyForClientAuth123",
  authDomain: "moneyflow-app.firebaseapp.com",
  projectId: "moneyflow-app",
  storageBucket: "moneyflow-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
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
} catch (err) {
  console.warn('Firebase initialization note (offline mode fallback ready):', err);
}

export { app, auth, db, googleProvider };
