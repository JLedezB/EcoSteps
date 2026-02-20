const mongoose = require("mongoose");

const emailOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true }, // bcrypt hash
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL index: Mongo borrará docs expirados
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("EmailOtp", emailOtpSchema);
