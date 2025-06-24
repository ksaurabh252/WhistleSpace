const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// -----------------------------
// Environment Validation
// -----------------------------
// Ensure MONGO_URI is available before starting
if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI is not defined in environment variables");
  console.error("Please check your .env file");
  process.exit(1);
}

const feedbackRoutes = require("./routes/feedback.routes");
const adminRoutes = require("./routes/admin.routes");

// -----------------------------
// Express App Configuration
// -----------------------------
const app = express();

// Middleware Setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// -----------------------------
// Database Connection
// -----------------------------
// Connect to MongoDB with enhanced options
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true, // Use new URL parser
    useUnifiedTopology: true, // Use new Server Discover and Monitoring engine
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// -----------------------------
// API Routes
// -----------------------------
// Feedback endpoints: /api/feedback/*
app.use("/api/feedback", feedbackRoutes);

// Admin endpoints: /api/admin/*
app.use("/api/admin", adminRoutes);

// -----------------------------
// Server Initialization
// -----------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
