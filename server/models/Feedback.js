const mongoose = require("mongoose");
const verifyToken = require("../middleware/auth");

const FeedbackSchema = new mongoose.Schema({
  text: { type: String, required: true },
  email: { type: String },
  timestamp: { type: Date, default: Date.now },
  category: { type: String },
  sentiment: { type: String },
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
