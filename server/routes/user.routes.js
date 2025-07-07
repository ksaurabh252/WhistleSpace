const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const userController = require("../controller/user.controller");
const { verifyUserToken } = require("../middleware/auth.middleware");
const {
  handleValidationErrors,
} = require("../middleware/validation.middleware");
const User = require("../models/User.model");

// =============================================
// RATE LIMITING CONFIGURATION
// =============================================

/**
 * Rate limiting for authentication endpoints
 * - Prevents brute force attacks
 * - 5 attempts per 15 minutes for general auth
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many authentication attempts",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Stricter rate limiting for password reset
 * - 3 attempts per hour
 */
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many password reset attempts",
    code: "RESET_RATE_LIMIT",
  },
});

// =============================================
// VALIDATION SCHEMAS
// =============================================

/**
 * Signup validation rules:
 * - Valid email format
 * - Password complexity (8+ chars, mixed case, number)
 * - Password confirmation match
 */
const signupValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
];

/**
 * Login validation rules:
 * - Valid email format
 * - Non-empty password
 */
const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// =============================================
// NOTIFICATION ROUTES
// =============================================

/**
 * GET /notifications
 * - Returns all user notifications
 * - Protected by JWT
 */
router.get(
  "/notifications",
  verifyUserToken,
  userController.getUserNotifications
);

/**
 * POST /notifications/mark-read
 * - Marks notifications as read
 * - Accepts array of notification IDs
 * - Protected by JWT
 */
router.post(
  "/notifications/mark-read",
  verifyUserToken,
  [body("notificationIds").optional().isArray()],
  handleValidationErrors,
  userController.markNotificationsRead
);

/**
 * GET /notifications/unread-count
 * - Returns count of unread notifications
 * - Protected by JWT
 */
router.get("/notifications/unread-count", verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const unreadCount = user.notifications.filter((n) => !n.read).length;
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// =============================================
// AUTHENTICATION ROUTES
// =============================================

/**
 * POST /signup
 * - User registration endpoint
 * - Rate limited (5/15min)
 * - Validates email and password requirements
 */
router.post(
  "/signup",
  authLimiter,
  signupValidation,
  handleValidationErrors,
  userController.userSignup
);

/**
 * POST /login
 * - User authentication endpoint
 * - Rate limited (5/15min)
 * - Validates email format and password presence
 */
router.post(
  "/login",
  authLimiter,
  loginValidation,
  handleValidationErrors,
  userController.userLogin
);

/**
 * POST /forgot-password
 * - Password reset request
 * - Stricter rate limit (3/hour)
 * - Validates email format
 */
router.post(
  "/forgot-password",
  resetLimiter,
  [body("email").isEmail().normalizeEmail()],
  handleValidationErrors,
  userController.forgotPassword
);

/**
 * POST /reset-password/:token
 * - Password reset completion
 * - Stricter rate limit (3/hour)
 * - Validates password complexity and match
 */
router.post(
  "/reset-password/:token",
  resetLimiter,
  [
    body("password").isLength({ min: 8 }),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password)
        throw new Error("Passwords do not match");
      return true;
    }),
  ],
  handleValidationErrors,
  userController.resetPassword
);

/**
 * GET /profile
 * - Returns user profile data
 * - Protected by JWT
 */
router.get("/profile", verifyUserToken, userController.getUserProfile);

module.exports = router;
