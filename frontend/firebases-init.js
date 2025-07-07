// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
