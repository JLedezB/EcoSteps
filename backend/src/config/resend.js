const { Resend } = require("resend");

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn("⚠️ Falta RESEND_API_KEY en .env");
}

const resend = new Resend(apiKey);

module.exports = resend;
