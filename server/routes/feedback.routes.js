const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const {
  deleteFeedback,
  getFeedbacks,
  exportFeedbacks,
  submitFeedback,
  updateFeedbackStatus,
  addComment,
} = require("../controller/feedback.controller");

/**
 * @route POST /
 * @desc Submit new feedback (public access)
 * @access Public
 * @body {
 *   text: string (required),
 *   email?: string,
 *   category?: string,
 *   sentiment?: string
 * }
 */
router.post("/", submitFeedback);

/**
 * @route GET /
 * @desc Get paginated feedbacks (admin access only)
 * @access Private (Requires JWT token)
 * @query {
 *   search?: string,
 *   page?: number (default: 1),
 *   limit?: number (default: 5),
 *   sentiment?: string,
 *   category?: string,
 *   from?: Date (ISO format),
 *   to?: Date (ISO format),
 *   status?: "pending" | "approved" | "rejected"
 * }
 */
router.get("/", verifyToken, getFeedbacks);

/**
 * @route GET /export
 * @desc Export feedbacks as CSV (admin access only)
 * @access Private (Requires JWT token)
 * @query {
 *   search?: string,
 *   sentiment?: string,
 *   category?: string,
 *   from?: Date (ISO format),
 *   to?: Date (ISO format)
 * }
 */
router.get("/export", verifyToken, exportFeedbacks);

/**
 * @route DELETE /:id
 * @desc Delete feedback by ID (admin access only)
 * @access Private (Requires JWT token)
 * @params {
 *   id: string (MongoDB ObjectId)
 * }
 */
router.delete("/:id", verifyToken, deleteFeedback);

/**
 * @route PATCH /:id/status
 * @desc Update feedback status (admin access only)
 * @access Private (Requires JWT token)
 * @params {
 *   id: string (MongoDB ObjectId)
 * }
 * @body {
 *   status: "pending" | "approved" | "rejected" (required)
 * }
 */
router.patch("/:id/status", verifyToken, updateFeedbackStatus);

/**
 * @route POST /:id/comments
 * @desc Add a comment to feedback (admin access only)
 * @access Private (Requires JWT token)
 * @params {
 *   id: string (MongoDB ObjectId)
 * }
 * @body {
 *   text: string (required),
 *   anonymous?: boolean (default: true)
 * }
 */
router.post("/:id/comments", verifyToken, addComment);

module.exports = router;
