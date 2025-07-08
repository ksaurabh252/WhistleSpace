// Models and libraries
const Feedback = require("../models/Feedback.model");
const Admin = require("../models/Admin.model");
const nodemailer = require("nodemailer");
const { unparse } = require("papaparse");

// AI utilities for sentiment and category analysis
const { categorize, analyzeSentiment } = require("../utils/ai");

// Redis client for caching
const client = require("../utils/redis.client");

// Constants for HTTP error codes
const { BAD_REQUEST, SERVER_ERROR, NOT_FOUND } = require("../utils/errorCodes");

// Middleware functions for validation
const {
  validateFeedback,
  handleValidationErrors,
} = require("../middleware/validation.middleware");

// Setup nodemailer transporter for email alerts
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// Configuration constants
const CACHE_TTL = 3600; // 1 hour
const BAN_DURATION_HOURS = 24;
const WARNING_THRESHOLD = 3;

/**
 * Builds MongoDB query object based on optional filters
 * @param {Object} filters - Filtering options from query params
 * @returns {Object} MongoDB query
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

/**
 * Gets sentiment and category of feedback using cache or AI
 * @param {string} text - Feedback text
 * @returns {Promise<{category: string, sentiment: string}>}
 */
async function getAnalysisResults(text) {
  // Attempt to retrieve cached AI analysis results from Redis
  const [cachedCategory, cachedSentiment] = await Promise.all([
    new Promise((resolve) =>
      client.get(`feedback_category:${text}`, (err, result) =>
        resolve(err ? null : result)
      )
    ),
    new Promise((resolve) =>
      client.get(`feedback_sentiment:${text}`, (err, result) =>
        resolve(err ? null : result)
      )
    ),
  ]);

  let category = cachedCategory;
  let sentiment = cachedSentiment;

  // If no cache hit, analyze and store in cache
  if (!cachedCategory) {
    category = await categorize(text);
    client.setex(`feedback_category:${text}`, CACHE_TTL, category);
  }

  if (!cachedSentiment) {
    sentiment = await analyzeSentiment(text);
    client.setex(`feedback_sentiment:${text}`, CACHE_TTL, sentiment);
  }

  return { category, sentiment };
}

/**
 * Issues a warning or ban to a user based on harassment feedback
 * @param {string} userId - ID of the user
 * @param {string} feedbackText - The text that triggered the warning
 * @returns {Promise<Object>} Warning/ban status
 */
async function handleHarassmentWarning(userId, feedbackText) {
  try {
    const user = await Admin.findById(userId);
    if (!user) return { error: "User not found" };

    if (user.banUntil && user.banUntil > new Date()) {
      return { error: "User is temporarily banned" };
    }

    user.warnings += 1;
    let actionTaken = `Warning ${user.warnings}/${WARNING_THRESHOLD}`;

    if (user.warnings >= WARNING_THRESHOLD) {
      // Ban user and reset warnings
      user.banUntil = new Date();
      user.banUntil.setHours(user.banUntil.getHours() + BAN_DURATION_HOURS);
      const originalWarnings = user.warnings;
      user.warnings = 0;
      actionTaken = `Banned for ${BAN_DURATION_HOURS} hours`;
      console.log(`User ${user.username} banned until ${user.banUntil}`);
      await user.save();

      return {
        success: true,
        banUntil: user.banUntil,
        actionTaken,
        warningCount: originalWarnings,
      };
    }

    await user.save();
    return {
      success: true,
      warningCount: user.warnings,
      actionTaken,
    };
  } catch (error) {
    console.error("Harassment warning error:", error);
    return { error: "Failed to process harassment warning" };
  }
}

/**
 * Sends an email alert to admin if harassment content is detected
 * @param {Object} feedback - Feedback object
 * @param {Object|null} user - User object or null
 */
