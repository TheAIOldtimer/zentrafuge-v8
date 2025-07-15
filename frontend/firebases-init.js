// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Analytics (optional)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export for use in other files
export { auth, db, analytics };
export default app;
