const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  text: { type: String, required: true },
  email: { type: String },
  timestamp: { type: Date, default: Date.now },
  category: { type: String },
  sentiment: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
