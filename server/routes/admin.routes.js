const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");

// -------------------------------------
// Import Controllers and Middleware
// -------------------------------------
const adminController = require("../controller/admin.controller");
const authController = require("../controller/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// -------------------------------------
// Debug: Ensure Controllers Are Loaded
// -------------------------------------
console.log("Admin Controller:", Object.keys(adminController));
console.log("Auth Controller:", Object.keys(authController));

// -------------------------------------
// Rate Limiting Middleware
// -------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later",
});

// -------------------------------------
// Public Routes (No Authentication Required)
// -------------------------------------

/**
 * @route   GET /api/admin/test
 * @desc    Health check/test route
 * @access  Public
 */
router.get("/test", (req, res) => {
  res.json({ message: "Admin route works!" });
});

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin via email & password
 * @access  Public (Rate-limited)
 */
router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  adminController.login
);

/**
 * @route   POST /api/admin/google-login
 * @desc    Authenticate admin via Google token
 * @access  Public (Rate-limited)
 */
router.post("/google-login", authLimiter, authController.googleLogin);

/**
 * @route   POST /api/admin/signup
 * @desc    Register a new admin account
 * @access  Public (Rate-limited)
 */
router.post(
  "/signup",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 8 }),
  ],
  adminController.signup
);

// -------------------------------------
// Protected Routes (Require Valid Token)
// -------------------------------------

/**
 * @route   GET /api/admin/validate
 * @desc    Validate access token and return admin info
 * @access  Protected
 */
router.get("/validate", verifyToken, adminController.validate);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get admin user details by ID
 * @access  Protected
 */
router.get("/users/:userId", verifyToken, adminController.getUser);

/**
 * @route   POST /api/admin/refresh-token
 * @desc    Refresh JWT token (if supported)
 * @access  Protected
 */
router.post("/refresh-token", verifyToken, adminController.refreshToken);

// -------------------------------------
// Global Error Handler (Must Be Last)
// -------------------------------------

/**
 * Error-handling middleware for any uncaught exceptions
 */
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

router.get("/users", verifyToken, adminController.getAllUsers);
router.post("/users/:userId/ban", verifyToken, adminController.banUser);
router.post("/users/:userId/unban", verifyToken, adminController.unbanUser);
router.post(
  "/users/:userId/warning",
  verifyToken,
  adminController.issueWarning
);
// -------------------------------------
// Export Router
// -------------------------------------
module.exports = router;
