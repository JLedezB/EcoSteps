const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 🔍 DEBUG (IMPORTANTE)
    console.log("MONGO_URI debug:", JSON.stringify(process.env.MONGO_URI));
    console.log("MONGO_URI tipo:", typeof process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB conectado correctamente");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;