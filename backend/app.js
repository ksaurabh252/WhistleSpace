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

// CORS configuration
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

// Rate limiting before routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Now your routes
app.use("/feedback", feedbackRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ message: "WhistleSpace API Running" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = app;
