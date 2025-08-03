const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback.model");
const Comment = require("../models/Comment.model");
const auth = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail");
const moderateFeedback = require("../utils/moderateFeedback");

// Create feedback (anonymous)
router.post("/", async (req, res) => {
  try {
    const { text, tags } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // AI Moderation
    const moderation = await moderateFeedback(text);
    if (moderation.flagged) {
      return res
        .status(400)
        .json({ error: "Feedback flagged as inappropriate by AI moderation." });
    }

    const feedback = new Feedback({ text, tags });
    await feedback.save();
    // Send email notification to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New Feedback Submitted",
        text: `New feedback: ${text}\nTags: ${tags ? tags.join(", ") : "None"}`,
        html: `<h3>New Feedback Submitted</h3>
               <p><strong>Text:</strong> ${text}</p>
               <p><strong>Tags:</strong> ${
                 tags ? tags.join(", ") : "None"
               }</p>`,
      });
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
    }
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List all feedback (with optional filters)
router.get("/", async (req, res) => {
  try {
    const { tags, status } = req.query;
    let filter = {};
    if (tags) filter.tags = tags;
    if (status) filter.status = status;
    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get feedback details + comments
router.get("/:id", async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ error: "Feedback not found" });
    const comments = await Comment.find({ feedbackId: feedback._id }).sort({
      createdAt: 1,
    });
    res.json({ feedback, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment to feedback (anonymous)
router.post("/:id/comment", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ error: "Feedback not found" });
    const comment = new Comment({ feedbackId: feedback._id, text });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update feedback status (admin only)
router.patch("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ error: "Feedback not found" });
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete feedback and its comments (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ error: "Feedback not found" });
    await Comment.deleteMany({ feedbackId: req.params.id });
    res.json({ message: "Feedback and its comments deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment (admin only)
router.delete("/:feedbackId/comment/:commentId", auth, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.commentId,
      feedbackId: req.params.feedbackId,
    });
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
