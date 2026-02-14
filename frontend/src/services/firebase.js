// ==============================
// firebase.js
// Configuración de Firebase (Auth)
// - Inicializa la app
// - Exporta Auth
// - Exporta GoogleAuthProvider
// ==============================

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ==============================
// 1) Firebase configuration
// ==============================
// ⚠️ Estas claves son públicas por diseño (frontend).
// La seguridad real depende de las reglas y del backend.
const firebaseConfig = {
  apiKey: "AIzaSyCDysO7_sImnt-9jGjzsdj14KYtbELVCyY",
  authDomain: "ecosteps-ee7cd.firebaseapp.com",
  projectId: "ecosteps-ee7cd",
  storageBucket: "ecosteps-ee7cd.firebasestorage.app",
  messagingSenderId: "1038798206779",
  appId: "1:1038798206779:web:1af9661e4462e8fdb8291e",
};

// ==============================
// 2) Initialize Firebase App
// ==============================
const app = initializeApp(firebaseConfig);

// ==============================
// 3) Firebase Auth instance
// ==============================
// Se usa en login, Google OAuth, etc.
const auth = getAuth(app);

// ==============================
// 4) Google Auth Provider
// ==============================
// Usado para signInWithPopup / signInWithRedirect
const provider = new GoogleAuthProvider();

// ==============================
// 5) Exports
// ==============================
export { auth, provider };
