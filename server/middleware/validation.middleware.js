const { body, validationResult } = require("express-validator");

// Login validation rules
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

// Feedback submission validation rules
const validateFeedback = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Feedback text is required")
    .isLength({ min: 10 })
    .withMessage("Feedback must be at least 10 characters"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("category")
    .optional()
    .isIn(["Harassment", "Suggestion", "Technical Issue", "Praise", "Other"])
    .withMessage("Invalid category"),

  body("sentiment")
    .optional()
    .isIn(["Positive", "Negative", "Neutral"])
    .withMessage("Invalid sentiment value"),
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  validateLogin,
  validateFeedback,
  handleValidationErrors,
};
