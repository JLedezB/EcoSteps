import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ==============================
// Firebase configuration
// ==============================
const firebaseConfig = {
  apiKey: "AIzaSyCDysO7_sImnt-9jGjzsdj14KYtbELVCyY",
  authDomain: "ecosteps-ee7cd.firebaseapp.com",
  projectId: "ecosteps-ee7cd",
  storageBucket: "ecosteps-ee7cd.firebasestorage.app",
  messagingSenderId: "1038798206779",
  appId: "1:1038798206779:web:1af9661e4462e8fdb8291e",
};

// ==============================
// Initialize Firebase App
// ==============================
const app = initializeApp(firebaseConfig);

// ==============================
// Firebase Auth instance
// ==============================
const auth = getAuth(app);

// ==============================
// Google Auth Provider
// ==============================
const provider = new GoogleAuthProvider();

// ==============================
// Exports
// ==============================
export { auth, provider };