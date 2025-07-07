const mongoose = require("mongoose");

// -----------------------------
// Admin Schema Definition
// -----------------------------
const AdminSchema = new mongoose.Schema({
  // Authentication Credentials
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  warnings: { type: Number, default: 0 }, // Tracks number of warnings
  banUntil: { type: Date, default: null }, // Tracks when the user is banned until
  password: {
    type: String,
    required: function () {
      return !this.isGoogleAuth;
    },
  },
  isGoogleAuth: { type: Boolean, default: false },
  googleId: String, // Store Google's unique identifier
  avatar: String,
  name: String,
});

// -----------------------------
// Model Export
// -----------------------------
module.exports = mongoose.model("Admin", AdminSchema);
