// frontend/firebase-init.js
// This assumes you're using <script> tags in HTML to load Firebase v8 SDKs like:
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js"></script>

// ✅ Firebase configuration for Zentrafuge v8 - FIXED: Consistent with v8 project
var firebaseConfig = {
  apiKey: "AIzaSyCYt2SfTJiCh1egk-q30_NLlO0kA4-RH0k",
  authDomain: "zentrafuge-v8.firebaseapp.com",
  projectId: "zentrafuge-v8",
  storageBucket: "zentrafuge-v8.appspot.com",
  messagingSenderId: "1035979155498",
  appId: "1:1035979155498:web:502d1bdbfadc116542bb53",
  measurementId: "G-WZNXDGR0BN"
};

// ✅ Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}

// ✅ Optional: initialize analytics
try {
  if (typeof firebase.analytics === 'function') {
    firebase.analytics();
    console.log('📊 Firebase Analytics initialized');
  }
} catch (err) {
  console.log('Analytics skipped:', err.message);
}

// ✅ Debug logs to confirm SDKs
console.log('🔥 Firebase initialized successfully');
console.log('📧 Auth SDK loaded:', typeof firebase.auth);
console.log('📂 Firestore SDK loaded:', typeof firebase.firestore);

// ✅ Optional: export global references for debugging
window.firebaseApp = firebase.app();
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();

// 🎯 CRITICAL: Fire the event that script.js is waiting for
window.dispatchEvent(new Event('firebaseReady'));
console.log('🚀 firebaseReady event fired - script.js should now initialize');
