// -----------------------------
// Dependencies
// -----------------------------
const Feedback = require("../models/Feedback.model");
const Admin = require("../models/Admin.model"); // Missing import for harassment handler
const nodemailer = require("nodemailer");
const { unparse } = require("papaparse");

// Utils
const { categorize, analyzeSentiment } = require("../utils/ai");
const client = require("../utils/redis.client");
const { BAD_REQUEST, SERVER_ERROR, NOT_FOUND } = require("../utils/errorCodes");

// Middleware
const {
  validateFeedback,
  handleValidationErrors,
} = require("../middleware/validation.middleware");

// -----------------------------
// Configuration
// -----------------------------
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

const CACHE_TTL = 3600; // 1 hour
const BAN_DURATION_HOURS = 24;
const WARNING_THRESHOLD = 3;

// -----------------------------
// Helper Functions
// -----------------------------

/**
 * Builds MongoDB query from filter parameters
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
 * Get analysis results from cache or perform new analysis
 */
async function getAnalysisResults(text) {
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
 * Handle harassment warning and user banning logic
 */
async function handleHarassmentWarning(userId, feedbackText) {
  try {
    const user = await Admin.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    // Check if user is already banned
    if (user.banUntil && user.banUntil > new Date()) {
      return { error: "User is temporarily banned" };
    }

    // Increment warning count
    user.warnings += 1;
    let actionTaken = `Warning ${user.warnings}/${WARNING_THRESHOLD}`;

    // Ban user if threshold reached
    if (user.warnings >= WARNING_THRESHOLD) {
      user.banUntil = new Date();
      user.banUntil.setHours(user.banUntil.getHours() + BAN_DURATION_HOURS);
      const originalWarnings = user.warnings;
      user.warnings = 0; // Reset warnings after banning
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
 * Send harassment alert email to admin
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
 * Create feedback response based on harassment detection
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

// -----------------------------
// Controllers
// -----------------------------

/**
 * Submit new feedback
 * @route POST /api/feedback
 * @access Public (with optional authentication)
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

    // Get AI analysis results (with caching)
    const { category, sentiment } = await getAnalysisResults(text);

    // Create feedback
    const feedbackData = {
      text,
      email,
      category,
      sentiment,
      userId,
      timestamp: new Date(),
    };

    const feedback = await new Feedback(feedbackData).save();

    // Handle harassment for authenticated users
    let warningResult = null;
    if (userId && category === "Harassment") {
      console.log(`🚨 Harassment detected for user ${req.user.systemId}`);
      warningResult = await handleHarassmentWarning(userId, text);

      if (warningResult.error) {
        return res.status(400).json({ error: warningResult.error });
      }
    }

    // Send admin alert for harassment (both authenticated and anonymous)
    if (category === "Harassment") {
      await sendHarassmentAlert(feedback, req.user);
    }

    // Send appropriate response
    const response = createFeedbackResponse(feedback, warningResult);
    const statusCode = warningResult?.banUntil ? 201 : 201;

    res.status(statusCode).json(response);
  } catch (err) {
    console.error("Feedback submission error:", err);
    res.status(SERVER_ERROR).json({
      error: "Feedback submission failed",
      code: "SUBMISSION_ERROR",
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
 * Delete feedback by ID
 * @route DELETE /api/feedback/:id
 * @access Private
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
 * Update feedback status
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

    // Send harassment alert if status update reveals harassment
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
 * Export feedbacks as CSV
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
 * Add comment to feedback
 * @route POST /api/feedback/:id/comments
 * @access Public
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
  updateFeedbackStatus,
  exportFeedbacks,
  addComment,
};
