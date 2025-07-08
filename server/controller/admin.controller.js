const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const { OAuth2Client } = require("google-auth-library");
const {
  UNAUTHORIZED,
  SERVER_ERROR,
  FORBIDDEN,
  BAD_REQUEST,
} = require("../utils/errorCodes");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔐 Utility: Generate JWT token
const generateToken = (admin) =>
  jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

/**
 * Sends JWT token along with admin user info
 *
 * @param {Object} admin - Admin mongoose document
 * @param {Object} res - Express response object
 */
const sendToken = (admin, res) => {
  const token = generateToken(admin);
  res.json({
    token,
    user: {
      id: admin._id,
      email: admin.email,
      isGoogleAuth: admin.isGoogleAuth,
      name: admin.name,
      avatar: admin.avatar,
    },
  });
};

// 🧑‍💼 Signup
/**
 * Handles admin signup (supports both traditional and Google OAuth)
 */
async function signup(req, res) {
  try {
    const { email, password, googleToken } = req.body;

    if (!email) {
      return res.status(BAD_REQUEST).json({
        error: "Email is required",
        code: "MISSING_EMAIL",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(BAD_REQUEST).json({
        error: "Email already in use",
        code: "EMAIL_IN_USE",
      });
    }

    let admin;
    if (googleToken) {
      // Google OAuth signup flow
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const { sub, name, picture } = ticket.getPayload();

      admin = await Admin.create({
        email,
        googleId: sub,
        name,
        avatar: picture,
        isGoogleAuth: true,
      });
    } else {
      // Traditional email/password signup
      if (!password) {
        return res.status(BAD_REQUEST).json({
          error: "Password is required",
          code: "MISSING_PASSWORD",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      admin = await Admin.create({
        email,
        password: hashedPassword,
        isGoogleAuth: false,
      });
    }

    sendToken(admin, res);
  } catch (err) {
    console.error("Signup error:", err);
    res.status(SERVER_ERROR).json({
      error: "Signup failed",
      code: "SIGNUP_ERROR",
    });
  }
}

// 🔐 Login
/**
 * Handles admin login (supports both traditional and Google OAuth)
 */
async function login(req, res) {
  try {
    const { email, password, token: googleToken } = req.body;

    if (googleToken) {
      // Google OAuth login flow
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const { email: googleEmail, name, picture, sub } = ticket.getPayload();

      let admin = await Admin.findOne({ email: googleEmail });

      if (!admin) {
        admin = await Admin.create({
          email: googleEmail,
          googleId: sub,
          name,
          avatar: picture,
          isGoogleAuth: true,
        });
      }

      return sendToken(admin, res);
    }

    if (!email || !password) {
      return res.status(BAD_REQUEST).json({
        error: "Email and password required",
        code: "MISSING_CREDENTIALS",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(UNAUTHORIZED).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      });
    }

    sendToken(admin, res);
  } catch (err) {
    console.error("Login error:", err);
    res.status(SERVER_ERROR).json({
      error: "Login failed",
      code: "LOGIN_ERROR",
    });
  }
}

// 🔄 Refresh Token
/**
 * Refreshes JWT token for authenticated admin
 */
async function refreshToken(req, res) {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(UNAUTHORIZED).json({
        error: "Admin not found",
        code: "ADMIN_NOT_FOUND",
      });
    }

    const token = generateToken(admin);
    res.json({ token });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(FORBIDDEN).json({
      error: "Invalid refresh token",
      code: "INVALID_REFRESH_TOKEN",
    });
  }
}

// ✅ Validate Session
/**
 * Returns current authenticated admin session data
 */
const validate = (req, res) => {
  res.json({
    user: {
      id: req.admin.id,
      email: req.admin.email,
      name: req.admin.name,
      avatar: req.admin.avatar,
    },
  });
};

// 👤 Get Admin
/**
 * Retrieves admin details by ID
 */
async function getUser(req, res) {
  try {
    const admin = await Admin.findById(req.params.userId);

    if (!admin) {
      return res.status(404).json({
        error: "Admin not found",
        code: "ADMIN_NOT_FOUND",
      });
    }

    res.json({
      id: admin._id,
      email: admin.email,
      name: admin.name,
      avatar: admin.avatar,
      isGoogleAuth: admin.isGoogleAuth,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      error: "Server error retrieving user",
      code: "USER_FETCH_ERROR",
    });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await Admin.find(
      {},
      "email warnings banUntil isGoogleAuth createdAt"
    ).sort({ createdAt: -1 });

    res.json({ users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function banUser(req, res) {
  try {
    const { userId } = req.params;
    const { duration, reason } = req.body;

    const banUntil = new Date();
    banUntil.setHours(banUntil.getHours() + duration);

    await Admin.findByIdAndUpdate(userId, {
      banUntil,
      $push: {
        banHistory: {
          bannedBy: req.admin.id,
          reason,
          duration,
          bannedAt: new Date(),
        },
      },
    });

    res.json({ message: "User banned successfully" });
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({ error: "Failed to ban user" });
  }
}

async function unbanUser(req, res) {
  try {
    const { userId } = req.params;

    await Admin.findByIdAndUpdate(userId, {
      banUntil: null,
    });

    res.json({ message: "User unbanned successfully" });
  } catch (err) {
    console.error("Unban user error:", err);
    res.status(500).json({ error: "Failed to unban user" });
  }
}

async function issueWarning(req, res) {
  try {
    const { userId } = req.params;

    const user = await Admin.findById(userId);
    user.warnings += 1;

    // Auto-ban if 3+ warnings
    if (user.warnings >= 3) {
      user.banUntil = new Date();
      user.banUntil.setHours(user.banUntil.getHours() + 24);
      user.warnings = 0;
    }

    await user.save();

    res.json({
      message: "Warning issued successfully",
      autoBanned: user.warnings === 0,
    });
  } catch (err) {
    console.error("Issue warning error:", err);
    res.status(500).json({ error: "Failed to issue warning" });
  }
}

/**
 * Retrieves a paginated list of flagged users with optional filtering by severity and flag type.
 * Also returns summary statistics and risk analysis for each user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFlaggedUsers(req, res) {
  try {
    const { page = 1, limit = 10, severity, flagType } = req.query;

    const query = {
      $or: [
        { warnings: { $gte: 1 } },
        { banUntil: { $exists: true } },
        { "flagHistory.0": { $exists: true } },
      ],
    };

    if (severity) {
      query["flagHistory.actionTaken"] = severity;
    }
    if (flagType) {
      query["flagHistory.reason"] = flagType;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "systemId encryptedEmail warnings banUntil flagHistory notifications lastLogin createdAt"
        )
        .populate("flagHistory.feedback", "text category sentiment timestamp")
        .sort({ "flagHistory.timestamp": -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    // Decrypt emails for admin view while maintaining privacy
    const processedUsers = users.map((user) => ({
      ...user.toObject(),
      email: user.encryptedEmail ? decryptEmail(user.encryptedEmail) : "N/A",
      riskLevel: calculateRiskLevel(user),
      lastViolation: user.flagHistory[0]?.timestamp || null,
      flagSummary: getFlagSummary(user.flagHistory),
    }));

    res.json({
      users: processedUsers,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      statistics: await getFlaggedUserStats(),
    });
  } catch (err) {
    console.error("Get flagged users error:", err);
    res.status(500).json({ error: "Failed to fetch flagged users" });
  }
}

/**
 * Retrieves detailed flag history and recent feedbacks for a specific user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserFlagHistory(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate(
        "flagHistory.feedback",
        "text category sentiment timestamp status"
      )
      .select(
        "systemId encryptedEmail warnings banUntil flagHistory lastLogin createdAt"
      );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userFeedbacks = await Feedback.find({ userId })
      .select("text category sentiment timestamp status adminActions")
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      user: {
        id: user._id,
        systemId: user.systemId,
        email: decryptEmail(user.encryptedEmail),
        warnings: user.warnings,
        banUntil: user.banUntil,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        riskLevel: calculateRiskLevel(user),
        isBanned: user.banUntil && user.banUntil > new Date(),
      },
      flagHistory: user.flagHistory.map((flag) => ({
        ...flag.toObject(),
        feedback: flag.feedback
          ? {
              text: flag.feedback.text.substring(0, 200) + "...",
              category: flag.feedback.category,
              sentiment: flag.feedback.sentiment,
              timestamp: flag.feedback.timestamp,
              status: flag.feedback.status,
            }
          : null,
      })),
      recentFeedbacks: userFeedbacks,
      activityMetrics: await getUserActivityMetrics(userId),
    });
  } catch (err) {
    console.error("Get user flag history error:", err);
    res.status(500).json({ error: "Failed to fetch user flag history" });
  }
}

/**
 * Applies a bulk moderation action (ban, unban, warn, clear flags) to multiple users.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function bulkUserAction(req, res) {
  try {
    const { userIds, action, duration, reason } = req.body;
    const adminId = req.admin._id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    const results = [];

    for (const userId of userIds) {
      try {
        let result;
        switch (action) {
          case "ban":
            result = await bulkBanUser(userId, duration, reason, adminId);
            break;
          case "unban":
            result = await bulkUnbanUser(userId, adminId);
            break;
          case "warning":
            result = await bulkWarnUser(userId, reason, adminId);
            break;
          case "clearFlags":
            result = await clearUserFlags(userId, adminId);
            break;
          default:
            result = { success: false, error: "Invalid action" };
        }
        results.push({ userId, ...result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    res.json({
      message: `Bulk action completed: ${successCount}/${userIds.length} users processed`,
      results,
      summary: {
        total: userIds.length,
        success: successCount,
        failed: userIds.length - successCount,
      },
    });
  } catch (err) {
    console.error("Bulk user action error:", err);
    res.status(500).json({ error: "Bulk action failed" });
  }
}

/**
 * Retrieves admin activity logs based on moderation actions taken on feedback.
 * Supports filtering by action type and date range.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAdminActivityLog(req, res) {
  try {
    const { page = 1, limit = 20, action, startDate, endDate } = req.query;

    const feedbackActions = await Feedback.aggregate([
      { $unwind: "$adminActions" },
      {
        $match: {
          ...(action && { "adminActions.action": action }),
          ...(startDate && {
            "adminActions.timestamp": { $gte: new Date(startDate) },
          }),
          ...(endDate && {
            "adminActions.timestamp": { $lte: new Date(endDate) },
          }),
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "adminActions.adminId",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $sort: { "adminActions.timestamp": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) },
    ]);

    res.json({
      activities: feedbackActions.map((item) => ({
        action: item.adminActions.action,
        timestamp: item.adminActions.timestamp,
        notes: item.adminActions.notes,
        admin: item.admin[0]
          ? {
              name: item.admin[0].name,
              email: item.admin[0].email,
            }
          : null,
        feedback: {
          id: item._id,
          text: item.text.substring(0, 100) + "...",
          category: item.category,
        },
      })),
      pagination: {
        currentPage: Number(page),
        hasMore: feedbackActions.length === Number(limit),
      },
    });
  } catch (err) {
    console.error("Admin activity log error:", err);
    res.status(500).json({ error: "Failed to fetch admin activity log" });
  }
}

/**
 * Calculates the risk level of a user based on warnings, recent flags, and ban status.
 *
 * @param {Object} user - Mongoose User document
 * @returns {String} - Risk level: NONE | LOW | MEDIUM | HIGH
 */
function calculateRiskLevel(user) {
  const warnings = user.warnings || 0;
  const flagCount = user.flagHistory?.length || 0;
  const recentFlags =
    user.flagHistory?.filter(
      (flag) =>
        new Date(flag.timestamp) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length || 0;

  if (user.banUntil && user.banUntil > new Date()) return "HIGH";
  if (warnings >= 2 || recentFlags >= 3) return "MEDIUM";
  if (warnings >= 1 || flagCount >= 2) return "LOW";
  return "NONE";
}

/**
 * Aggregates a summary count of flag reasons for a user's flag history.
 *
 * @param {Array} flagHistory - Array of flag objects
 * @returns {Object} - Summary object with reason counts
 */
function getFlagSummary(flagHistory = []) {
  const summary = {};
  flagHistory.forEach((flag) => {
    summary[flag.reason] = (summary[flag.reason] || 0) + 1;
  });
  return summary;
}

/**
 * Aggregates and returns statistics about all flagged users in the system.
 *
 * @returns {Object} - Flag statistics including total flagged, banned, and high-risk users
 */
async function getFlaggedUserStats() {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalFlagged: { $sum: { $cond: [{ $gt: ["$warnings", 0] }, 1, 0] } },
        currentlyBanned: {
          $sum: { $cond: [{ $gt: ["$banUntil", new Date()] }, 1, 0] },
        },
        highRisk: { $sum: { $cond: [{ $gte: ["$warnings", 2] }, 1, 0] } },
      },
    },
  ]);

  return stats[0] || { totalFlagged: 0, currentlyBanned: 0, highRisk: 0 };
}

/**
 * Retrieves basic user activity metrics including total feedbacks, flag count,
 * last activity timestamp, and average feedbacks per day.
 *
 * @param {String} userId - MongoDB ObjectId of the user
 * @returns {Object} - User activity metrics
 */
async function getUserActivityMetrics(userId) {
  const [feedbackCount, flagCount, lastActivity] = await Promise.all([
    Feedback.countDocuments({ userId }),
    User.findById(userId).then((user) => user?.flagHistory?.length || 0),
    Feedback.findOne({ userId }).sort({ timestamp: -1 }).select("timestamp"),
  ]);

  return {
    totalFeedbacks: feedbackCount,
    totalFlags: flagCount,
    lastActivity: lastActivity?.timestamp,
    avgFeedbacksPerDay:
      feedbackCount /
      Math.max(
        1,
        Math.ceil(
          (new Date() - new Date(lastActivity?.timestamp || Date.now())) /
            (1000 * 60 * 60 * 24)
        )
      ),
  };
}

module.exports = {
  signup,
  login,
  refreshToken,
  validate,
  getUser,
  getAllUsers,
  banUser,
  unbanUser,
  issueWarning,
  getFlaggedUsers,
  getUserFlagHistory,
  bulkUserAction,
  getAdminActivityLog,
};
