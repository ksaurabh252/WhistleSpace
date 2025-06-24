const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For JWT generation
const Admin = require("../models/Admin.model");

// -----------------------------
// Authentication Controller
// -----------------------------
// Authenticate admin and generate JWT token
async function login(req, res) {
  // Extract credentials from request
  const { email, password } = req.body;

  try {
    // -----------------------------
    // Admin Verification
    // -----------------------------
    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Return generic error to prevent email enumeration
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // -----------------------------
    // Password Verification
    // -----------------------------
    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      // Return generic error for security
      return res.status(401).json({ error: "Invalid credentials" });
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
    // -----------------------------
    // Error Handling
    // -----------------------------

    console.error("Login error:", err);

    res.status(500).json({ error: "Server error" });
  }
}

// -----------------------------
// Controller Exports
// -----------------------------
module.exports = {
  login,
};
