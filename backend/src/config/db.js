// ==============================
// database.js / connectDB.js
// Conexión a MongoDB (Mongoose)
// ==============================

const mongoose = require("mongoose");

// ==============================
// Conectar a MongoDB
// ==============================
const connectDB = async () => {
  try {
    // Usa la URI desde variables de entorno
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB conectado correctamente");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB");
    console.error(error.message);

    // Detiene la app si no hay DB
    process.exit(1);
  }
};

module.exports = connectDB;
