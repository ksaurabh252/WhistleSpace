const jwt = require("jsonwebtoken");

// Middleware function to verify JWT token from the request header
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({
      error: "Unauthorized",
    });

  try {
    // Verify the token using JWT_SECRET from environment variablesa
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: "Invalid token",
    });
  }
}

module.exports = verifyToken;
