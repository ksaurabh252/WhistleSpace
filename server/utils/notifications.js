const User = require("../models/User.model");
const Admin = require("../models/Admin.model");
const nodemailer = require("nodemailer");

/**
 * Email transporter configuration using Gmail.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

/**
 * Predefined templates for various notification scenarios.
 */
const NOTIFICATION_TEMPLATES = {
  FIRST_WARNING: {
    title: "⚠️ Community Guidelines Reminder",
    message:
      "You have been flagged once for potentially inappropriate content. Please review our community guidelines to ensure your future submissions are constructive and respectful.",
    type: "warning",
    severity: "low",
  },
  SECOND_WARNING: {
    title: "⚠️ Second Warning - Account at Risk",
    message:
      "You have received two warnings for policy violations. One more violation may result in temporary account suspension. Please ensure all future feedback follows our community standards.",
    type: "warning",
    severity: "medium",
  },
  FINAL_WARNING: {
    title: "🚨 Final Warning - Immediate Action Required",
    message:
      "This is your final warning. You have accumulated multiple violations. Any further inappropriate behavior will result in account suspension. Please review our terms of service immediately.",
    type: "warning",
    severity: "high",
  },
  TEMPORARY_BAN: {
    title: "🚫 Account Temporarily Suspended",
    message:
      "Your account has been temporarily suspended for {duration} due to repeated policy violations. You can resume using the platform after {unbanDate}. During this time, please review our community guidelines.",
    type: "ban",
    severity: "critical",
  },
  ACCOUNT_UNBANNED: {
    title: "✅ Account Reinstated",
    message:
      "Your account suspension has been lifted. Welcome back! Please remember to follow our community guidelines to maintain a positive environment for all users.",
    type: "info",
    severity: "low",
  },
  HARASSMENT_DETECTED: {
    title: "🛡️ Content Under Review",
    message:
      "Your recent submission has been flagged for potential harassment. Our team is reviewing it. If you believe this is an error, please contact support.",
    type: "review",
    severity: "medium",
  },
  WELCOME: {
    title: "🎉 Welcome to WhistleSpace!",
    message:
      "Thank you for joining our community! Please take a moment to review our community guidelines to ensure a positive experience for everyone.",
    type: "info",
    severity: "low",
  },
};

/**
 * Sends a structured notification to the user.
 *
 * @param {string} userId - ID of the user to notify.
 * @param {string} templateKey - Key from the NOTIFICATION_TEMPLATES object.
 * @param {Object} variables - Variables to replace placeholders in message.
 * @param {boolean} sendEmail - Whether to also send the notification via email.
 * @returns {Promise<boolean>} - Success status.
 */
async function sendNotification(
  userId,
  templateKey,
  variables = {},
  sendEmail = false
) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return false;
    }

    const template = NOTIFICATION_TEMPLATES[templateKey];
    if (!template) {
      console.error(`Template not found: ${templateKey}`);
      return false;
    }

    // Replace placeholders with actual variables
    let message = template.message;
    Object.keys(variables).forEach((key) => {
      message = message.replace(new RegExp(`{${key}}`, "g"), variables[key]);
    });

    // Create the notification object
    const notification = {
      title: template.title,
      message,
      type: template.type,
      severity: template.severity,
      timestamp: new Date(),
      read: false,
      metadata: { templateKey, variables },
    };

    // Add notification to user and persist
    user.notifications.push(notification);
    await user.save();

    // Optional email delivery
    if (sendEmail && user.encryptedEmail) {
      await sendEmailNotification(user, notification);
    }

    console.log(
      `📨 Notification sent to user ${user.systemId}: ${template.title}`
    );

    // Emit via Socket.io if available
    if (global.io) {
      global.io.to(`user_${userId}`).emit("notification", notification);
    }

    return true;
  } catch (error) {
    console.error("Notification error:", error);
    return false;
  }
}

/**
 * Sends an email notification to the user.
 *
 * @param {Object} user - Mongoose user document.
 * @param {Object} notification - Notification object to send.
 */
async function sendEmailNotification(user, notification) {
  try {
    const { decryptEmail } = require("../controller/user.controller");
    const userEmail = decryptEmail(user.encryptedEmail);

    const mailOptions = {
      from: `"WhistleSpace Notifications" <${process.env.ADMIN_EMAIL}>`,
      to: userEmail,
      subject: `WhistleSpace - ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2>${notification.title}</h2>
          </div>
          <div style="padding: 20px; background: white; border-radius: 8px; border: 1px solid #e9ecef;">
            <p>${notification.message}</p>
            <hr />
            <p style="font-size: 14px; color: #888;">
              This notification was sent from WhistleSpace. <a href="${process.env.FRONTEND_URL}/profile">View all notifications</a>
            </p>
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/guidelines" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Community Guidelines</a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email notification sent to ${user.systemId}`);
  } catch (error) {
    console.error("Email notification error:", error);
  }
}

/**
 * Handles warnings for a user, escalating actions based on number of warnings.
 *
 * @param {string} userId - ID of the user being warned.
 * @param {string} [violationType='Harassment'] - Type of policy violation.
 * @param {string} [feedbackText=''] - Associated content or reason.
 * @returns {Promise<Object>} - Result of action taken.
 */
