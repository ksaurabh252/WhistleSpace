const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const userController = require("../controller/user.controller");
const { verifyUserToken } = require("../middleware/auth.middleware");
const {
  handleValidationErrors,
} = require("../middleware/validation.middleware");

/**
 * Rate limiting configuration for authentication endpoints
 * Prevents brute force attacks by limiting requests:
 * - 5 attempts per 15 minutes for general auth endpoints
 * - 3 attempts per hour for password reset endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: {
    error: "Too many authentication attempts",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per window
  message: {
    error: "Too many password reset attempts",
    code: "RESET_RATE_LIMIT",
  },
});

/**
 * Validation rules for user signup
 * Ensures:
 * - Valid email format
 * - Password meets complexity requirements
 * - Password confirmation matches
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
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

/**
 * Validation rules for user login
 * Ensures:
 * - Valid email format
 * - Password field is not empty
 */
const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * POST /signup - User registration endpoint
 * Protected by:
 * - Rate limiting
 * - Input validation
 */
router.post(
  "/signup",
  authLimiter, // Apply rate limiting
  signupValidation, // Validate request body
  handleValidationErrors, // Handle validation errors
  userController.userSignup // Controller function
);

/**
 * POST /login - User authentication endpoint
 * Protected by:
 * - Rate limiting
 * - Input validation
 */
router.post(
  "/login",
  authLimiter,
  loginValidation,
  handleValidationErrors,
  userController.userLogin
);

/**
 * POST /forgot-password - Password reset request endpoint
 * Protected by:
 * - Stricter rate limiting
 * - Email validation
 */
router.post(
  "/forgot-password",
  resetLimiter,
  [body("email").isEmail().normalizeEmail()],
  handleValidationErrors,
  userController.forgotPassword
);

/**
 * POST /reset-password/:token - Password reset completion endpoint
 * Protected by:
 * - Stricter rate limiting
 * - Password complexity validation
 * - Password confirmation match
 */
router.post(
  "/reset-password/:token",
  resetLimiter,
  [
    body("password").isLength({ min: 8 }),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  handleValidationErrors,
  userController.resetPassword
);

/**
 * GET /profile - User profile retrieval endpoint
 * Protected by:
 * - JWT authentication middleware
 */
router.get(
  "/profile",
  verifyUserToken, // Requires valid JWT token
  userController.getUserProfile
);

module.exports = router;
