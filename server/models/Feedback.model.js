const mongoose = require("mongoose");

// Feedback Schema Definition
const FeedbackSchema = new mongoose.Schema({
  // Core Feedback Content
  text: {
    type: String,
    required: true,
  },

  // Contact Information
  email: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
  },

  // AI-Generated Classifications
  category: {
    type: String,
  },
  sentiment: {
    type: String,
  },

  // Moderation Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "under_review"], // Added 'under_review' from Code 2
    default: "pending",
  },

  // Associated Comments
  comments: [
    {
      text: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      anonymous: {
        type: Boolean,
        default: true,
      },
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
    },
  ],

  // Admin Actions Tracking
  adminActions: [
    {
      action: {
        type: String,
        enum: [
          "flagged",
          "approved",
          "rejected",
          "warning_issued",
          "user_banned",
        ],
      },
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      notes: String,
    },
  ],
});

// Indexes for better query performance
FeedbackSchema.index({ userId: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ timestamp: -1 });

module.exports = mongoose.model("Feedback", FeedbackSchema);
