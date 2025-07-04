const Feedback = require("../models/Feedback.model");
const { categorize, analyzeSentiment } = require("../utils/ai");
const { unparse } = require("papaparse"); // CSV export
const nodemailer = require("nodemailer"); // Email sending
const { BAD_REQUEST, SERVER_ERROR, NOT_FOUND } = require("../utils/errorCodes");
const {
  validateFeedback,
  handleValidationErrors,
} = require("../middleware/validation.middleware");

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
// Helper: Query Builder
// -----------------------------
/**
 * Builds a MongoDB query object from filter parameters
 */
function buildQuery({ search = "", sentiment, category, from, to, status }) {
  return {
    ...(search && { text: { $regex: search, $options: "i" } }),
    ...(sentiment && { sentiment }),
    ...(category && { category }),
    ...(status && { status }),
    ...(from || to
      ? {
          timestamp: {
            ...(from && { $gte: new Date(from) }),
            ...(to && { $lte: new Date(to) }),
          },
        }
      : {}),
  };
}

// -----------------------------
// Controllers
// -----------------------------

/**
 * Submit new feedback
 * @route POST /api/feedback
 * @access Public
 */
async function submitFeedbackHandler(req, res) {
  if (!req.body.text) {
    return res.status(BAD_REQUEST).json({
      error: "Feedback text required",
      code: "MISSING_TEXT",
    });
  }

  try {
    const data = req.body;

    data.category ||= await categorize(data.text);
    data.sentiment ||= await analyzeSentiment(data.text);

    const feedback = await new Feedback(data).save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(SERVER_ERROR).json({
      error: "Feedback submission failed",
      message: "Error saving feedback",
    });
  }
}

/**
 * Get feedbacks with filtering and pagination
 * @route GET /api/feedback
 * @access Public
 */
async function getFeedbacks(req, res) {
  try {
    const { page = 1, limit = 5, ...filters } = req.query;
    const query = buildQuery(filters);

    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ feedbacks, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(SERVER_ERROR).json({ error: "Error retrieving feedbacks" });
  }
}

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
    console.error("Delete error:", err);
    res.status(SERVER_ERROR).json({ error: "Delete failed" });
  }
}

/**
 * Update feedback status and send alert for harassment
 * @route PATCH /api/feedback/:id
 * @access Private
 */
async function updateFeedbackStatus(req, res) {
  try {
    const { status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(NOT_FOUND).json({ error: "Feedback not found" });
    }

    // Send alert if feedback is marked as harassment
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
    console.error("Status update error:", err);
    res.status(SERVER_ERROR).json({ error: "Error updating feedback" });
  }
}

/**
 * Export feedbacks as CSV file
 * @route GET /api/feedback/export
 * @access Private
 */
async function exportFeedbacks(req, res) {
  try {
    const query = buildQuery(req.query);
    const feedbacks = await Feedback.find(query).sort({ timestamp: -1 }).lean();

    const csvData = feedbacks.map((fb) => ({
      Feedback: fb.text,
      Email: fb.email || "Anonymous",
      Sentiment: fb.sentiment || "-",
      Category: fb.category || "-",
      Date: new Date(fb.timestamp).toLocaleDateString(),
    }));

    const csv = unparse(csvData);
    res.header("Content-Type", "text/csv");
    res.attachment("feedbacks.csv");
    res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(SERVER_ERROR).json({ error: "Failed to export feedbacks" });
  }
}

/**
 * Add a comment to feedback
 * @route POST /api/feedback/:id/comments
 * @access Public
 */
async function addComment(req, res) {
  try {
    const { text, anonymous = true } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(NOT_FOUND).json({ error: "Feedback not found" });
    }

    feedback.comments.push({ text, anonymous });
    await feedback.save();

    res.json({ comments: feedback.comments });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(SERVER_ERROR).json({ error: "Could not add comment" });
  }
}

// -----------------------------
// Module Exports
// -----------------------------
module.exports = {
  submitFeedback: [
    validateFeedback,
    handleValidationErrors,
    submitFeedbackHandler,
  ],
  getFeedbacks,
  deleteFeedback,
  exportFeedbacks,
  updateFeedbackStatus,
  addComment,
};
