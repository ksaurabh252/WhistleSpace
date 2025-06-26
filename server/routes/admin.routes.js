const express = require("express");
const router = express.Router();

// // Import controller functions for admin authentication
const {
  signup, // Handles admin registration
  login, // Handles admin login (both email/password and Google)
  validate,
  refreshToken,
  getUser, // Validates token for logged-in admin
} = require("../controller/admin.controller");

// // Middleware to verify JWT tokens
const verifyToken = require("../middleware/auth.middleware");
const { body } = require("express-validator");

// // -----------------------------
// // Route Configurations
// // -----------------------------

// /**
//  * Admin Authentication Routes
//  * Base Path: /api/admin
//  * These routes handle admin registration, login, token validation, and Google login.
//  */

// /**
//  * @route   POST /api/admin/google-login
//  * @desc    Authenticate admin using Google credentials (JWT from client)
//  * @access  Public
//  * @body    { credential: string } — Google ID token from client
//  * @returns {Object} JWT token for app use
//  */
router.post("/google-login", login); // Endpoint reused for both standard and Google login

// /**
//  * @route   POST /api/admin/signup
//  * @desc    Register a new admin
//  * @access  Public
//  * @body    {
//  *   email: string,
//  *   password: string
//  * }
//  * @returns {Object} Success status or error
//  */
router.post(
  "/signup",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 8 }),
    // Google token validation if needed
  ],
  signup
);

// /**
//  * @route   POST /api/admin/login
//  * @desc    Login admin with email and password
//  * @access  Public
//  * @body    {
//  *   email: string,
//  *   password: string
//  * }
//  * @returns {Object} JWT token
//  */
router.post("/login", login);

// /**
//  * @route   GET /api/admin/validate
//  * @desc    Validate JWT and return admin info
//  * @access  Protected (requires valid token)
//  */
router.get("/validate", verifyToken, validate);
router.get("/users/:userId", getUser);
// /**
//  * @route   POST /api/admin/refresh-token
//  * @desc    Issue a new JWT using a refresh token (if implemented)
//  * @access  Public or Protected (depends on implementation)
//  * @note    You must define the `refreshToken` handler in your controller
//  */

router.post("/refresh-token", refreshToken);

// // -----------------------------
// // Router Export
// // -----------------------------
// module.exports = router;

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Admin route works!" });
});

// Add your actual routes ONE BY ONE below this
// router.post('/login', login);
// router.post('/signup', signup);
// etc...

module.exports = router;
