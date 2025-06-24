const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For JWT generation
const Admin = require("../models/Admin.model");
const {
  UNAUTHORIZED,
  SERVER_ERROR,
  FORBIDDEN,
} = require("../utils/errorCodes");

// -----------------------------
// Authentication Controller
// -----------------------------
// Authenticate admin and generate JWT token
async function login(req, res) {
  // Extract credentials from request
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(BAD_REQUEST).json({
      error: "Missing credentials",
      code: "MISSING_CREDENTIALS",
    });
  }

  try {
    // -----------------------------
    // Admin Verification
    // -----------------------------
    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Return generic error to prevent email enumeration
      return res.status(UNAUTHORIZED).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // -----------------------------
    // Password Verification
    // -----------------------------
    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      // Return generic error for security
      return res.status(UNAUTHORIZED).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    // -----------------------------
    // Token Generation
    // -----------------------------
    // Create JWT with admin ID and expiration
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 24 hours
    );

    // Return successful response with token
    res.json({ token });
  } catch (err) {
    res.status(SERVER_ERROR).json({
      error: "Login failed",
      code: "LOGIN_ERROR",
    });
    // -----------------------------
    // Error Handling
    // -----------------------------

    console.error("Login error:", err);

    res.status(SERVER_ERROR).json({ error: "Server error" });
  }
}

// -----------------------------
// Controller Exports
// -----------------------------
module.exports = {
  login,
};