async function sendHarassmentAlert(feedback, user) {
  try {
    await transporter.sendMail({
      from: `"WhistleSpace Alert" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "⚠️ Harassment Feedback Detected",
      html: `
        <h2>Harassment Content Alert</h2>
        <p><strong>User:</strong> ${user ? user.systemId : "Anonymous"}</p>
        <p><strong>Category:</strong> ${feedback.category}</p>
        <p><strong>Sentiment:</strong> ${feedback.sentiment}</p>
        <p><strong>Timestamp:</strong> ${feedback.timestamp}</p>
        <h3>Content:</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
          ${feedback.text}
        </div>
        <p><a href="${
          process.env.FRONTEND_URL
        }/admin">Review in Admin Dashboard</a></p>
      `,
    });
  } catch (error) {
    console.error("Failed to send harassment alert:", error);
  }
}

/**
 * Constructs a consistent response object for feedback submission
 * @param {Object} feedback - Feedback document
 * @param {Object|null} warningResult - Result from warning handler
 * @returns {Object} Final API response
 */
function createFeedbackResponse(feedback, warningResult = null) {
  const baseResponse = {
    success: true,
    feedback,
    message: "Feedback submitted successfully",
  };

  if (!warningResult) return baseResponse;

  if (warningResult.error) {
    return { error: warningResult.error };
  }

  if (warningResult.banUntil) {
    return {
      ...baseResponse,
      warning: {
        message:
          "Feedback submitted, but account temporarily suspended due to policy violations.",
        actionTaken: warningResult.actionTaken,
        banUntil: warningResult.banUntil,
      },
    };
  }

  return {
    ...baseResponse,
    warning: {
      message:
        "Feedback submitted with policy warning. Please review community guidelines.",
      warningCount: warningResult.warningCount,
      actionTaken: warningResult.actionTaken,
    },
  };
}

/**
 * Handles feedback submission with validation, AI analysis, warning/ban, and alert
 */
async function submitFeedbackHandler(req, res) {
  try {
    const { text, email } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!text) {
      return res.status(BAD_REQUEST).json({
        error: "Feedback text required",
        code: "MISSING_TEXT",
      });
    }

    const { category, sentiment } = await getAnalysisResults(text);

    const feedbackData = {
      text,
      email,
      category,
      sentiment,
      userId,
      timestamp: new Date(),
    };

    const feedback = await new Feedback(feedbackData).save();

    let warningResult = null;
    if (userId && category === "Harassment") {
      console.log(`🚨 Harassment detected for user ${req.user.systemId}`);
      warningResult = await handleHarassmentWarning(userId, text);
      if (warningResult.error) {
        return res.status(400).json({ error: warningResult.error });
      }
    }

    if (category === "Harassment") {
      await sendHarassmentAlert(feedback, req.user);
    }

    const response = createFeedbackResponse(feedback, warningResult);
    res.status(201).json(response);
  } catch (err) {
    console.error("Feedback submission error:", err);
    res.status(SERVER_ERROR).json({
      error: "Feedback submission failed",
      code: "SUBMISSION_ERROR",
    });
  }
}

/**
 * Retrieves paginated feedbacks with optional filters
 */
async function getFeedbacks(req, res) {
  try {
    const { page = 1, limit = 5, ...filters } = req.query;
    const query = buildQuery(filters);

    const [total, feedbacks] = await Promise.all([
      Feedback.countDocuments(query),
      Feedback.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
    ]);

    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(SERVER_ERROR).json({ error: "Error retrieving feedbacks" });
  }
}

/**
 * Deletes a feedback entry by ID
 */
async function deleteFeedback(req, res) {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(NOT_FOUND).json({ error: "Feedback not found" });
    }
    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(SERVER_ERROR).json({ error: "Delete failed" });
  }
}

/**
 * Updates the status of a feedback (e.g., from pending to reviewed)
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

    if (feedback.category === "Harassment" && status === "reviewed") {
      await sendHarassmentAlert(feedback, null);
    }

    res.json({
      success: true,
      feedback,
      message: "Status updated successfully",
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(SERVER_ERROR).json({ error: "Error updating feedback" });
  }
}

/**
 * Exports feedbacks as a CSV file based on filters
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
      Status: fb.status || "pending",
      Date: new Date(fb.timestamp).toLocaleDateString(),
      Time: new Date(fb.timestamp).toLocaleTimeString(),
    }));

    const csv = unparse(csvData);
    res.header("Content-Type", "text/csv");
    res.attachment(`feedbacks_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(SERVER_ERROR).json({ error: "Failed to export feedbacks" });
  }
}

/**
 * Adds a comment to a specific feedback
 */
async function addComment(req, res) {
  try {
    const { text, anonymous = true } = req.body;

    if (!text) {
      return res.status(BAD_REQUEST).json({ error: "Comment text required" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(NOT_FOUND).json({ error: "Feedback not found" });
    }

    const comment = {
      text,
      anonymous,
      timestamp: new Date(),
    };

    feedback.comments.push(comment);
    await feedback.save();

    res.json({
      success: true,
      comments: feedback.comments,
      message: "Comment added successfully",
    });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(SERVER_ERROR).json({ error: "Could not add comment" });
  }
}

// Export route handlers
module.exports = {
  submitFeedback: [
    validateFeedback,
    handleValidationErrors,
    submitFeedbackHandler,
  ],
  getFeedbacks,
  deleteFeedback,
  updateFeedbackStatus,
  exportFeedbacks,
  addComment,
};
