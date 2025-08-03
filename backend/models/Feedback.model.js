const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  text: { type: String, required: true },
  tags: [{ type: String }],
  status: { type: String, default: "open" }, // open, resolved, etc.
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