async function handleUserWarning(
  userId,
  violationType = "Harassment",
  feedbackText = ""
) {
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found" };

    await user.addFlag(violationType, feedbackText, "Warning");
    user.warnings += 1;

    const warningCount = user.warnings;
    let notificationKey;
    let banDuration = null;
    let actionTaken = "Warning";

    // Determine escalation based on warning count
    if (warningCount === 1) {
      notificationKey = "FIRST_WARNING";
    } else if (warningCount === 2) {
      notificationKey = "SECOND_WARNING";
    } else if (warningCount === 3) {
      notificationKey = "FINAL_WARNING";
    } else if (warningCount >= 4) {
      const banUntil = new Date();
      banUntil.setHours(banUntil.getHours() + 24);
      user.banUntil = banUntil;
      user.warnings = 0;
      banDuration = "24 hours";
      notificationKey = "TEMPORARY_BAN";
      actionTaken = "Temporary Ban";
      await user.addFlag(violationType, feedbackText, "Temporary Ban");
    }

    await user.save();

    // Send user notification
    const variables = {
      duration: banDuration || "",
      unbanDate: user.banUntil ? user.banUntil.toLocaleString() : "",
      violationType,
    };
    await sendNotification(userId, notificationKey, variables, true);

    // Notify admins if serious
    if (warningCount >= 3) {
      await notifyAdminsOfViolation(
        user,
        violationType,
        feedbackText,
        actionTaken
      );
    }

    return {
      success: true,
      warningCount,
      actionTaken,
      banUntil: user.banUntil,
      message: `User received ${actionTaken.toLowerCase()}`,
    };
  } catch (error) {
    console.error("Warning handling error:", error);
    return { success: false, error: "Failed to process warning" };
  }
}

/**
 * Notifies all admins about a serious user violation.
 *
 * @param {Object} user - Violating user document.
 * @param {string} violationType - Type of violation.
 * @param {string} feedbackText - Content involved.
 * @param {string} actionTaken - Action taken (e.g., Warning, Temporary Ban).
 */
async function notifyAdminsOfViolation(
  user,
  violationType,
  feedbackText,
  actionTaken
) {
  try {
    const admins = await Admin.find({});
    for (const admin of admins) {
      const mailOptions = {
        from: `"WhistleSpace Alert" <${process.env.ADMIN_EMAIL}>`,
        to: admin.email,
        subject: `🚨 User Violation Alert - ${actionTaken}`,
        html: `
          <h2>User Violation Alert</h2>
          <p><strong>Action Taken:</strong> ${actionTaken}</p>
          <p><strong>User ID:</strong> ${user.systemId}</p>
          <p><strong>Violation Type:</strong> ${violationType}</p>
          <p><strong>Warning Count:</strong> ${user.warnings}</p>
          <h3>Flagged Content:</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
            ${feedbackText.substring(0, 200)}${
          feedbackText.length > 200 ? "..." : ""
        }
          </div>
          <p><a href="${
            process.env.FRONTEND_URL
          }/admin/users">View User Management</a></p>
        `,
      };
      await transporter.sendMail(mailOptions);
    }
    console.log(
      `🚨 Admin notification sent for user ${user.systemId} violation`
    );
  } catch (error) {
    console.error("Admin notification error:", error);
  }
}

/**
 * Notifies a user when their account is unbanned.
 *
 * @param {string} userId - User ID.
 * @param {string} [unbannedBy='System'] - Who unbanned the user.
 */
async function notifyUserUnbanned(userId, unbannedBy = "System") {
  await sendNotification(userId, "ACCOUNT_UNBANNED", { unbannedBy }, true);
}

/**
 * Sends a welcome notification to a new user.
 *
 * @param {string} userId - User ID.
 */
async function sendWelcomeNotification(userId) {
  await sendNotification(userId, "WELCOME", {}, false);
}

/**
 * Marks one or more notifications as read.
 *
 * @param {string} userId - User ID.
 * @param {Array<string>} notificationIds - IDs of notifications to mark as read (optional).
 * @returns {Promise<boolean>} - Success status.
 */
async function markNotificationsAsRead(userId, notificationIds = []) {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    user.notifications.forEach((notification) => {
      if (
        notificationIds.length === 0 ||
        notificationIds.includes(notification._id.toString())
      ) {
        notification.read = true;
      }
    });

    await user.save();
    return true;
  } catch (error) {
    console.error("Mark notifications error:", error);
    return false;
  }
}

/**
 * Retrieves paginated notifications for a user.
 *
 * @param {string} userId - User ID.
 * @param {number} [page=1] - Page number.
 * @param {number} [limit=10] - Number of items per page.
 * @param {boolean} [unreadOnly=false] - Whether to return only unread notifications.
 * @returns {Promise<Object|null>} - Paginated notifications or null if failed.
 */
async function getUserNotifications(
  userId,
  page = 1,
  limit = 10,
  unreadOnly = false
) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    let notifications = user.notifications;
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const startIndex = (page - 1) * limit;
    const paginatedNotifications = notifications.slice(
      startIndex,
      startIndex + limit
    );

    return {
      notifications: paginatedNotifications,
      totalCount: notifications.length,
      unreadCount: user.notifications.filter((n) => !n.read).length,
      currentPage: page,
      totalPages: Math.ceil(notifications.length / limit),
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return null;
  }
}

module.exports = {
  sendNotification,
  handleUserWarning,
  notifyUserUnbanned,
  sendWelcomeNotification,
  markNotificationsAsRead,
  getUserNotifications,
  NOTIFICATION_TEMPLATES,
};
