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

  password: {
    type: String,
    required: true,
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
