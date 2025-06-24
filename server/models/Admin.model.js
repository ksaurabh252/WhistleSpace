
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
    minlength: 8,
  },
});

// -----------------------------
// Model Export
// -----------------------------
module.exports = mongoose.model("Admin", AdminSchema);
