const mongoose = require("mongoose");

// -----------------------------
// Feedback Schema Definition
// -----------------------------
const FeedbackSchema = new mongoose.Schema({
  // Core Feedback Content
  text: {
    type: String,
    required: true, 
  },

  // Contact Information
  email: {
    type: String, // Optional email for follow-up
  },

  // Metadata
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set creation time
  },

  // AI-Generated Classifications
  category: {
    type: String, // e.g. "Harassment", "Suggestion", etc.
  },
  sentiment: {
    type: String, // e.g. "Positive", "Negative", "Neutral"
  },

  // Moderation Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending", // Initial state
  },

  // Associated Comments
  comments: [
    {
      text: {
        type: String,
        required: true, // Comment text is mandatory
      },
      timestamp: {
        type: Date,
        default: Date.now, // Automatically set comment time
      },
      anonymous: {
        type: Boolean,
        default: true, // Comments anonymous by default
      },
    },
  ],
});

// -----------------------------
// Model Export
// -----------------------------
module.exports = mongoose.model("Feedback", FeedbackSchema);
