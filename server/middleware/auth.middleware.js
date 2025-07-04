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
    // Check if JWT secret is configured in environment variables
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

    // Expecting the format: "Bearer <token>"
    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      return res.status(UNAUTHORIZED).json({
        error: "Unauthorized",
        code: "INVALID_AUTH_FORMAT",
        message: "Authorization header format should be: Bearer <token>",
      });
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the admin user by decoded ID
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(FORBIDDEN).json({
        error: "Forbidden",
        code: "ADMIN_NOT_FOUND",
        message: "Admin not found",
      });
    }

    // Attach admin data to the request object for downstream use
    req.admin = admin;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // Default error response values
    let errorCode = "INVALID_TOKEN";
    let message = "Invalid token";
    let statusCode = FORBIDDEN;

    // Handle specific JWT error types
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

    // Construct error response
    const response = {
      error: "Forbidden",
      code: errorCode,
      message: message,
    };

    // Include error details only in development mode
    if (process.env.NODE_ENV === "development") {
      response.details = err.message;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = verifyToken;
