// ==============================
// User.model.js
// Modelo de Usuario (local + Google)
// ==============================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ==============================
// Schema
// ==============================
const userSchema = new mongoose.Schema(
  {
    // ==========================
    // Identidad / Perfil
    // ==========================
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    apellido: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    telefono: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================
    // Auth
    // ==========================
    // Si es usuario Google, puede venir sin password
    password: {
      type: String,
      required: false,
    },

    google: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ==========================
    // Servicio social (progreso)
    // ==========================
    serviceHours: {
      type: Number,
      default: 0, // 0..480
    },

    approvedReports: {
      type: Number,
      default: 0, // 0..3
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// ==============================
// Hooks
// ==============================

// ✅ Hash password SOLO si existe y cambió
userSchema.pre("save", async function () {
  // Si no hay password (google=true), no hacemos nada
  if (!this.password) return;

  // Solo si la password cambió
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ==============================
// Methods
// ==============================

userSchema.methods.matchPassword = async function (enteredPassword) {
  // Usuarios google: no tienen password local
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

// ==============================
// Export
// ==============================
module.exports = mongoose.model("User", userSchema);