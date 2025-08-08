const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const feedbackRoutes = require("./routes/feedback.routes");
const adminRoutes = require("./routes/admin.routes");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://whistlespace.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(
          new Error("CORS policy: This origin is not allowed: " + origin),
          false
        );
      }
    },
    credentials: true,
  })
);

// Rate limiting configuration - only for production
if (process.env.NODE_ENV === "production") {
  // General rate limiter for all routes
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Stricter rate limiter for feedback submissions
  const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: {
      error:
        "Too many feedback submissions from this IP, please try again later.",
      retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Moderate rate limiter for admin login attempts
  const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
      error: "Too many login attempts from this IP, please try again later.",
      retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  // Apply rate limiters
  app.use(generalLimiter); // Apply to all routes
  app.use("/feedback", feedbackLimiter); // Additional limit for feedback routes
  app.use("/admin/login", adminLoginLimiter); // Additional limit for admin login
} else {
  console.log("Rate limiting disabled in development environment");
}

// Routes
app.use("/feedback", feedbackRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "WhistleSpace API Running",
    environment: process.env.NODE_ENV || "development",
    rateLimiting:
      process.env.NODE_ENV === "production" ? "enabled" : "disabled",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = app;
