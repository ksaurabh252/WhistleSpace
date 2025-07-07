const Feedback = require("../models/Feedback.model");
const { categorize, analyzeSentiment } = require("../utils/ai"); // AI utilities
const { unparse } = require("papaparse"); // CSV export
const nodemailer = require("nodemailer"); // Email sending utility
const { BAD_REQUEST, SERVER_ERROR, NOT_FOUND } = require("../utils/errorCodes");
const {
  validateFeedback,
  handleValidationErrors,
} = require("../middleware/validation.middleware");

const client = require("../utils/redis.client");
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
 * Used for filtering feedbacks based on search, sentiment, category, etc.
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

  const { userId, text } = req.body;
  try {
    // Check for harassment and handle warnings or bans accordingly
    const harassmentResult = await handleHarassmentWarning(userId, text);

    if (harassmentResult.error) {
      return res.status(400).json({ error: harassmentResult.error });
    }

    // Check if the categorization and sentiment are cached in Redis

    const cachedCategory = await new Promise((resolve, reject) => {
      client.get(`feedback_category:${text}`, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    const cachedSentiment = await new Promise((resolve, reject) => {
      client.get(`feedback_sentiment:${text}`, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    let category = cachedCategory;
    let sentiment = cachedSentiment;
    // If no cache, categorize and analyze sentiment, then cache the result
    if (!category || !sentiment) {
      category = await categorize(text);
      sentiment = await analyzeSentiment(text);

      // Cache the results for future requests
      client.setex(`feedback_category:${text}`, 3600, category); // Cache for 1 hour (3600 seconds)
      client.setex(`feedback_sentiment:${text}`, 3600, sentiment); // Cache for 1 hour (3600 seconds)
    }

    // Prepare feedback data with category and sentiment
    const data = { ...req.body, category, sentiment };

    // Use AI to auto-categorize and analyze sentiment if not already provided
    data.category ||= await categorize(data.text);
    data.sentiment ||= await analyzeSentiment(data.text);

    // Save feedback to the database
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
      .sort({ timestamp: -1 }) // Sort by most recent
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(); // Convert to plain JS objects

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

    // If feedback is harassment, notify admin by email
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

    // Map feedbacks to CSV format
    const csvData = feedbacks.map((fb) => ({
      Feedback: fb.text,
      Email: fb.email || "Anonymous",
      Sentiment: fb.sentiment || "-",
      Category: fb.category || "-",
      Date: new Date(fb.timestamp).toLocaleDateString(),
    }));

    // Convert to CSV string
    const csv = unparse(csvData);

    // Send CSV file as attachment
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

    // Push new comment to feedback comments array
    feedback.comments.push({ text, anonymous });
    await feedback.save();

    res.json({ comments: feedback.comments });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(SERVER_ERROR).json({ error: "Could not add comment" });
  }
}

/**
 * Handle harassment warning and user banning logic
 * @param {string} userId - ID of the user submitting the feedback
 * @param {string} feedbackText - The feedback text to analyze
 * @returns {object} Result object with success or error
 */
async function handleHarassmentWarning(userId, feedbackText) {
  // Categorize the feedback using AI
  const category = await categorize(feedbackText);

  if (category === "Harassment") {
    const user = await Admin.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    // Block feedback submission if user is already banned
    if (user.banUntil && user.banUntil > new Date()) {
      return { error: "User is temporarily banned" };
    }

    // Increment warning count
    user.warnings += 1;

    // Ban user for 24 hours if 3 warnings are reached
    if (user.warnings >= 3) {
      user.banUntil = new Date();
      user.banUntil.setHours(user.banUntil.getHours() + 24);
      user.warnings = 0; // Reset warnings after banning
    }

    // Save updated user state
    await user.save();

    // Log banning action (optional notification or alert)
    if (user.warnings === 0) {
      console.log(
        `User ${user.username} has been banned until ${user.banUntil}`
      );
    }

    return { success: true, message: "Harassment warning issued" };
  }

  // Return if feedback is not harassment
  return { success: true, message: "Feedback is not harassment" };
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
