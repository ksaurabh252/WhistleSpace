const Feedback = require("../models/Feedback.model");
const { unparse } = require("papaparse"); // CSV generation
const nodemailer = require("nodemailer"); // Email sending
const verifyToken = require("../middleware/auth.middleware");
const { categorize, analyzeSentiment } = require("../utils/ai");

// -----------------------------
// Email Configuration
// -----------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// -----------------------------
// Feedback Controllers
// -----------------------------

/**
 * Delete feedback by ID
 * @route DELETE /api/feedback/:id
 * @access Private
 */
async function deleteFeedback(req, res) {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
}

/**
 * Get feedbacks with filtering and pagination
 * @route GET /api/feedback
 * @access Public
 */
async function getFeedbacks(req, res) {
  // Extract query parameters with defaults
  const {
    search = "",
    page = 1,
    limit = 5,
    sentiment,
    category,
    from,
    to,
  } = req.query;

  // Build MongoDB query object
  const query = {
    ...(search ? { text: { $regex: search, $options: "i" } } : {}),
    ...(sentiment ? { sentiment } : {}),
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(category ? { category } : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { $gte: new Date(from) } : {}),
            ...(to ? { $lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  try {
    // Get total count and paginated results
    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ feedbacks, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving feedbacks" });
  }
}

/**
 * Export feedbacks to CSV
 * @route GET /api/feedback/export
 * @access Private
 */
async function exportFeedbacks(req, res) {
  const { search = "", sentiment, category, from, to } = req.query;

  // Build query object
  const query = {
    ...(search ? { text: { $regex: search, $options: "i" } } : {}),
    ...(sentiment ? { sentiment } : {}),
    ...(category ? { category } : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { $gte: new Date(from) } : {}),
            ...(to ? { $lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  try {
    // Get and format feedback data
    const feedbacks = await Feedback.find(query).sort({ timestamp: -1 });
    const csvData = feedbacks.map((fb) => ({
      Feedback: fb.text,
      Email: fb.email || "Anonymous",
      Sentiment: fb.sentiment || "-",
      Category: fb.category || "-",
      Date: new Date(fb.timestamp).toLocaleDateString(),
    }));

    // Generate and send CSV
    const csv = unparse(csvData);
    res.header("Content-Type", "text/csv");
    res.attachment("feedbacks.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export feedbacks" });
  }
}

/**
 * Submit new feedback
 * @route POST /api/feedback
 * @access Public
 */
async function submitFeedback(req, res) {
  try {
    const feedback = new Feedback(req.body);

    // Auto-categorize if not provided
    if (!feedback.category) {
      feedback.category = await categorize(feedback.text);
    }
    // Auto-analyze sentiment if not provided
    if (!feedback.sentiment) {
      feedback.sentiment = await analyzeSentiment(feedback.text);
    }

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving feedback" });
  }
}

/**
 * Update feedback status
 * @route PATCH /api/feedback/:id
 * @access Private
 */
async function updateFeedbackStatus(req, res) {
  const { status } = req.body;
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Send alert for harassment feedback
    if (feedback.category === "Harassment") {
      await transporter.sendMail({
        from: `"WhistleSpace Alert" <${process.env.ADMIN_EMAIL}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "⚠️ Harassment Feedback Submitted",
        text: `A feedback marked as harassment:\n\n${feedback.text}`,
      });
    }

    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating feedback" });
  }
}

/**
 * Add comment to feedback
 * @route POST /api/feedback/:id/comments
 * @access Public
 */
async function addComment(req, res) {
  const { text, anonymous = true } = req.body;
  try {
    const fb = await Feedback.findById(req.params.id);
    fb.comments.push({ text, anonymous });
    await fb.save();
    res.json({ comments: fb.comments });
  } catch (err) {
    res.status(500).json({ error: "Could not add comment" });
  }
}

// -----------------------------
// Controller Exports
// -----------------------------
module.exports = {
  deleteFeedback,
  getFeedbacks,
  exportFeedbacks,
  submitFeedback,
  updateFeedbackStatus,
  addComment,
};
