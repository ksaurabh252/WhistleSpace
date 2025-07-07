const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const {
  UNAUTHORIZED,
  FORBIDDEN,
  SERVER_ERROR,
} = require("../utils/errorCodes");

/**
 * JWT token verification middleware
 * Validates the authorization token and attaches admin data to the request
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
async function verifyToken(req, res, next) {
  try {
    // Ensure JWT secret is set in environment variables
    if (!process.env.JWT_SECRET) {
      return res.status(SERVER_ERROR).json({
        error: "Server Configuration Error",
        code: "AUTH_CONFIG_MISSING",
        message: "JWT secret is not configured",
      });
    }

    // Get the Authorization header from the request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(UNAUTHORIZED).json({
        error: "Unauthorized",
        code: "AUTH_HEADER_MISSING",
        message: "Authorization header is missing",
      });
    }

    // Extract and validate token format (should be "Bearer <token>")
    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      return res.status(UNAUTHORIZED).json({
        error: "Unauthorized",
        code: "INVALID_AUTH_FORMAT",
        message: "Authorization header format should be: Bearer <token>",
      });
    }

    // Verify the JWT token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the admin user from the database using decoded ID
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(FORBIDDEN).json({
        error: "Forbidden",
        code: "ADMIN_NOT_FOUND",
        message: "Admin not found",
      });
    }

    // Attach admin object to the request for downstream middleware/controllers
    req.admin = admin;

    // Continue to next middleware
    next();
  } catch (err) {
    // Set default error response
    let errorCode = "INVALID_TOKEN";
    let message = "Invalid token";
    let statusCode = FORBIDDEN;

    // Customize error message based on JWT error type
    switch (err.name) {
      case "TokenExpiredError":
        errorCode = "TOKEN_EXPIRED";
        message = "Token has expired";
        break;
      case "JsonWebTokenError":
        errorCode = "MALFORMED_TOKEN";
        message = "Invalid token format";
        break;
      case "NotBeforeError":
        errorCode = "TOKEN_NOT_ACTIVE";
        message = "Token not yet valid";
        break;
    }

    // Build error response
    const response = {
      error: "Forbidden",
      code: errorCode,
      message: message,
    };

    // In development mode, include detailed error info
    if (process.env.NODE_ENV === "development") {
      response.details = err.message;
    }

    // Return appropriate error response
    return res.status(statusCode).json(response);
  }
}

async function verifyUserToken(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(SERVER_ERROR).json({
        error: "Server Configuration Error",
        code: "AUTH_CONFIG_MISSING",
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(UNAUTHORIZED).json({
        error: "Unauthorized",
        code: "AUTH_HEADER_MISSING",
      });
    }

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      return res.status(UNAUTHORIZED).json({
        error: "Invalid authorization format",
        code: "INVALID_AUTH_FORMAT",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a user token
    if (decoded.type !== "user") {
      return res.status(FORBIDDEN).json({
        error: "Invalid token type",
        code: "INVALID_TOKEN_TYPE",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(FORBIDDEN).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if user is banned
    if (user.banUntil && user.banUntil > new Date()) {
      return res.status(FORBIDDEN).json({
        error: "Account temporarily banned",
        code: "ACCOUNT_BANNED",
        banUntil: user.banUntil,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(FORBIDDEN).json({
        error: "Account deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    let errorCode = "INVALID_TOKEN";
    let message = "Invalid token";
    let statusCode = FORBIDDEN;

    switch (err.name) {
      case "TokenExpiredError":
        errorCode = "TOKEN_EXPIRED";
        message = "Token has expired";
        break;
      case "JsonWebTokenError":
        errorCode = "MALFORMED_TOKEN";
        message = "Invalid token format";
        break;
    }

    return res.status(statusCode).json({
      error: "Forbidden",
      code: errorCode,
      message: message,
    });
  }
}

/**
 * Middleware to check if the admin user is currently banned
 * Blocks access if `banUntil` is set and in the future
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
async function checkIfBanned(req, res, next) {
  const userId = req.user.id; // Assumes JWT middleware populated req.user

  // Find user by ID
  const user = await Admin.findById(userId);

  // If user is banned (banUntil date in future), block the request
  if (user && user.banUntil && user.banUntil > new Date()) {
    return res
      .status(FORBIDDEN)
      .json({ error: "You are temporarily banned from submitting feedback." });
  }

  // Continue if user is not banned
  next();
}

module.exports = {
  verifyToken,
  checkIfBanned,
  verifyUserToken,
};
