// Firebase v8 Configuration for Zentrafuge
// This file uses the v8 syntax to match the script imports

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYt2SfTJiCh1egk-q30_NLlO0kA4-RH0k",
  authDomain: "zentrafuge-v8.firebaseapp.com",
  projectId: "zentrafuge-v8",
  storageBucket: "zentrafuge-v8.firebasestorage.app",
  messagingSenderId: "1035979155498",
  appId: "1:1035979155498:web:502d1bdbfadc116542bb53",
  measurementId: "G-WZNXDGR0BN"
};

// Initialize Firebase using v8 syntax
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // Use existing app
}

// Initialize Analytics (optional, for v8)
if (typeof firebase.analytics === 'function') {
  try {
    firebase.analytics();
    console.log('✅ Firebase Analytics initialized');
  } catch (e) {
    console.log('Analytics not available:', e.message);
  }
}

// Test Firebase connection
console.log('🔥 Firebase initialized successfully');
console.log('📧 Auth SDK loaded:', typeof firebase.auth);
console.log('📊 Firestore SDK loaded:', typeof firebase.firestore);

// Export references for debugging (v8 style)
window.firebaseApp = firebase.app();
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();
