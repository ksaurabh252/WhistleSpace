const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const feedbackRoutes = require("./routes/feedback.routes");
const adminRoutes = require("./routes/admin.routes");

// Create the Express application
const app = express();

// CORS (allow credentials + selected origins)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:3000",
  "https://whistlespace.vercel.app",
];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Cookies + JSON
app.use(cookieParser());

app.use(express.json());

// Correct client IPs behind proxy/CDN
// Enables Express to trust the X-Forwarded-For header from a proxy (like Vercel)
app.set("trust proxy", 1);

// Rate limiting (production)
// Apply rate limiting in production to prevent abuse
if (process.env.NODE_ENV === "production") {
  // Global rate limiter for all endpoints
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // max 1000 requests per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });

  // Specific rate limiter for the admin login route
  const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 failed login attempts per 15 minutes
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Specific rate limiter for the feedback submission endpoint
  const feedbackPostLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // max 50 feedback posts per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply the global rate limiter to all routes
  app.use(globalLimiter);

  app.use("/admin/login", adminLoginLimiter);

  app.use("/feedback", (req, res, next) =>
    req.method === "POST" ? feedbackPostLimiter(req, res, next) : next()
  );
}

// Routes
// Use the feedback router for all requests to /feedback
app.use("/feedback", feedbackRoutes);
// Use the admin router for all requests to /admin
app.use("/admin", adminRoutes);

// Health
// A basic health check endpoint for the application
app.get("/", (req, res) => {
  res.json({
    message: "WhistleSpace API Running",
    environment: process.env.NODE_ENV || "development",
    rateLimiting:
      process.env.NODE_ENV === "production" ? "enabled" : "disabled",
  });
});

// Error handler
// Custom error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Export the app instance for use in other files (e.g., server.js)
module.exports = app;
