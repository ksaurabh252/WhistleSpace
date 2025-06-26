// ============================================
// 🔧 Environment Setup & Module Imports
// ============================================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

// ============================================
// 🚀 Initialize Express App & HTTP Server
// ============================================
const app = express();
const httpServer = createServer(app);

// ============================================
// ✅ Environment Variable Validation
// ============================================
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ ERROR: ${varName} is not defined`);
    process.exit(1);
  }
});

// ============================================
// 🧱 Global Middleware Stack
// ============================================

// Parse JSON and URL-encoded payloads with limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Set secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "apis.google.com"],
        connectSrc: ["'self'", process.env.FRONTEND_URL],
      },
    },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Enable CORS for frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting to prevent abuse
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per IP
    message: "Too many requests from this IP, please try again later",
  })
);

// ============================================
// 🗄️ Database Connection (MongoDB)
// ============================================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ============================================
// 🔌 Socket.io Configuration
// ============================================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 New client connected");

  socket.on("disconnect", () => {
    console.log("🚫 Client disconnected");
  });
});

// ============================================
// 🛣️ API Routes
// ============================================

// Admin routes
app.use("/api/admin", require("./routes/admin.routes"));

// Uncomment when needed
// app.use('/api/feedback', require('./routes/feedback.routes'));

// ============================================
// ❤️ Health Check Endpoint
// ============================================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Optional simple health check
// app.get("/api/health-check", (req, res) => {
//   res.status(200).json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//   });
// });

// ============================================
// ❗ Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================
// 📡 Server Startup
// ============================================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔒 CORS configured for origin: ${process.env.FRONTEND_URL}`);
});
