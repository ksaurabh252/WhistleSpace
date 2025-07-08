const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");

// -------------------------------------
// Controllers and Middleware
// -------------------------------------
const adminController = require("../controller/admin.controller");
const authController = require("../controller/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// -------------------------------------
// Debugging Controller Load (Optional - remove in production)
// -------------------------------------
console.log("Admin Controller:", Object.keys(adminController));
console.log("Auth Controller:", Object.keys(authController));

// -------------------------------------
// Rate Limiting Setup
// -------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per IP
  message: "Too many requests from this IP, please try again later",
});

// -------------------------------------
// Public Routes (No Authentication Required)
// -------------------------------------

/**
 * @route   GET /api/admin/test
 * @desc    Health check route
 * @access  Public
 */
router.get("/test", (req, res) => {
  res.json({ message: "Admin route works!" });
});

/**
 * @route   POST /api/admin/login
 * @desc    Admin login via email/password
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
 * @desc    Login using Google OAuth token
 * @access  Public (Rate-limited)
 */
router.post("/google-login", authLimiter, authController.googleLogin);

/**
 * @route   POST /api/admin/signup
 * @desc    Register new admin account
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
// Protected Routes (Require Authentication)
// -------------------------------------

/**
 * @route   GET /api/admin/validate
 * @desc    Validate JWT and return admin info
 * @access  Protected
 */
router.get("/validate", verifyToken, adminController.validate);

/**
 * @route   POST /api/admin/refresh-token
 * @desc    Refresh access token (if supported)
 * @access  Protected
 */
router.post("/refresh-token", verifyToken, adminController.refreshToken);

// -------------------------------------
// User Management
// -------------------------------------

/**
 * @route   GET /api/admin/users
 * @desc    Get list of all users
 * @access  Protected
 */
router.get("/users", verifyToken, adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get specific user details by ID
 * @access  Protected
 */
router.get("/users/:userId", verifyToken, adminController.getUser);

/**
 * @route   POST /api/admin/users/:userId/ban
 * @desc    Ban a specific user
 * @access  Protected
 */
router.post("/users/:userId/ban", verifyToken, adminController.banUser);

/**
 * @route   POST /api/admin/users/:userId/unban
 * @desc    Unban a specific user
 * @access  Protected
 */
router.post("/users/:userId/unban", verifyToken, adminController.unbanUser);

/**
 * @route   POST /api/admin/users/:userId/warning
 * @desc    Issue a warning to a user
 * @access  Protected
 */
router.post(
  "/users/:userId/warning",
  verifyToken,
  adminController.issueWarning
);

/**
 * @route   POST /api/admin/users/bulk-action
 * @desc    Perform a bulk action on multiple users
 * @access  Protected
 */
router.post("/users/bulk-action", verifyToken, adminController.bulkUserAction);

// -------------------------------------
// Flagged Users
// -------------------------------------

/**
 * @route   GET /api/admin/users/flagged
 * @desc    Get list of flagged users
 * @access  Protected
 */
router.get("/users/flagged", verifyToken, adminController.getFlaggedUsers);

/**
 * @route   GET /api/admin/users/:userId/flags
 * @desc    Get flag history for a specific user
 * @access  Protected
 */
router.get(
  "/users/:userId/flags",
  verifyToken,
  adminController.getUserFlagHistory
);

// -------------------------------------
// Admin Activity Logs
// -------------------------------------

/**
 * @route   GET /api/admin/activity-log
 * @desc    Get logs of admin moderation actions
 * @access  Protected
 */
router.get("/activity-log", verifyToken, adminController.getAdminActivityLog);

// -------------------------------------
// Security Overview Dashboard
// -------------------------------------

/**
 * @route   GET /api/admin/security-overview
 * @desc    Get system-level security metrics
 * @access  Protected
 */
router.get("/security-overview", verifyToken, async (req, res) => {
  try {
    const [totalUsers, flaggedUsers, bannedUsers, recentActivity] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ warnings: { $gte: 1 } }),
        User.countDocuments({ banUntil: { $gt: new Date() } }),
        Feedback.countDocuments({
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
      ]);

    res.json({
      overview: {
        totalUsers,
        flaggedUsers,
        bannedUsers,
        recentActivity,
        flaggedPercentage: ((flaggedUsers / totalUsers) * 100).toFixed(1),
        systemHealth: calculateSystemHealth(flaggedUsers, totalUsers),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch security overview" });
  }
});

/**
 * Calculate system health based on flagged user ratio.
 *
 * @param {number} flagged - Number of flagged users
 * @param {number} total - Total users in the system
 * @returns {string} - System health status
 */
function calculateSystemHealth(flagged, total) {
  const ratio = flagged / total;
  if (ratio > 0.15) return "CRITICAL";
  if (ratio > 0.08) return "WARNING";
  if (ratio > 0.03) return "MODERATE";
  return "HEALTHY";
}

// -------------------------------------
// Global Error Handler
// -------------------------------------

/**
 * Global error handler for unhandled exceptions.
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// -------------------------------------
// Export Router
// -------------------------------------
module.exports = router;
