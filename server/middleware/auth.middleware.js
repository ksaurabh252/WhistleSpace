const jwt = require("jsonwebtoken");
const {
  UNAUTHORIZED,
  FORBIDDEN,
  SERVER_ERROR,
} = require("../utils/errorCodes");

/**
 * Middleware to verify a JSON Web Token (JWT) from the request header.
 * This function checks for the presence and validity of a JWT,
 * and if valid, decodes it and attaches the payload to the request object.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function in the stack.
 */
function verifyToken(req, res, next) {
  try {
    // 1. Check if JWT_SECRET is configured in environment variables.

    if (!process.env.JWT_SECRET) {
      // If the secret is not configured, throw an error to prevent further execution.
      return res.status(SERVER_ERROR).json({
        error: "Server Configuration Error",
        code: "AUTH_CONFIG_MISSING",
        message: "JWT secret is not configured",
      });
    }

    // 2. Get the authorization header from the incoming request.
    // The token is typically sent in the 'Authorization' header.
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // If no authorization header is present, return a 401 Unauthorized response.
      return res.status(UNAUTHORIZED).json({
        error: "Unauthorized",
        message: "Authorization header is missing",
        code: "AUTH_HEADER_MISSING", // Custom error code for clarity.
      });
    }

    // 3. Split the authorization header to extract the token.
    // The expected format is "Bearer <token>".
    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      // If the header format is incorrect, return a 401 Unauthorized response.
      return res.status(UNAUTHORIZED).json({
        error: "Unauthorized",
        message: "Authorization header format should be: Bearer <token>",
        code: "INVALID_AUTH_FORMAT", // Custom error code for clarity.
      });
    }

    // 4. Verify the extracted token using the JWT_SECRET.
    try {
      // jwt.verify() decodes the token and checks its signature and expiration.
      // If valid, it returns the decoded payload.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Attach the decoded token payload to the request object.
      req.admin = decoded;
      // Call the next middleware allowing the request to proceed.
      next();
    } catch (err) {
      let errorCode = "INVALID_TOKEN";
      let message = "Invalid token";
      let statusCode = FORBIDDEN;

      // Differentiate error messages and codes based on the type of JWT error.
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

      const response = {
        error: "Forbidden",
        code: errorCode,
        message: message,
      };

      // Include error details in development
      if (process.env.NODE_ENV === "development") {
        response.details = err.message;
      }

      return res.status(statusCode).json(response);
    }
  } catch (error) {
    // Catch any unexpected errors that occur during the middleware execution (e.g., JWT_SECRET not configured).
    console.error("Authentication error:", error);

    const response = {
      error: "Authentication Error",
      code: "AUTH_SERVER_ERROR",
      message: "An unexpected error occurred",
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === "development") {
      response.details = error.message;
      response.stack = error.stack;
    }

    return res.status(SERVER_ERROR).json(response);
  }
}

module.exports = verifyToken;
