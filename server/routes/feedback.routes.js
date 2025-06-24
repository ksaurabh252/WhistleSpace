const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");

// -----------------------------
// Controller Imports
// -----------------------------
const {
  deleteFeedback,
  getFeedbacks,
  exportFeedbacks,
  submitFeedback,
  updateFeedbackStatus,
  addComment,
} = require("../controllers/feedback.controller");

// -----------------------------
// Route Definitions
// -----------------------------

/**
 * Feedback Management Routes
 * Base Path: /api/feedback
 */

/**
 * @route DELETE /:id
 * @desc Delete specific feedback
 * @access Private - Requires auth token
 */
router.delete("/:id", verifyToken, deleteFeedback);

/**
 * @route GET /
 * @desc Get all feedbacks with filtering
 * @access Public
 * @query {
 *   search: string,
 *   page: number,
 *   limit: number,
 *   sentiment: string,
 *   category: string,
 *   from: date,
 *   to: date
 * }
 */
router.get("/", getFeedbacks);

/**
 * @route GET /export
 * @desc Export feedbacks to CSV
 * @access Public
 * @query {
 *   search: string,
 *   sentiment: string,
 *   category: string,
 *   from: date,
 *   to: date
 * }
 */
router.get("/export", exportFeedbacks);

/**
 * @route POST /
 * @desc Submit new feedback
 * @access Public
 * @body {
 *   text: string,
 *   email?: string,
 *   category?: string,
 *   sentiment?: string
 * }
 */
router.post("/", submitFeedback);

/**
 * @route PATCH /:id
 * @desc Update feedback status
 * @access Public
 * @body {
 *   status: string
 * }
 */
router.patch("/:id", updateFeedbackStatus);

/**
 * @route PATCH /:id/status
 * @desc Update feedback status (protected)
 * @access Private - Requires auth token
 * @body {
 *   status: string
 * }
 */
router.patch("/:id/status", verifyToken, updateFeedbackStatus);

/**
 * @route POST /:id/comments
 * @desc Add comment to feedback
 * @access Public
 * @body {
 *   text: string,
 *   anonymous?: boolean
 * }
 */
router.post("/:id/comments", addComment);

// -----------------------------
// Router Export
// -----------------------------
module.exports = router;
