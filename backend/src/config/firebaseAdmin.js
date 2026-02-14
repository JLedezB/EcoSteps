// ==============================
// firebaseAdmin.js
// Inicialización de Firebase Admin SDK
// ==============================

const admin = require("firebase-admin");
const path = require("path");

// ==============================
// Inicialización segura (singleton)
// ==============================
if (!admin.apps.length) {
  // 🔐 Credenciales de servicio
  const serviceAccount = require(
    path.join(
      __dirname,
      "../../ecosteps-ee7cd-firebase-adminsdk-fbsvc-e1ef3da4f6.json"
    )
  );

  admin.initializeApp({
    // Autenticación Admin
    credential: admin.credential.cert(serviceAccount),

    // 🪣 Bucket de Firebase Storage
    storageBucket: "ecosteps-ee7cd.appspot.com",
  });
}

// ==============================
// Export
// ==============================
module.exports = admin;
