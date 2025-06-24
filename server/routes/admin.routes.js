const express = require("express");
const router = express.Router();
const { login } = require("../controller/admin.controller");

// -----------------------------
// Route Configurations
// -----------------------------
/**
 * Admin Authentication Routes
 * Base Path: /api/admin
 */

/**
 * @route POST /api/admin/login
 * @desc Authenticate admin and get token
 * @access Public
 * @body {
 *   email: string,
 *   password: string
 * }
 * @returns {Object} JWT token
 */
router.post("/login", login);

// -----------------------------
// Router Export
// -----------------------------
module.exports = router;
