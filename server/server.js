const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Initialize Express and HTTP Server
const app = express();
const httpServer = createServer(app);

// ============================================
// Environment Variables Validation
// ============================================
const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "FRONTEND_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    process.exit(1);
  }
}

// ============================================
// Socket.io Setup
// ============================================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// Socket connection handling
io.on("connection", (socket) => {
  console.log("🔌 Client connected");
  socket.on("disconnect", () => console.log("🚫 Client disconnected"));
});

// ============================================
// Middleware Configuration
// ============================================
// CORS setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);

// ============================================
// Database Connection
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
// API Routes
// ============================================
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/feedback", require("./routes/feedback.routes"));
app.use("/api/test", require("./routes/test.routes"));

// Health check endpoint
app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

// ============================================
// Error Handling
// ============================================
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
  });
});

// ============================================
// Server Startup
// ============================================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS allowed for: ${process.env.FRONTEND_URL}`);
});
